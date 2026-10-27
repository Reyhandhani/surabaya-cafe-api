const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.CAFES_FILE || path.join(__dirname, 'data', 'cafes.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helpers ──────────────────────────────────────────────────────────

function getCafes() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading cafes.json:', err);
    return [];
  }
}

function saveCafes(cafes) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(cafes, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing cafes.json:', err);
    return false;
  }
}

function requireApiKey(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    return res.status(503).json({ success: false, message: 'Fitur tambah data belum diaktifkan' });
  }
  if (req.get('x-api-key') !== key) {
    return res.status(401).json({ success: false, message: 'API key tidak valid' });
  }
  next();
}

function generateId(name, lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return 0;
  const str = `${name}|${lat}|${lon}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}

function formatCafeOutput(cafe) {
  const lat = parseFloat(cafe.latitude) || 0;
  const lon = parseFloat(cafe.longitude) || 0;
  const name = cafe.name || '';
  const area = cafe.area || '';
  return {
    id: cafe.id || generateId(name, lat, lon),
    name,
    map_title: cafe.map_title || (area ? `${name}, ${area}` : name),
    category: cafe.category || '',
    area,
    address: cafe.address || '',
    latitude: lat,
    longitude: lon,
    price_range: cafe.price_range || '',
    description: cafe.description || '',
    opening_hours: cafe.opening_hours || '',
    facilities: Array.isArray(cafe.facilities) ? cafe.facilities : [],
    needs_tags: Array.isArray(cafe.needs_tags) ? cafe.needs_tags : [],
    instagram: cafe.instagram || '',
    whatsapp: cafe.whatsapp || '',
    data_confidence: cafe.data_confidence || 'Medium (80%)',
    verified: cafe.verified || false,
    gmaps_status: cafe.gmaps_status || 'Unverified',
    gmaps_url: cafe.gmaps_url || '',
    gmaps_rating: cafe.gmaps_rating || 0,
    gmaps_review_count: cafe.gmaps_review_count || 0,
    last_verified_at: cafe.last_verified_at || '',
  };
}

// ==========================================
// DASHBOARD + API ENDPOINTS
// ==========================================

// Root → Dashboard HTML (served by express.static)
// JSON landing dipindah ke /api/info

/**
 * @route GET /api/info
 * @description Info API dalam format JSON
 */
app.get('/api/info', (req, res) => {
  const cafes = getCafes();
  res.json({
    status: 'success',
    message: 'Selamat datang di Surabaya Cafe API (Open Public REST & JSON API)',
    version: '2.0.0',
    total_data: cafes.length,
    verified_count: cafes.filter(c => c.verified).length,
    endpoints: {
      all_cafes: '/api/cafes',
      search_cafes: '/api/cafes/search?q={kata_kunci}',
      filter_by_area: '/api/cafes?area=Surabaya%20Barat',
      cafe_by_id: '/api/cafes/{id}',
      export_json: '/api/export/json',
      export_csv: '/api/export/csv',
    },
  });
});

/**
 * @route GET /api/cafes
 * @description Seluruh cafe + filter opsional
 */
app.get('/api/cafes', (req, res) => {
  let cafes = getCafes().map(formatCafeOutput);
  const { area, category, tag, facility, search, sort, paginated, limit, page } = req.query;

  if (area && area !== 'Semua Area' && area !== 'all') {
    cafes = cafes.filter(c => c.area.toLowerCase() === area.toLowerCase());
  }
  if (category && category !== 'Semua Kategori' && category !== 'all') {
    cafes = cafes.filter(c => c.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (tag && tag !== 'all') {
    cafes = cafes.filter(c => c.needs_tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
  }
  if (facility && facility !== 'all') {
    cafes = cafes.filter(c => c.facilities.some(f => f.toLowerCase().includes(facility.toLowerCase())));
  }
  if (search) {
    const q = search.toLowerCase();
    cafes = cafes.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.area.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.needs_tags.some(t => t.toLowerCase().includes(q)) ||
      c.facilities.some(f => f.toLowerCase().includes(q))
    );
  }
  if (sort === 'name_asc') cafes.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'name_desc') cafes.sort((a, b) => b.name.localeCompare(a.name));
  else if (sort === 'area') cafes.sort((a, b) => a.area.localeCompare(b.area));

  if (paginated === 'true' || limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const start = (pageNum - 1) * limitNum;
    return res.json({
      success: true,
      total_data: cafes.length,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(cafes.length / limitNum),
      data: cafes.slice(start, start + limitNum),
    });
  }

  res.json(cafes);
});

/**
 * @route GET /api/cafes/search?q=
 * @description Pencarian cepat
 */
app.get('/api/cafes/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.status(400).json({ success: false, message: 'Parameter q wajib diisi' });

  const cafes = getCafes().map(formatCafeOutput).filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q) ||
    c.address.toLowerCase().includes(q) ||
    c.area.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q) ||
    c.needs_tags.some(t => t.toLowerCase().includes(q)) ||
    c.facilities.some(f => f.toLowerCase().includes(q))
  );
  res.json({ success: true, total: cafes.length, data: cafes });
});

/**
 * @route GET /api/cafes/:id
 * @description Detail cafe by ID (numeric) or name slug
 */
app.get('/api/cafes/:id', (req, res) => {
  const param = req.params.id;
  const cafes = getCafes().map(formatCafeOutput);

  // Try numeric ID match
  let cafe = cafes.find(c => c.id.toString() === param);

  // Fallback: name slug match
  if (!cafe) {
    const clean = decodeURIComponent(param).toLowerCase().replace(/-/g, ' ');
    cafe = cafes.find(c => c.name.toLowerCase().includes(clean));
  }

  if (!cafe) return res.status(404).json({ success: false, message: 'Kafe tidak ditemukan' });
  res.json(cafe);
});

/**
 * @route GET /api/areas
 */
app.get('/api/areas', (req, res) => {
  const cafes = getCafes();
  const counts = {};
  cafes.forEach(c => { counts[c.area] = (counts[c.area] || 0) + 1; });
  res.json(Object.keys(counts).map(area => ({ name: area, count: counts[area] })));
});

/**
 * @route GET /api/tags
 */
app.get('/api/tags', (req, res) => {
  const cafes = getCafes();
  const counts = {};
  cafes.forEach(c => { (c.needs_tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }); });
  res.json(Object.keys(counts).map(tag => ({ name: tag, count: counts[tag] })));
});

/**
 * @route GET /api/facilities
 */
app.get('/api/facilities', (req, res) => {
  const cafes = getCafes();
  const counts = {};
  cafes.forEach(c => { (c.facilities || []).forEach(f => { counts[f] = (counts[f] || 0) + 1; }); });
  res.json(Object.keys(counts).map(f => ({ name: f, count: counts[f] })));
});

/**
 * @route GET /api/stats
 * @description Statistik dataset
 */
app.get('/api/stats', (req, res) => {
  const cafes = getCafes();
  const verified = cafes.filter(c => c.verified);
  const tempClosed = cafes.filter(c => c.gmaps_status === 'Temporarily closed');
  const areas = {};
  cafes.forEach(c => { areas[c.area] = (areas[c.area] || 0) + 1; });
  res.json({
    total: cafes.length,
    verified: verified.length,
    temporarily_closed: tempClosed.length,
    areas,
  });
});

/**
 * @route POST /api/cafes
 * @description Tambah cafe baru manual
 */
app.post('/api/cafes', requireApiKey, (req, res) => {
  const cafes = getCafes();
  const body = req.body;

  if (!body.name || !body.address) {
    return res.status(400).json({ success: false, message: 'Name dan Address wajib diisi' });
  }

  const lat = parseFloat(body.latitude) || 0;
  const lon = parseFloat(body.longitude) || 0;

  const newCafe = {
    id: generateId(body.name, lat, lon),
    name: body.name,
    map_title: body.area ? `${body.name}, ${body.area}` : body.name,
    category: body.category || 'Coffee Shop',
    area: body.area || 'Surabaya Pusat',
    address: body.address,
    latitude: lat,
    longitude: lon,
    price_range: body.price_range || '',
    description: body.description || '',
    opening_hours: body.opening_hours || '',
    facilities: Array.isArray(body.facilities) ? body.facilities : (body.facilities ? body.facilities.split(',').map(s => s.trim()) : []),
    needs_tags: Array.isArray(body.needs_tags) ? body.needs_tags : (body.needs_tags ? body.needs_tags.split(',').map(s => s.trim()) : []),
    instagram: (body.instagram || '').replace(/^@/, ''),
    whatsapp: body.whatsapp || '',
    data_confidence: body.data_confidence || 'Medium (80%)',
    verified: false,
    gmaps_status: 'Unverified',
    gmaps_url: '',
    gmaps_rating: 0,
    gmaps_review_count: 0,
    last_verified_at: '',
  };

  cafes.push(newCafe);
  if (!saveCafes(cafes)) {
    return res.status(500).json({ success: false, message: 'Gagal menyimpan data cafe' });
  }

  res.status(201).json({
    success: true,
    message: 'Berhasil menambahkan cafe baru (belum terverifikasi Google Maps)',
    data: formatCafeOutput(newCafe),
  });
});

/**
 * @route GET /api/export/json
 */
app.get('/api/export/json', (req, res) => {
  const cafes = getCafes().map(formatCafeOutput);
  res.setHeader('Content-Disposition', 'attachment; filename=cafes_surabaya.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(cafes, null, 2));
});

/**
 * @route GET /api/export/csv
 */
app.get('/api/export/csv', (req, res) => {
  const cafes = getCafes().map(formatCafeOutput);
  const headers = [
    'id', 'name', 'map_title', 'category', 'area', 'address', 'latitude', 'longitude',
    'price_range', 'description', 'opening_hours', 'facilities',
    'needs_tags', 'instagram', 'whatsapp', 'data_confidence',
    'verified', 'gmaps_status', 'gmaps_url',
  ];

  let csv = headers.join(',') + '\n';
  cafes.forEach(cafe => {
    const row = headers.map(h => {
      let val = cafe[h];
      if (Array.isArray(val)) val = val.join('; ');
      if (val === null || val === undefined) val = '';
      return `"${val.toString().replace(/"/g, '""')}"`;
    });
    csv += row.join(',') + '\n';
  });

  res.setHeader('Content-Disposition', 'attachment; filename=cafes_surabaya.csv');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send(csv);
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Body JSON tidak valid' });
  }
  if (err instanceof URIError) {
    return res.status(400).json({ success: false, message: 'Parameter URL tidak valid' });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
});

// Export for Vercel serverless
module.exports = app;

// Start Server (local dev only — Vercel handles this automatically)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`SURABAYA CAFE API SERVER v2.0 READY`);
    console.log(`${'='.repeat(50)}`);
    console.log(`Dashboard : http://localhost:${PORT}`);
    console.log(`API       : http://localhost:${PORT}/api/cafes`);
    console.log(`${'='.repeat(50)}\n`);
  });
}
