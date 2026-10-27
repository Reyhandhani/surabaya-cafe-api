const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const source = path.join(__dirname, '..', 'data', 'cafes.json');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cafe-api-test-'));
const tmpFile = path.join(tmpDir, 'cafes.json');
fs.copyFileSync(source, tmpFile);
process.env.CAFES_FILE = tmpFile;

const app = require('../server');
const total = JSON.parse(fs.readFileSync(tmpFile, 'utf8')).length;

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function get(p) {
  const res = await fetch(base + p);
  return { status: res.status, body: await res.json() };
}

test('GET /api/info mengembalikan info dan jumlah data', async () => {
  const { status, body } = await get('/api/info');
  assert.equal(status, 200);
  assert.equal(body.total_data, total);
});

test('GET /api/cafes tanpa paginasi mengembalikan array', async () => {
  const { status, body } = await get('/api/cafes');
  assert.equal(status, 200);
  assert.ok(Array.isArray(body));
  assert.equal(body.length, total);
});

test('GET /api/cafes dengan filter area hanya mengembalikan area tersebut', async () => {
  const { body } = await get('/api/cafes?area=Surabaya%20Timur');
  assert.ok(body.length > 0);
  assert.ok(body.every((c) => c.area === 'Surabaya Timur'));
});

test('GET /api/cafes dengan paginasi mengembalikan halaman yang benar', async () => {
  const { body } = await get('/api/cafes?limit=2&page=2');
  assert.equal(body.success, true);
  assert.equal(body.page, 2);
  assert.equal(body.limit, 2);
  assert.equal(body.data.length, 2);
  assert.equal(body.total_data, total);
});

test('GET /api/cafes/search tanpa q mengembalikan 400', async () => {
  const { status, body } = await get('/api/cafes/search');
  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test('GET /api/cafes/search mengembalikan hasil yang mengandung kata kunci', async () => {
  const { status, body } = await get('/api/cafes/search?q=kopi');
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal(body.total, body.data.length);
  assert.ok(body.data.every((c) => JSON.stringify(c).toLowerCase().includes('kopi')));
});

test('GET /api/cafes/:id mengembalikan detail cafe', async () => {
  const sample = JSON.parse(fs.readFileSync(tmpFile, 'utf8'))[0];
  const { status, body } = await get(`/api/cafes/${sample.id}`);
  assert.equal(status, 200);
  assert.equal(body.id, sample.id);
  assert.equal(body.name, sample.name);
});

test('GET /api/cafes/:id untuk data yang tidak ada mengembalikan 404 JSON', async () => {
  const { status, body } = await get('/api/cafes/tidak-ada-cafe-ini-xyz');
  assert.equal(status, 404);
  assert.equal(body.success, false);
});

test('path yang tidak ada mengembalikan 404 JSON', async () => {
  const { status, body } = await get('/api/tidak-ada');
  assert.equal(status, 404);
  assert.equal(body.success, false);
});

test('parameter URL yang rusak mengembalikan 400 JSON', async () => {
  const { status, body } = await get('/api/cafes/%E0');
  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test('GET /api/export/csv mengembalikan header CSV', async () => {
  const res = await fetch(base + '/api/export/csv');
  const text = await res.text();
  assert.equal(res.status, 200);
  assert.ok(text.startsWith('id,name,map_title'));
});

test('POST /api/cafes tanpa ADMIN_API_KEY mengembalikan 503', async () => {
  delete process.env.ADMIN_API_KEY;
  const res = await fetch(base + '/api/cafes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', address: 'Jl. Test' }),
  });
  assert.equal(res.status, 503);
});

test('POST /api/cafes dengan key salah mengembalikan 401', async () => {
  process.env.ADMIN_API_KEY = 'rahasia';
  const res = await fetch(base + '/api/cafes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'salah' },
    body: JSON.stringify({ name: 'Test', address: 'Jl. Test' }),
  });
  assert.equal(res.status, 401);
  delete process.env.ADMIN_API_KEY;
});

test('POST /api/cafes dengan body JSON rusak mengembalikan 400', async () => {
  process.env.ADMIN_API_KEY = 'rahasia';
  const res = await fetch(base + '/api/cafes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'rahasia' },
    body: '{rusak',
  });
  assert.equal(res.status, 400);
  delete process.env.ADMIN_API_KEY;
});

test('POST /api/cafes tanpa name atau address mengembalikan 400', async () => {
  process.env.ADMIN_API_KEY = 'rahasia';
  const res = await fetch(base + '/api/cafes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'rahasia' },
    body: JSON.stringify({ name: 'Tanpa Alamat' }),
  });
  assert.equal(res.status, 400);
  delete process.env.ADMIN_API_KEY;
});

test('POST /api/cafes dengan key benar menyimpan cafe baru', async () => {
  process.env.ADMIN_API_KEY = 'rahasia';
  const res = await fetch(base + '/api/cafes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'rahasia' },
    body: JSON.stringify({
      name: 'Kopi Uji Coba',
      address: 'Jl. Uji No. 1, Surabaya',
      area: 'Surabaya Selatan',
      facilities: 'wifi, ac',
      instagram: '@kopiujicoba',
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.name, 'Kopi Uji Coba');
  assert.deepEqual(body.data.facilities, ['wifi', 'ac']);
  assert.equal(body.data.instagram, 'kopiujicoba');

  const stored = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
  assert.equal(stored.length, total + 1);
  delete process.env.ADMIN_API_KEY;
});
