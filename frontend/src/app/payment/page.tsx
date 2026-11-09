import type { Metadata } from "next";
import { PaymentSubmissionForm } from "@/components/payment-submission-form";

export const metadata: Metadata = {
  title: "Submit Payment Details",
  description: "Submit manual payment details for an existing Docknest order; all submissions are manually reviewed."
};

export default function PaymentPage() {
  return <div className="page-shell">
    <section className="page-hero compact-hero"><p className="eyebrow">MANUAL PAYMENT REVIEW</p><h1>Send payment<br /><em>details securely.</em></h1><p className="hero-lede">This page records payment references for a human review only. It does not collect card details or connect to a payment gateway.</p></section>
    <section className="content-section quote-section">
      <div className="quote-intro"><div className="section-kicker">Before you submit</div><h2>Keep sensitive details out.</h2><p>Do not enter card numbers, passwords, PINs, or banking credentials. Only the transfer reference and amount are requested.</p></div>
      <PaymentSubmissionForm />
    </section>
  </div>;
}
