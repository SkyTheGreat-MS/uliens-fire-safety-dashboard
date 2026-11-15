import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { evaluateAvionicsState, fetchCatalog } from '../src/services/avionicsService.ts';

const request = {
  material: 'Pmma Cast Acrylic',
  oxygen_pct: 21,
  pressure_kpa: 101.3,
  flow_velocity_cm_s: 12,
  cutoff_probability: 0,
  spread_threshold_mm_s: 0.5,
  sweep_points: 2,
};

const provenance = JSON.parse(
  readFileSync(new URL('../models/provenance_metadata.json', import.meta.url), 'utf8'),
)[request.material];

const versions = { model_version: 'v2', dataset_version: 'clean_combustion_data_v2' };

test('catalog reads the bundled V2 material metadata through the API shape', async (context) => {
  const mockFetch = context.mock.method(globalThis, 'fetch', async () =>
    Response.json({ ...versions, materials: [provenance] }));
  const catalog = await fetchCatalog(new AbortController().signal);
  assert.equal(mockFetch.mock.calls[0].arguments[0], '/api/avionics/materials');
  assert.equal(catalog.materials[0].material_name, request.material);
  assert.equal(catalog.materials[0].loi_threshold_pct, 17);
});

test('invalid successful responses and HTTP errors surface to the caller', async (context) => {
  const mockFetch = context.mock.method(globalThis, 'fetch', async () => Response.json({ ...versions, inputs: request }));
  await assert.rejects(evaluateAvionicsState(request, new AbortController().signal), /Unexpected evaluation response/);
  const [path, options] = mockFetch.mock.calls[0].arguments;
  assert.equal(path, '/api/avionics/evaluate');
  assert.equal(options.method, 'POST');
  assert.deepEqual(JSON.parse(options.body), request);

  mockFetch.mock.mockImplementation(async () => Response.json({}, { status: 503 }));
  await assert.rejects(fetchCatalog(new AbortController().signal), /HTTP 503/);
});

function pendingFetch(_path, { signal }) {
  return new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
}

test('superseding a pending request aborts the in-flight fetch', async (context) => {
  context.mock.method(globalThis, 'fetch', pendingFetch);
  const controller = new AbortController();
  const pending = evaluateAvionicsState(request, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('a slow response times out after eight seconds', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  context.mock.method(globalThis, 'fetch', pendingFetch);
  const pending = evaluateAvionicsState(request, new AbortController().signal);
  context.mock.timers.tick(8000);
  await assert.rejects(pending, { name: 'AbortError' });
});
