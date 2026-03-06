import nextVitals from 'eslint-config-next/core-web-vitals.js';

const resolvedNextVitals = nextVitals?.default ?? nextVitals;
const config = Array.isArray(resolvedNextVitals) ? resolvedNextVitals : [resolvedNextVitals];

export default config;
