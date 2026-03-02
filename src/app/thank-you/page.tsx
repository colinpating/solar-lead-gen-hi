import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <main className="thanks-page">
      <h1>Thanks, your request was received.</h1>
      <p>A solar specialist should contact you within one business day.</p>
      <p>To stop text outreach, reply STOP to any message.</p>
      <Link href="/">Return to homepage</Link>
    </main>
  );
}
