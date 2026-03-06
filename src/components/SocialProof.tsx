const STATS = [
  { value: '500+', label: 'Hawaii Homes Evaluated' },
  { value: 'Licensed', label: 'Insured Installers' },
  { value: '4.8\u2605', label: 'Average Installer Rating' },
  { value: '$0 Down', label: 'Financing Available' },
];

// Replace with real testimonials when available.
const TESTIMONIALS = [
  {
    quote: 'Our electric bill dropped from $380 to under $30. The process was straightforward and the installer was professional.',
    name: 'K. Tanaka',
    location: 'Kailua, Oahu',
  },
  {
    quote: 'I was skeptical about the savings estimates, but they turned out to be conservative. We are saving even more than projected.',
    name: 'M. Silva',
    location: 'Kihei, Maui',
  },
  {
    quote: 'The whole process from estimate to installation took about six weeks. Wish I had done it years ago.',
    name: 'J. Reyes',
    location: 'Hilo, Big Island',
  },
];

export function SocialProof() {
  return (
    <section className="social-proof">
      <div className="trust-strip">
        {STATS.map((s) => (
          <div key={s.label}>
            <strong>{s.value}</strong> {s.label}
          </div>
        ))}
      </div>
      <h2>What Hawaii Homeowners Are Saying</h2>
      <div className="testimonial-grid">
        {TESTIMONIALS.map((t) => (
          <blockquote key={t.name} className="testimonial-card">
            <p>&ldquo;{t.quote}&rdquo;</p>
            <footer>
              <strong>{t.name}</strong> &mdash; {t.location}
            </footer>
          </blockquote>
        ))}
      </div>
      <p className="fine-print">Representative examples. Individual results vary.</p>
    </section>
  );
}
