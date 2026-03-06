import { SOLAR_PARTNERS } from '@/lib/partners';

export const APP_NAME = 'Hawaii Solar Savings';

export const CONSENT_TEXT_VERSION = 'v2_2026_03_06';

function buildPartnerList(): string {
  const names = SOLAR_PARTNERS.map((p) => p.name);
  if (names.length === 0) return APP_NAME;
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
}

export const CONSENT_TEXT =
  `By checking this box and clicking 'Get My Solar Estimate', you provide your express written consent to be contacted by ${buildPartnerList()} by phone call, SMS, and email at the contact information provided, including by automated technology, regarding solar energy products and services. Consent is not a condition of purchase. Message/data rates may apply. Reply STOP to opt out.`;

export const CONSENT_CHANNELS = ['phone', 'sms', 'email'] as const;
