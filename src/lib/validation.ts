import { z } from 'zod';
import { cleanPhone, isHawaiiZip } from '@/lib/utils';

const optionalEnum = (values: [string, ...string[]]) =>
  z
    .enum(values)
    .nullable()
    .optional()
    .transform((value) => value ?? null);

export const leadCreateSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  street_address: z.string().trim().min(5).max(150),
  city: z.string().trim().min(2).max(80),
  state: z.literal('HI'),
  zip: z
    .string()
    .regex(/^\d{5}$/)
    .refine((value) => isHawaiiZip(value), 'Zip code must be in Hawaii range'),
  email: z.string().trim().email().max(160),
  phone: z
    .string()
    .transform(cleanPhone)
    .refine((value) => value.length === 10, 'Phone must be 10 digits'),
  best_time_to_contact: optionalEnum(['morning', 'afternoon', 'evening', 'anytime']),
  homeowner_status: optionalEnum(['owner', 'renter', 'other']),
  monthly_electric_bill_range: optionalEnum(['under_100', '100_199', '200_299', '300_499', '500_749', '750_1000']),
  roof_shade: optionalEnum(['none', 'some', 'heavy', 'unknown']),
  timeline_to_install: optionalEnum(['0_3_months', '3_6_months', '6_plus_months']),
  consent_combined: z.literal(true),
  landing_page_url: z.string().trim().url(),
  referrer_url: z.string().trim().url().nullable().optional(),
  utm_source: z.string().trim().max(120).nullable().optional(),
  utm_medium: z.string().trim().max(120).nullable().optional(),
  utm_campaign: z.string().trim().max(120).nullable().optional(),
  utm_term: z.string().trim().max(120).nullable().optional(),
  utm_content: z.string().trim().max(120).nullable().optional()
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
