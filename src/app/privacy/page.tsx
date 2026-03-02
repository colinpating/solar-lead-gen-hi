export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <h1>Privacy Policy</h1>
      <p>We collect contact, address, and qualification details to provide solar estimate outreach and lead processing.</p>
      <h2>Data we collect</h2>
      <ul>
        <li>Contact details: name, email, phone, preferred contact time.</li>
        <li>Property details: address and user-provided qualifiers.</li>
        <li>Consent metadata: checkbox responses, timestamp, IP, user agent, and source attribution.</li>
      </ul>
      <h2>How we use data</h2>
      <ul>
        <li>Coordinate solar estimate follow-up by phone, SMS, and email when consented.</li>
        <li>Evaluate address-based solar fit signals and proxy home value enrichment.</li>
        <li>Operate internal lead reporting and audit exports.</li>
      </ul>
      <h2>Retention and opt-out</h2>
      <p>
        Leads are retained for business and compliance records. You may request opt-out from outreach anytime; SMS opt-out is available by replying STOP.
      </p>
    </main>
  );
}
