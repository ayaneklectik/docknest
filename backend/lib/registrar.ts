export type RegistrarCheckResult = {
  status: "manual_check_required" | "available" | "unavailable";
  reference: string | null;
  message: string;
};

type RegistryService = {
  suffixes: string[];
  urls: string[];
};

type BootstrapResponse = {
  services?: unknown;
};

export interface DomainRegistrarAdapter {
  checkAvailability(domain: string): Promise<RegistrarCheckResult>;
  registerDomain(domain: string): Promise<{ registered: false; reason: string }>;
}

const bootstrapUrl = "https://data.iana.org/rdap/dns.json";
const bootstrapTtl = 24 * 60 * 60 * 1000;
let registryServices: RegistryService[] | undefined;
let bootstrapExpiresAt = 0;
let bootstrapRequest: Promise<RegistryService[]> | undefined;

async function getRegistryServices(): Promise<RegistryService[]> {
  if (registryServices && Date.now() < bootstrapExpiresAt) return registryServices;
  if (!bootstrapRequest) {
    bootstrapRequest = (async () => {
      const response = await fetch(bootstrapUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error(`IANA RDAP bootstrap returned HTTP ${response.status}.`);
      const payload = await response.json() as BootstrapResponse;
      if (!Array.isArray(payload.services)) throw new Error("IANA RDAP bootstrap response is invalid.");
      return payload.services.flatMap((service): RegistryService[] => {
        if (!Array.isArray(service) || !Array.isArray(service[0]) || !Array.isArray(service[1])) return [];
        return [{
          suffixes: service[0].filter((suffix): suffix is string => typeof suffix === "string"),
          urls: service[1].filter((url): url is string => typeof url === "string")
        }];
      });
    })();
  }
  try {
    registryServices = await bootstrapRequest;
    bootstrapExpiresAt = Date.now() + bootstrapTtl;
    return registryServices;
  } finally {
    bootstrapRequest = undefined;
  }
}

function findRegistry(domain: string, services: RegistryService[]): string | undefined {
  const suffixes = services.flatMap((service) =>
    service.suffixes
      .filter((suffix) => domain === suffix || domain.endsWith(`.${suffix}`))
      .map((suffix) => ({ suffix, urls: service.urls }))
  ).sort((left, right) => right.suffix.length - left.suffix.length);

  for (const match of suffixes) {
    const url = match.urls.find((candidate) => {
      try {
        return new URL(candidate).protocol === "https:";
      } catch {
        return false;
      }
    });
    if (url) return url;
  }
  return undefined;
}

export const rdapRegistrarAdapter: DomainRegistrarAdapter = {
  async checkAvailability(domain) {
    const services = await getRegistryServices();
    const registry = findRegistry(domain, services);
    if (!registry) {
      return {
        status: "manual_check_required",
        reference: null,
        message: "Live checks are not available for this extension. Docknest can verify it manually."
      };
    }

    const response = await fetch(
      `${registry.replace(/\/+$/, "")}/domain/${encodeURIComponent(domain)}`,
      {
        headers: { Accept: "application/rdap+json, application/json" },
        signal: AbortSignal.timeout(8000)
      }
    );
    if (response.status === 404) {
      return {
        status: "available",
        reference: null,
        message: "The registry reports this domain as unregistered. Availability can change and must be confirmed at checkout."
      };
    }
    if (!response.ok) throw new Error(`The domain registry returned HTTP ${response.status}.`);
    const record = await response.json().catch(() => null) as { handle?: unknown } | null;
    return {
      status: "unavailable",
      reference: typeof record?.handle === "string" ? record.handle : null,
      message: "The registry reports this domain as already registered."
    };
  },
  async registerDomain() {
    return {
      registered: false,
      reason: "Domain registration is not connected. Availability checks are informational; Docknest must complete registration through a registrar."
    };
  }
};
