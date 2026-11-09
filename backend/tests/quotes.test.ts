import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("quotation requests persist, can be searched, and can be status-managed", async () => {
  const directory = mkdtempSync(join(tmpdir(), "docknest-test-"));
  process.env.DATABASE_PATH = join(directory, "test.db");

  try {
    const { db } = await import("../lib/db");
    db.exec("CREATE TABLE schema_migrations (name TEXT PRIMARY KEY NOT NULL)");
    db.exec("CREATE TABLE user (id TEXT PRIMARY KEY NOT NULL, name TEXT, email TEXT, role TEXT)");
    for (const migration of readdirSync(resolve("database/migrations")).filter((name) => name.endsWith(".sql")).sort()) {
      db.exec(readFileSync(resolve("database/migrations", migration), "utf8"));
      db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(migration);
    }
    db.prepare("INSERT INTO user (id, name, email, role) VALUES (?, ?, ?, ?)").run("test-admin", "Test Admin", "admin@example.com", "admin");

    const { defaultSiteContent, getSiteContent, saveSiteContent, siteContentSchema } =
      await import("../lib/site-content");
    const siteContent = getSiteContent();
    assert.equal(siteContent.home.heroLineOne, "A stronger home");
    const editedSiteContent = structuredClone(defaultSiteContent);
    editedSiteContent.home.heroLineOne = "A better digital home";
    editedSiteContent.home.showcaseCards[0]!.imageUrl = "/media/12345678-1234-1234-1234-123456789abc.webp";
    saveSiteContent(editedSiteContent, "test-admin");
    assert.equal(getSiteContent().home.heroLineOne, "A better digital home");
    assert.equal(
      siteContentSchema.safeParse({
        ...editedSiteContent,
        home: {
          ...editedSiteContent.home,
          showcaseCards: editedSiteContent.home.showcaseCards.map((card, index) =>
            index === 0 ? { ...card, imageUrl: "https://example.com/image.svg" } : card
          )
        }
      }).success,
      false
    );
    assert.equal(
      (db.prepare("SELECT COUNT(*) AS count FROM audit_logs WHERE action = 'site.content_saved'").get() as { count: number }).count,
      1
    );

    const { createQuoteRequest, listQuoteRequests, updateQuoteStatus } = await import("../lib/quotes");
    const { quoteRequestSchema } = await import("../../frontend/src/lib/quote");
    const request = quoteRequestSchema.parse({
      name: "Test Customer",
      email: "Customer@Example.com",
      phone: "+880 1712-345678",
      service: "Shared hosting",
      requirements: "A small business site with weekly backups."
    });

    const id = createQuoteRequest(request);
    assert.equal(listQuoteRequests("test customer").length, 1);
    assert.equal(listQuoteRequests("Customer@Example.com")[0]?.email, "customer@example.com");
    assert.equal(
      (db.prepare("SELECT phone FROM customers WHERE email = ?").get("customer@example.com") as { phone: string }).phone,
      "+880 1712-345678"
    );
    assert.equal(updateQuoteStatus(id, "reviewing", "test-admin"), true);
    assert.equal(listQuoteRequests()[0]?.status, "reviewing");
    assert.equal(updateQuoteStatus("missing-id", "approved", "test-admin"), false);
    assert.equal(
      quoteRequestSchema.safeParse({ ...request, service: "WordPress development" }).success,
      false
    );

    const { listProducts, saveAddon, saveProduct } = await import("../lib/catalog");
    const productId = saveProduct({
      name: "Configured Shared Plan",
      category: "hosting",
      description: "Test-only configured plan.",
      features: ["Test feature"],
      active: true,
      sortOrder: 1,
      startingPriceBdtMinor: 1000,
      startingPriceUsdMinor: 999,
      startingPricePeriod: "monthly",
      prices: [{ currency: "BDT", billing_period: "monthly", amount_minor: 1200 }]
    });
    const configuredProduct = listProducts("hosting").find((product) => product.id === productId);
    assert.equal(configuredProduct?.starting_price_bdt_minor, 1000);
    assert.equal(configuredProduct?.starting_price_usd_minor, 999);
    assert.equal(configuredProduct?.starting_price_period, "monthly");
    const addonId = saveAddon({
      name: "Configured Backup Add-on",
      description: "Test-only backup add-on.",
      active: true,
      prices: [{ currency: "BDT", billing_period: "monthly", amount_minor: 300 }]
    });
    const configuredQuote = createQuoteRequest(quoteRequestSchema.parse({
      ...request,
      service: "Configured Shared Plan",
      productId,
      addonIds: [addonId],
      currency: "BDT",
      billingPeriod: "monthly",
      requirements: "A configured shared hosting plan with backups."
    }));
    const estimate = db.prepare(
      "SELECT estimate_total_minor, currency FROM quote_requests WHERE id = ?"
    ).get(configuredQuote) as { estimate_total_minor: number; currency: string };
    assert.deepEqual(estimate, { estimate_total_minor: 1500, currency: "BDT" });
    const itemCount = db.prepare(
      "SELECT COUNT(*) AS count FROM quote_items WHERE quote_id = ?"
    ).get(configuredQuote) as { count: number };
    assert.equal(itemCount.count, 2);
    const {
      convertApprovedQuoteToOrder,
      listInvoices,
      listOrders,
      listPayments,
      reviewPayment,
      submitManualPayment,
      updateOrderStatus,
      updateQuoteProposal,
      voidInvoice
    } = await import("../lib/sales");

    assert.throws(() => convertApprovedQuoteToOrder(configuredQuote, "test-admin"), /approved quotation/);
    const configuredLines = listQuoteRequests().find((quote) => quote.id === configuredQuote)!.line_items;
    assert.equal(updateQuoteProposal(configuredQuote, {
      currency: "BDT",
      note: "Test quote",
      expiresAt: null,
      items: configuredLines.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitAmountMinor: item.unit_amount_minor
      }))
    }, "test-admin"), true);
    assert.equal(updateQuoteStatus(configuredQuote, "approved", "test-admin"), true);
    const orderId = convertApprovedQuoteToOrder(configuredQuote, "test-admin");
    assert.equal(updateQuoteStatus(configuredQuote, "approved", "test-admin"), false);
    const convertedOrder = listOrders().find((order) => order.id === orderId);
    assert.ok(convertedOrder?.invoice_number);
    assert.equal(convertedOrder?.total_minor, 1500);
    assert.equal(convertedOrder?.status, "awaiting_payment");
    const convertedLines = db.prepare(
      "SELECT product_id, addon_id FROM order_items WHERE order_id = ?"
    ).all(orderId) as Array<{ product_id: string | null; addon_id: string | null }>;
    assert.equal(convertedLines.length, 2);
    assert.ok(convertedLines.some((line) => line.product_id === productId));
    assert.ok(convertedLines.some((line) => line.addon_id === addonId));

    const rejectedPayment = submitManualPayment({
      orderNumber: convertedOrder.order_number,
      email: "customer@example.com",
      phone: "+880 1812-345678",
      method: "manual_bank",
      reference: "TEST-REJECTED",
      amountMinor: 1500
    });
    assert.equal(reviewPayment(rejectedPayment, "rejected", "Reference not found", "test-admin"), true);
    assert.equal(listPayments().find((payment) => payment.id === rejectedPayment)?.status, "rejected");

    const partialPayment = submitManualPayment({
      orderNumber: convertedOrder.order_number,
      email: "customer@example.com",
      phone: "+880 1812-345678",
      method: "manual_mobile",
      reference: "TEST-PARTIAL",
      amountMinor: 1000
    });
    assert.throws(() => submitManualPayment({
      orderNumber: convertedOrder.order_number,
      email: "customer@example.com",
      phone: "+880 1812-345678",
      method: "manual_bank",
      reference: "TEST-OVERPAY",
      amountMinor: 501
    }), /outstanding order balance/);
    assert.equal(reviewPayment(partialPayment, "approved", "Verified", "test-admin"), true);
    assert.equal(listOrders().find((order) => order.id === orderId)?.status, "awaiting_payment");

    const finalPayment = submitManualPayment({
      orderNumber: convertedOrder.order_number,
      email: "customer@example.com",
      phone: "+880 1812-345678",
      method: "manual_bank",
      reference: "TEST-FINAL",
      amountMinor: 500
    });
    assert.equal(reviewPayment(finalPayment, "approved", "Verified", "test-admin"), true);
    assert.equal(listOrders().find((order) => order.id === orderId)?.status, "paid");
    assert.equal(listInvoices().find((invoice) => invoice.order_number === convertedOrder.order_number)?.status, "paid");
    assert.equal(voidInvoice(
      listInvoices().find((invoice) => invoice.order_number === convertedOrder.order_number)!.id,
      "test-admin"
    ), false);

    const voidableQuote = createQuoteRequest(request);
    assert.equal(updateQuoteProposal(voidableQuote, {
      currency: "BDT",
      note: "",
      expiresAt: null,
      items: [{ description: "One-time service", quantity: 1, unitAmountMinor: 250 }]
    }, "test-admin"), true);
    assert.equal(updateQuoteStatus(voidableQuote, "approved", "test-admin"), true);
    const voidableOrderId = convertApprovedQuoteToOrder(voidableQuote, "test-admin");
    const voidableInvoice = listInvoices().find((invoice) =>
      invoice.order_number === listOrders().find((order) => order.id === voidableOrderId)?.order_number
    );
    assert.ok(voidableInvoice);
    const pendingVoidPayment = submitManualPayment({
      orderNumber: listOrders().find((order) => order.id === voidableOrderId)!.order_number,
      email: "customer@example.com",
      phone: "+880 1812-345678",
      method: "manual_bank",
      reference: "VOID-TEST-PENDING",
      amountMinor: 100
    });
    assert.equal(updateOrderStatus(voidableOrderId, "cancelled", "test-admin"), false);
    assert.equal(voidInvoice(voidableInvoice.id, "test-admin"), false);
    assert.equal(reviewPayment(pendingVoidPayment, "rejected", "Test rejection", "test-admin"), true);
    assert.equal(voidInvoice(voidableInvoice.id, "test-admin"), true);
    assert.equal(listInvoices().find((invoice) => invoice.id === voidableInvoice.id)?.status, "void");
    assert.equal(listOrders().find((order) => order.id === voidableOrderId)?.status, "cancelled");

    const { updateCustomer, listCustomers, getSalesAnalytics } = await import("../lib/sales");
    const customer = listCustomers("test customer")[0]!;
    assert.equal(updateCustomer(customer.id, {
      name: "Test Customer Updated",
      company: "Example Co",
      phone: "000-000",
      country: "BD",
      notes: "Follow up next week"
    }, "test-admin"), true);
    assert.equal(listCustomers("Example Co")[0]?.notes, "Follow up next week");

    const {
      addTicketMessage,
      createProject,
      createSupportTicket,
      listProjects,
      listSupportMessages,
      listSupportTickets,
      updateProject,
      updateTicket
    } = await import("../lib/operations");
    const projectId = createProject({
      customerId: customer.id,
      title: "Test website build",
      description: "Test project description",
      dueAt: "2030-01-01"
    }, "test-admin");
    assert.equal(updateProject(projectId, {
      status: "in_progress",
      dueAt: "2030-01-02",
      assignedTo: "test-admin"
    }, "test-admin"), true);
    assert.equal(listProjects().find((project) => project.id === projectId)?.status, "in_progress");

    const createdTicket = createSupportTicket({
      name: "Support Customer",
      email: "support@example.com",
      phone: "+880 1912-345678",
      subject: "Help with a test",
      body: "This is a test support message with sufficient detail."
    });
    const ticketId = createdTicket.id;
    assert.match(createdTicket.ticketNumber, /^DN-SUP-/);
    const ticket = listSupportTickets().find((entry) => entry.id === ticketId);
    assert.ok(ticket);
    assert.equal(
      (db.prepare("SELECT phone FROM customers WHERE email = ?").get("support@example.com") as { phone: string }).phone,
      "+880 1912-345678"
    );
    assert.equal(ticket.message_count, 1);
    assert.equal(updateTicket(ticketId, {
      status: "in_progress",
      priority: "high",
      assignedTo: "test-admin"
    }, "test-admin"), true);
    assert.equal(addTicketMessage(ticketId, {
      authorId: "test-admin",
      authorName: "Test Admin",
      body: "Internal investigation note",
      internal: true
    }), true);
    assert.equal(listSupportMessages(ticketId).filter((message) => message.internal === 1).length, 1);

    const { saveArticle, listPublishedArticles, getPublishedArticle } = await import("../lib/content");
    const articleId = saveArticle({
      slug: "test-help-guide",
      title: "Test Help Guide",
      summary: "A test-only published help article.",
      body: "This article contains enough text to validate content storage and display.",
      kind: "knowledge",
      status: "published"
    }, "test-admin");
    assert.equal(listPublishedArticles("knowledge").length, 1);
    assert.equal(getPublishedArticle("knowledge", "test-help-guide")?.id, articleId);
    assert.equal(getPublishedArticle("blog", "test-help-guide"), null);

    const { createDomainRequest, listDomainRequests } = await import("../lib/domains");
    const originalDomainFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      if (String(input) === "https://data.iana.org/rdap/dns.json") {
        return new Response(JSON.stringify({
          services: [[["com", "net"], ["https://rdap.example.test/"]]]
        }), { headers: { "content-type": "application/json" } });
      }
      if (String(input).startsWith("https://rdap.example.test/domain/")) {
        return new Response(null, { status: 404 });
      }
      return originalDomainFetch(input, init);
    };
    let domainId: string;
    try {
      const domainRequest = await createDomainRequest({
        domain: "example.com",
        name: "Domain Customer",
        email: "domain@example.com",
        phone: "+880 1612-345678"
      });
      domainId = domainRequest.id;
      assert.equal(domainRequest.status, "available");
    } finally {
      globalThis.fetch = originalDomainFetch;
    }
    assert.equal(listDomainRequests().find((item) => item.id === domainId)?.status, "available");
    assert.equal(
      (db.prepare("SELECT phone FROM customers WHERE email = ?").get("domain@example.com") as { phone: string }).phone,
      "+880 1612-345678"
    );
    const { rdapRegistrarAdapter } = await import("../lib/registrar");
    assert.deepEqual(await rdapRegistrarAdapter.registerDomain("example.com"), {
      registered: false,
      reason: "Domain registration is not connected. Availability checks are informational; Docknest must complete registration through a registrar."
    });
    assert.equal(getSalesAnalytics().open_tickets, 1);

    db.prepare("INSERT INTO user (id, name, email, role) VALUES (?, ?, ?, ?)").run(
      "staff-test", "Test Staff", "staff@example.com", "customer"
    );
    const {
      assignStaffRoles,
      getStaffPermissions,
      hasStaffPermission,
      listStaffRoles,
      listStaffUsers,
      saveStaffRole
    } = await import("../lib/staff");
    const roleId = saveStaffRole({
      name: "support-agent",
      description: "Handle customer support",
      permissions: ["support.manage"]
    }, "test-admin");
    assert.equal(assignStaffRoles("staff-test", [roleId], "test-admin"), true);
    assert.equal(hasStaffPermission("staff-test", "support.manage"), true);
    assert.deepEqual(getStaffPermissions("staff-test"), ["support.manage"]);
    assert.equal(listStaffRoles().find((role) => role.id === roleId)?.name, "support-agent");
    assert.deepEqual(listStaffUsers().find((user) => user.id === "staff-test")?.roles, ["support-agent"]);
    assert.equal(assignStaffRoles("test-admin", [roleId], "test-admin"), false);
    assert.throws(() => saveStaffRole({
      name: "admin",
      description: "Do not replace the built-in role",
      permissions: []
    }, "test-admin"), /built-in administrator role/);

    const { dispatchQueuedEmails, enqueueEmail, listEmailOutbox, retryEmail } = await import("../lib/email");
    const outbox = listEmailOutbox();
    assert.ok(outbox.some((mail) => mail.recipient === "support@example.com" && mail.status === "queued"));
    const failedMail = enqueueEmail("retry@example.com", "Retry test", "Queued for a retry-state test.");
    db.prepare("UPDATE email_outbox SET status = 'failed', last_error = 'Test delivery failure' WHERE id = ?").run(failedMail);
    assert.equal(retryEmail(failedMail), true);
    assert.equal(listEmailOutbox().find((mail) => mail.id === failedMail)?.status, "queued");
    const smtpKeys = ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM", "SMTP_USER", "SMTP_PASSWORD"] as const;
    const savedSmtp = Object.fromEntries(smtpKeys.map((key) => [key, process.env[key]]));
    for (const key of smtpKeys) delete process.env[key];
    try {
      await assert.rejects(dispatchQueuedEmails(), /SMTP is not configured/);
    } finally {
      for (const key of smtpKeys) {
        const value = savedSmtp[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }

    const { POST } = await import("../../frontend/src/app/api/quotes/route");
    const response = await POST(
      new Request("http://localhost/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json", "x-real-ip": "203.0.113.15" },
        body: JSON.stringify({
          name: "API Test",
          email: "api-test@example.invalid",
          phone: "+880 1712-000000",
          service: "Business hosting",
          requirements: "A business website and email-ready hosting."
        })
      })
    );
    assert.equal(response.status, 201);
    assert.equal((await response.json()).ok, true);

    const invalidResponse = await POST(
      new Request("http://localhost/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json", "x-real-ip": "203.0.113.16" },
        body: "{invalid-json"
      })
    );
    assert.equal(invalidResponse.status, 400);

    const { POST: createTicket } = await import("../../frontend/src/app/api/support/tickets/route");
    const supportResponse = await createTicket(new Request("http://localhost/api/support/tickets", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "203.0.113.17" },
      body: JSON.stringify({
        name: "API Support Customer",
        email: "api-support@example.com",
        phone: "+880 1812-000000",
        subject: "API support request",
        body: "A sufficiently detailed request for support API testing."
      })
    }));
    assert.equal(supportResponse.status, 201);
    assert.match((await supportResponse.json()).ticketNumber, /^DN-SUP-/);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      if (String(input) === "https://data.iana.org/rdap/dns.json") {
        return new Response(JSON.stringify({
          services: [[["net"], ["https://rdap.example.test/"]]]
        }), { headers: { "content-type": "application/json" } });
      }
      if (String(input) === "https://rdap.example.test/domain/api-example.net") {
        return new Response(null, { status: 404 });
      }
      return originalFetch(input, init);
    };
    try {
      const { GET: lookupDomain, POST: requestDomain } = await import("../../frontend/src/app/api/domains/route");
      const lookupResponse = await lookupDomain(new Request("http://localhost/api/domains?domain=api-example.net"));
      assert.equal(lookupResponse.status, 200);
      assert.equal((await lookupResponse.json()).status, "available");

      const domainResponse = await requestDomain(new Request("http://localhost/api/domains", {
        method: "POST",
        headers: { "content-type": "application/json", "x-real-ip": "203.0.113.18" },
        body: JSON.stringify({
          domain: "api-example.net",
          name: "API Domain Customer",
          email: "api-domain@example.com",
          phone: "+880 1912-000000"
        })
      }));
      assert.equal(domainResponse.status, 201);
      assert.equal((await domainResponse.json()).status, "available");
    } finally {
      globalThis.fetch = originalFetch;
    }

    const { POST: submitPayment } = await import("../../frontend/src/app/api/payments/route");
    const closedPaymentResponse = await submitPayment(new Request("http://localhost/api/payments", {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "203.0.113.19" },
      body: JSON.stringify({
        orderNumber: listOrders().find((order) => order.id === voidableOrderId)!.order_number,
        email: "customer@example.com",
        phone: "+880 1712-000000",
        method: "manual_bank",
        reference: "CANCELLED-ORDER",
        amountMinor: 1
      })
    }));
    assert.equal(closedPaymentResponse.status, 400);

    const { GET: healthCheck } = await import("../../frontend/src/app/api/health/route");
    assert.equal((await healthCheck()).status, 200);
    db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
