export type Partner = {
  name: string;      // Legal entity name shown in consent
  shortName: string;  // Display-friendly name
};

// Update this list as partner contracts are signed.
// Each change requires bumping CONSENT_TEXT_VERSION in consent.ts.
export const SOLAR_PARTNERS: Partner[] = [
  { name: 'Aloha Solar Co., LLC', shortName: 'Aloha Solar' },
  { name: 'Pacific Sun Energy, Inc.', shortName: 'Pacific Sun Energy' },
];
