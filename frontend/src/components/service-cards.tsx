import Link from "next/link";

const plans = [
  { number: "01", name: "Shared hosting", description: "A considered start for personal sites, portfolios, and early ideas.", features: ["Managed setup", "SSL-ready environment", "Backup options"] },
  { number: "02", name: "Business hosting", description: "More room, support, and reliability for a growing business.", features: ["Business-focused resources", "Security options", "Priority support"] },
  { number: "03", name: "Managed VPS", description: "Dedicated resources with a hands-on team to help you run them.", features: ["Custom resource sizing", "Managed operations", "Infrastructure consultation"] },
  { number: "04", name: "E-commerce hosting", description: "A dependable foundation for a store and its customer journeys.", features: ["Performance planning", "Security review", "Growth-ready architecture"] }
];

export function ServiceCards({ prices }: { prices: string[] }) {
  return (
    <div className="plan-grid">
      {plans.map((plan, index) => (
        <article className={`plan-card hosting-plan-card hosting-plan-card-${index}`} key={plan.number}>
          <div className={`hosting-card-visual hosting-card-visual-${index}`} aria-hidden="true">
            <div className="hosting-visual-top"><span>DOCKNEST / INFRASTRUCTURE</span><i><b /></i></div>
            {index === 0 && <div className="hosting-server-stack"><div><i /><b>WEB / NODE</b><small>APPLICATION</small></div><div><i /><b>DATA / STORE</b><small>DATABASE</small></div><div><i /><b>BACKUP / PLAN</b><small>RECOVERY</small></div></div>}
            {index === 1 && <div className="hosting-traffic"><div><span>TRAFFIC / SAMPLE</span><b>Workload</b><small>Performance preview</small></div><div>{[28, 44, 35, 54, 43, 69, 57, 82, 70, 100, 79, 91].map((height, bar) => <i key={bar} style={{ height: `${height}%` }} />)}</div></div>}
            {index === 2 && <div className="hosting-vps-rack"><div><i /><i /><i /><b>NODE 01 <span>●</span></b></div><div><i /><i /><i /><b>NODE 02 <span>●</span></b></div><div><i /><i /><i /><b>NODE 03 <span>●</span></b></div></div>}
            {index === 3 && <div className="hosting-storefront"><div className="hosting-store-window"><span>YOUR STORE / DEMO</span><b>Everything<br />in its place.</b><i /></div><div className="hosting-store-stats"><span>ORDER FLOW <b>PREVIEW</b></span><span>PAYMENT <b>CHECKOUT</b></span></div></div>}
            <span className="hosting-orbit hosting-orbit-one" /><span className="hosting-orbit hosting-orbit-two" />
          </div>
          <div className="plan-top"><span>{plan.number}</span><span className="plan-dot" /></div>
          <h3>{plan.name}</h3>
          <p>{plan.description}</p>
          <div className="plan-price">
            {prices[index]
              ? `Starting from ${prices[index]}`
              : <>Custom quote <span>· configured to your needs</span></>}
          </div>
          <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <Link href={`/quote?service=${encodeURIComponent(plan.name)}`}>Discuss this plan <span aria-hidden="true">↗</span></Link>
        </article>
      ))}
    </div>
  );
}
