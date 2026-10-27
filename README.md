# Surabaya Cafe API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

REST API data kafe dan coffee shop aktif di Surabaya. Data awal diambil dari OpenStreetMap, lalu dicek di Google Maps. Cafe yang tutup permanen tidak masuk dataset. Cafe yang tutup sementara tetap ada dengan status `Temporarily closed`.

Gratis, tanpa API key, dan bisa dipakai untuk tugas kuliah, proyek komersial, atau riset.

## Isi Data

- 874 tempat dari 5 wilayah: Surabaya Pusat, Timur, Barat, Selatan, dan Utara
- Koordinat GPS, rating, dan jumlah ulasan dari Google Maps
- Filter berdasarkan wilayah, kategori, dan pencarian teks
- Export JSON dan CSV

### Status data saat ini

Dataset ini masih dalam tahap pengembangan. Beberapa hal yang perlu diketahui sebelum dipakai:

- Field `facilities`, `needs_tags`, `instagram`, dan `description` masih kosong untuk semua data. Filter `facility` dan `tag` belum menghasilkan apa-apa.
- Field `whatsapp` hanya terisi untuk 3 tempat.
- Sekitar 430 alamat masih berisi nama kategori (misalnya `Kedai Kopi`), bukan alamat lengkap.
- Kategori belum sepenuhnya bersih. Ada tempat yang bukan kafe, seperti mall, restoran, atau dealer motor.

Bantuan untuk melengkapi data sangat diterima. Lihat [CONTRIBUTING.md](CONTRIBUTING.md).

## Endpoint

Base URL: `https://surabaya-cafe-api.vercel.app` (atau `http://localhost:3000` jika dijalankan lokal).

| Method | Path | Keterangan |
|--------|------|------------|
| `GET` | `/api/info` | Info API dan daftar endpoint |
| `GET` | `/api/cafes` | Daftar cafe. Filter: `area`, `category`, `tag`, `facility`, `search`, `sort`, `limit`, `page` |
| `GET` | `/api/cafes/search?q=` | Cari berdasarkan nama, alamat, kategori, tag, atau fasilitas |
| `GET` | `/api/cafes/:id` | Detail satu cafe berdasarkan ID atau nama |
| `POST` | `/api/cafes` | Tambah cafe baru (belum terverifikasi). Butuh header `x-api-key` |
| `GET` | `/api/areas` | Daftar wilayah dan jumlah cafe |
| `GET` | `/api/tags` | Daftar tag kebutuhan |
| `GET` | `/api/facilities` | Daftar fasilitas |
| `GET` | `/api/stats` | Statistik dataset |
| `GET` | `/api/export/json` | Download semua data (JSON) |
| `GET` | `/api/export/csv` | Download semua data (CSV) |

### Format response

- `GET /api/cafes` tanpa `limit` atau `page` mengembalikan array langsung.
- Jika memakai `limit` atau `page`, response berbentuk objek dengan `data`, `total_data`, `page`, `limit`, dan `total_pages`.
- `GET /api/cafes/search` dan `POST /api/cafes` mengembalikan objek dengan `success` dan `data`.
- Error mengembalikan `success: false` dan `message`. Endpoint yang tidak ada mengembalikan 404 dalam format yang sama.

### Menambah cafe

`POST /api/cafes` butuh API key di header `x-api-key`. Key diatur lewat environment variable `ADMIN_API_KEY` di server. Jika variable ini belum diatur, endpoint mengembalikan 503.

```bash
curl -X POST "http://localhost:3000/api/cafes" \
  -H "Content-Type: application/json" \
  -H "x-api-key: KEY_ANDA" \
  -d '{"name": "Contoh Kopi", "address": "Jl. Contoh No. 1, Surabaya", "area": "Surabaya Pusat"}'
```

Endpoint ini menulis ke `data/cafes.json`, jadi hanya bisa dipakai di server yang filesystemnya bisa ditulis. Di Vercel, penulisan gagal dan API mengembalikan 500.

## Contoh Penggunaan

Ambil cafe di Surabaya Timur:

```bash
curl "https://surabaya-cafe-api.vercel.app/api/cafes?area=Surabaya%20Timur"
```

Cari tempat dengan kata kunci "kopi", ambil 10 hasil per halaman:

```bash
curl "https://surabaya-cafe-api.vercel.app/api/cafes/search?q=kopi"
curl "https://surabaya-cafe-api.vercel.app/api/cafes?limit=10&page=1"
```

Dengan JavaScript (fetch):

```javascript
const res = await fetch("https://surabaya-cafe-api.vercel.app/api/cafes?area=Surabaya%20Pusat&limit=5");
const { data } = await res.json();
console.log(data.map((c) => c.name));
```

Dengan Python:

```python
import requests

res = requests.get(
    "https://surabaya-cafe-api.vercel.app/api/cafes",
    params={"area": "Surabaya Pusat", "limit": 5},
)
for cafe in res.json()["data"]:
    print(cafe["name"], cafe["area"])
```

## Struktur Data

Setiap cafe memiliki 22 field:

```json
{
  "id": 1898960185,
  "name": "Aan Ping Lao",
  "map_title": "Aan Ping Lao, Surabaya Barat",
  "category": "Mi",
  "area": "Surabaya Barat",
  "address": "Jl. Raya Darmo Baru Barat No.85A",
  "latitude": -7.2790912,
  "longitude": 112.6961887,
  "price_range": "Rp 50–75 rb",
  "description": "",
  "opening_hours": "Buka kembali pukul 16.30",
  "facilities": [],
  "needs_tags": [],
  "instagram": "",
  "whatsapp": "",
  "data_confidence": "Medium (80%)",
  "verified": true,
  "gmaps_status": "Operational",
  "gmaps_url": "https://www.google.com/maps/place/Aan+Ping+Lao/...",
  "gmaps_rating": 4,
  "gmaps_review_count": 1942,
  "last_verified_at": "2026-08-11T04:39:34.996Z"
}
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `id` | Number | ID unik (hash dari nama dan koordinat) |
| `name` | String | Nama tempat |
| `map_title` | String | Judul di Google Maps |
| `category` | String | Kategori dari sumber data, misalnya `Kedai Kopi`, `Kafe`, `Restoran` |
| `area` | String | `Surabaya Pusat`, `Timur`, `Barat`, `Selatan`, atau `Utara` |
| `address` | String | Alamat lengkap |
| `latitude` / `longitude` | Number | Koordinat GPS |
| `price_range` | String | Kisaran harga per orang |
| `description` | String | Deskripsi singkat (saat ini kosong) |
| `opening_hours` | String | Jam buka |
| `facilities` | Array | Contoh: `wifi`, `ac`, `colokan`, `outdoor`, `parkir` (saat ini kosong) |
| `needs_tags` | Array | Contoh: `wfc`, `meeting`, `santai`, `estetik` (saat ini kosong) |
| `instagram` | String | Username Instagram tanpa `@` (saat ini kosong) |
| `whatsapp` | String | Nomor WhatsApp |
| `data_confidence` | String | Tingkat keyakinan data |
| `verified` | Boolean | `true` jika sudah dicek di Google Maps |
| `gmaps_status` | String | `Operational`, `Temporarily closed`, atau `Unverified` |
| `gmaps_url` | String | Link ke Google Maps |
| `gmaps_rating` | Number | Rating Google Maps (0-5) |
| `gmaps_review_count` | Number | Jumlah ulasan |
| `last_verified_at` | String | Waktu terakhir dicek (ISO 8601) |

Untuk memastikan tempat masih buka, cek `verified` (harus `true`) dan `gmaps_status` (`Operational`). Gunakan `gmaps_url` untuk pengecekan manual.

## Download

- [JSON](https://surabaya-cafe-api.vercel.app/api/export/json)
- [CSV](https://surabaya-cafe-api.vercel.app/api/export/csv)

## Menjalankan Lokal

Membutuhkan Node.js 18 atau lebih baru.

```bash
git clone https://github.com/Reyhandhani/surabaya-cafe-api.git
cd surabaya-cafe-api
npm install
npm start
```

Dashboard tersedia di `http://localhost:3000` dan API di `http://localhost:3000/api/cafes`.

### Test

```bash
npm test
```

Test menjalankan semua endpoint terhadap salinan data sementara, jadi `data/cafes.json` tidak berubah.

### Spesifikasi OpenAPI

Spesifikasi lengkap ada di [docs/openapi.yaml](docs/openapi.yaml). Bisa dibuka di [Swagger Editor](https://editor.swagger.io/) atau dipakai untuk membuat client.

## Kontribusi

Silakan buka issue atau pull request. Panduan lengkap ada di [CONTRIBUTING.md](CONTRIBUTING.md). Untuk laporan keamanan, lihat [SECURITY.md](SECURITY.md).

## Sumber Data dan Lisensi

- Data lokasi berasal dari [OpenStreetMap](https://www.openstreetmap.org/copyright), © OpenStreetMap contributors, dengan lisensi ODbL.
- Rating, ulasan, dan link Google Maps berasal dari Google Maps. Penggunaannya tunduk pada ketentuan Google.
- Kode API dilisensikan di bawah [MIT License](LICENSE).

## Author

[Reyhandhani](https://github.com/Reyhandhani)
