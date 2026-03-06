import Link from 'next/link';
import { Suspense } from 'react';
import { LeadForm } from '@/components/LeadForm';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { SocialProof } from '@/components/SocialProof';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Hawaii Homeowners</p>
          <h1>Cut power bills with a local solar estimate in minutes.</h1>
          <p>
            Compare options for lower monthly electricity costs, outage resilience, and federal tax credit eligibility. No obligation.
          </p>
          <a href="#lead-form-bottom" className="cta-link">
            Check My Savings
          </a>
          <p className="fine-print">Tax credit availability varies by eligibility and filing status.</p>
        </div>
        <Suspense fallback={<div className="lead-form">Loading form...</div>}>
          <LeadForm sectionId="top" />
        </Suspense>
      </section>

      <SavingsCalculator />

      <section className="trust-strip">
        <p>Licensed installer network</p>
        <p>Local call-back windows</p>
        <p>Transparent proposal process</p>
      </section>

      <section className="content-grid">
        <article>
          <h2>Why homeowners go solar in Hawaii</h2>
          <ul>
            <li>Offset high grid electricity costs.</li>
            <li>Add backup resilience for outages with battery options.</li>
            <li>Lock in predictable long-term energy economics.</li>
          </ul>
        </article>
        <article>
          <h2>How it works</h2>
          <ol>
            <li>Submit your address and contact details.</li>
            <li>We run a preliminary home fit + value proxy review.</li>
            <li>A solar specialist contacts you with next-step options.</li>
          </ol>
        </article>
      </section>

      <SocialProof />

      <section className="faq">
        <h2>FAQ</h2>
        <details>
          <summary>Is this a binding purchase agreement?</summary>
          <p>No. This form starts a quote conversation only.</p>
        </details>
        <details>
          <summary>How quickly will I hear back?</summary>
          <p>Usually within one business day based on your preferred contact window.</p>
        </details>
        <details>
          <summary>Will I get text messages?</summary>
          <p>Only if you provide consent in the form. You can opt out anytime by replying STOP.</p>
        </details>
      </section>

      <section id="lead-form-bottom" className="bottom-form">
        <Suspense fallback={<div className="lead-form">Loading form...</div>}>
          <LeadForm sectionId="bottom" />
        </Suspense>
      </section>

      <footer>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
