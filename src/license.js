// Retail inMotion edition: an internal app installed only on Retail inMotion sites, with no
// Marketplace listing, so there is no licence to enforce. Every installation can change rules and
// run follow-ups in every Forge environment (production included). The helpers keep their names so
// the resolvers and triggers stay in step with the Marketplace edition.

const PRODUCTION = 'PRODUCTION';

function environmentType(context) {
  const value = context?.environmentType ?? context?.environment?.type ?? null;
  return value ? String(value).toUpperCase() : null;
}

export function isProductionContext(context) {
  const type = environmentType(context);
  return type == null || type === PRODUCTION;
}

export function resolverLicenseAllows() {
  return true;
}

export function triggerLicenseAllows() {
  return true;
}
