import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isProductionContext, resolverLicenseAllows, triggerLicenseAllows } from '../src/license.js';
import { retryDelayMs, withRateLimitRetry } from '../src/jira.js';
import { chunk, PRIVACY_REPORT_BATCH_SIZE } from '../src/privacy.js';

const prod = (license) => ({ environmentType: 'PRODUCTION', ...(license === undefined ? {} : { license }) });
const dev = (license) => ({ environmentType: 'DEVELOPMENT', ...(license === undefined ? {} : { license }) });

test('internal edition: resolvers and triggers are allowed in every environment and licence state', () => {
  for (const context of [prod(), prod(null), prod({ active: false }), prod({ active: true }), {}, dev(), dev({ active: false })]) {
    assert.equal(resolverLicenseAllows(context, { LICENSE_OVERRIDE: 'inactive' }), true);
    assert.equal(triggerLicenseAllows(context, { LICENSE_OVERRIDE: 'inactive' }), true);
  }
  assert.equal(isProductionContext({}), true);
});

test('internal edition triggers are not filtered on a Marketplace licence', () => {
  const manifest = readFileSync(new URL('../manifest.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(manifest, /appIsLicensed/);
  assert.doesNotMatch(manifest, /licensing:\s*\n\s+enabled:\s*true/);
});

const response = (status, retryAfter) => ({
  status,
  headers: { get: (name) => (name === 'Retry-After' ? retryAfter ?? null : null) }
});

test('withRateLimitRetry retries 429 honouring Retry-After', async () => {
  const responses = [response(429, '2'), response(429, '0'), response(200)];
  const waits = [];
  const result = await withRateLimitRetry(async () => responses.shift(), { wait: async (ms) => waits.push(ms) });
  assert.equal(result.status, 200);
  assert.deepEqual(waits, [2000, 0]);
});

test('withRateLimitRetry gives up after the retry limit and does not retry other errors', async () => {
  let calls = 0;
  const limited = await withRateLimitRetry(async () => { calls += 1; return response(429, '1'); }, { wait: async () => {}, maxRetries: 2 });
  assert.equal(limited.status, 429);
  assert.equal(calls, 3);

  calls = 0;
  const failed = await withRateLimitRetry(async () => { calls += 1; return response(500); }, { wait: async () => {} });
  assert.equal(failed.status, 500);
  assert.equal(calls, 1);
});

test('retryDelayMs caps long Retry-After values and backs off without one', () => {
  assert.equal(retryDelayMs(response(429, '3600'), 0), 10000);
  const backoff = retryDelayMs(response(429), 1);
  assert.ok(backoff >= 2000 && backoff < 2250);
});

test('privacy reports are sent in batches of at most 90 accounts', () => {
  assert.equal(PRIVACY_REPORT_BATCH_SIZE, 90);
  const batches = chunk(Array.from({ length: 200 }, (_, index) => index));
  assert.deepEqual(batches.map((batch) => batch.length), [90, 90, 20]);
  assert.deepEqual(chunk([]), []);
});

test('privacy processing does not log account IDs', () => {
  const source = readFileSync(new URL('../src/privacy.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /console\.\w+\([^)]*accountId/);
});
