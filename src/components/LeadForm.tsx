"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CONSENT_TEXT } from '@/lib/consent';
import { SOLAR_PARTNERS } from '@/lib/partners';

type Props = {
  sectionId: string;
};

type FormState = {
  first_name: string;
  last_name: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  best_time_to_contact: 'morning' | 'afternoon' | 'evening' | 'anytime';
  homeowner_status: '' | 'owner' | 'renter' | 'other';
  monthly_electric_bill_range: '' | 'under_100' | '100_199' | '200_299' | '300_499' | '500_749' | '750_1000';
  roof_shade: '' | 'none' | 'some' | 'heavy' | 'unknown';
  timeline_to_install: '' | '0_3_months' | '3_6_months' | '6_plus_months';
  consent_combined: boolean;
};

type AutofillResponse =
  | { ok: true; city: string; state: 'HI'; zip: string }
  | { ok: false; reason: 'not_found' | 'non_hi' | 'error' };

const initialState: FormState = {
  first_name: '',
  last_name: '',
  street_address: '',
  city: '',
  state: 'HI',
  zip: '',
  email: '',
  phone: '',
  best_time_to_contact: 'anytime',
  homeowner_status: '',
  monthly_electric_bill_range: '',
  roof_shade: '',
  timeline_to_install: '',
  consent_combined: false
};

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function LeadForm({ sectionId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autofillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autofillHint, setAutofillHint] = useState<string | null>(null);

  const utm = useMemo(
    () => ({
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
      utm_term: searchParams.get('utm_term'),
      utm_content: searchParams.get('utm_content')
    }),
    [searchParams]
  );

  const consentId = `consent-combined-${sectionId}`;

  useEffect(() => {
    return () => {
      if (autofillTimerRef.current) clearTimeout(autofillTimerRef.current);
    };
  }, []);

  function onStreetAddressBlur(value: string) {
    const street = value.trim();
    if (autofillTimerRef.current) clearTimeout(autofillTimerRef.current);
    if (street.length < 6) {
      setAutofillHint(null);
      return;
    }

    autofillTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/address/autofill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ street_address: street })
        });

        if (!response.ok) {
          setAutofillHint(null);
          return;
        }

        const data = (await response.json().catch(() => null)) as AutofillResponse | null;
        if (!data) return;

        if (data.ok) {
          setForm((prev) => ({ ...prev, city: data.city, state: data.state, zip: data.zip }));
          setAutofillHint(null);
          return;
        }

        if (data.reason === 'non_hi') {
          setAutofillHint('Only Hawaii addresses can be auto-filled.');
          return;
        }

        setAutofillHint(null);
      } catch {
        setAutofillHint(null);
      }
    }, 250);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      ...form,
      phone: form.phone,
      homeowner_status: form.homeowner_status || null,
      monthly_electric_bill_range: form.monthly_electric_bill_range || null,
      roof_shade: form.roof_shade || null,
      timeline_to_install: form.timeline_to_install || null,
      landing_page_url: window.location.href,
      referrer_url: document.referrer || null,
      ...utm
    };

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      const serverError = body?.error && typeof body.error === 'string' ? body.error : null;
      setError(serverError ?? `Unable to submit. Please verify fields and try again (status ${response.status}).`);
      setSubmitting(false);
      return;
    }

    router.push('/thank-you');
  }

  return (
    <form className="lead-form" onSubmit={onSubmit}>
      <h3>Get My Solar Quote</h3>
      <div className="grid two-col">
        <label>
          First name
          <input required value={form.first_name} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
        </label>
        <label>
          Last name
          <input required value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
        </label>
      </div>
      <label>
        Street address
        <input
          required
          value={form.street_address}
          onChange={(e) => setForm((prev) => ({ ...prev, street_address: e.target.value }))}
          onBlur={(e) => onStreetAddressBlur(e.target.value)}
        />
      </label>
      {autofillHint ? <p className="fine-print">{autofillHint}</p> : null}
      <div className="grid three-col">
        <label>
          City
          <input required value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
        </label>
        <label>
          State
          <input required value={form.state} readOnly />
        </label>
        <label>
          Zip
          <input
            required
            pattern="[0-9]{5}"
            value={form.zip}
            onChange={(e) => setForm((prev) => ({ ...prev, zip: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
          />
          <span className="fine-print">Hawaii ZIPs only (96701-96898).</span>
        </label>
      </div>
      <div className="grid two-col">
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
        </label>
        <label>
          Phone
          <input
            required
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))}
          />
        </label>
      </div>
      <div className="grid two-col">
        <label>
          Best time to contact
          <select
            required
            value={form.best_time_to_contact}
            onChange={(e) => setForm((prev) => ({ ...prev, best_time_to_contact: e.target.value as FormState['best_time_to_contact'] }))}
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="anytime">Anytime</option>
          </select>
        </label>
        <label>
          Homeowner status
          <select
            value={form.homeowner_status}
            onChange={(e) => setForm((prev) => ({ ...prev, homeowner_status: e.target.value as FormState['homeowner_status'] }))}
          >
            <option value="">Select</option>
            <option value="owner">Owner</option>
            <option value="renter">Renter</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>
      <div className="grid three-col">
        <label>
          Monthly electric bill
          <select
            value={form.monthly_electric_bill_range}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, monthly_electric_bill_range: e.target.value as FormState['monthly_electric_bill_range'] }))
            }
          >
            <option value="">Select</option>
            <option value="under_100">Under $100</option>
            <option value="100_199">$100-$199</option>
            <option value="200_299">$200-$299</option>
            <option value="300_499">$300-$499</option>
            <option value="500_749">$500-$749</option>
            <option value="750_1000">$750-$1000</option>
          </select>
        </label>
        <label>
          Roof shade
          <select value={form.roof_shade} onChange={(e) => setForm((prev) => ({ ...prev, roof_shade: e.target.value as FormState['roof_shade'] }))}>
            <option value="">Select</option>
            <option value="none">None</option>
            <option value="some">Some</option>
            <option value="heavy">Heavy</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label>
          Installation timeline
          <select
            value={form.timeline_to_install}
            onChange={(e) => setForm((prev) => ({ ...prev, timeline_to_install: e.target.value as FormState['timeline_to_install'] }))}
          >
            <option value="">Select</option>
            <option value="0_3_months">0-3 months</option>
            <option value="3_6_months">3-6 months</option>
            <option value="6_plus_months">6+ months</option>
          </select>
        </label>
      </div>
      <label htmlFor={consentId} className="checkbox-row">
        <input
          id={consentId}
          type="checkbox"
          checked={form.consent_combined}
          onChange={(e) => setForm((prev) => ({ ...prev, consent_combined: e.target.checked }))}
          required
        />
        <span>
          {CONSENT_TEXT}{' '}
          <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link>.
        </span>
      </label>
      <details className="partner-disclosure">
        <summary>View Marketing Partners</summary>
        <ul>
          {SOLAR_PARTNERS.map((p) => (
            <li key={p.name}>{p.name}</li>
          ))}
        </ul>
      </details>
      {error ? <p className="error">{error}</p> : null}
      <button disabled={submitting} type="submit">
        {submitting ? 'Submitting...' : 'Get My Solar Quote'}
      </button>
    </form>
  );
}
