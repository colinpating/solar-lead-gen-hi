export function cleanPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

export function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip');
}

export function isHawaiiZip(zip: string): boolean {
  const numeric = Number.parseInt(zip, 10);
  return numeric >= 96701 && numeric <= 96898;
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringified = String(value);
  if (/[",\n]/.test(stringified)) {
    return `"${stringified.replace(/"/g, '""')}"`;
  }
  return stringified;
}
