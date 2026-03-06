import Link from 'next/link';
import { Suspense } from 'react';
import { LeadForm } from '@/components/LeadForm';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { ScrollToButton } from '@/components/ScrollToButton';

export default function HomePage() {
  return (
    <main>
      <section className="hero hero-single">
        <div>
          <p className="eyebrow">Hawaii Homeowners</p>
          <h1>Cut power bills with a local solar quote in minutes.</h1>
          <p>
            Compare options for lower monthly electricity costs, outage resilience, and federal tax credit eligibility. No obligation.
          </p>
          <ScrollToButton targetId="savings-preview" className="cta-link">
            Check My Savings
          </ScrollToButton>
          <p className="fine-print">Tax credit availability varies by eligibility and filing status.</p>
        </div>
      </section>

      <SavingsCalculator />
      
      <section id="quote-form" className="bottom-form">
        <Suspense fallback={<div className="lead-form">Loading form...</div>}>
          <LeadForm sectionId="quote" />
        </Suspense>
      </section>

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

      <footer>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms</Link>
      </footer>
    </main>
  );
}
