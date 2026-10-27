# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/), dan versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Ditambahkan
- Lisensi MIT (`LICENSE`)
- Panduan kontribusi (`CONTRIBUTING.md`)
- Kebijakan keamanan (`SECURITY.md`)
- Changelog ini
- Autentikasi `POST /api/cafes` lewat header `x-api-key` dan environment variable `ADMIN_API_KEY`
- Contoh env di `.env.example`
- Handler 404 dan error yang selalu berbentuk JSON
- Test otomatis dengan `npm test` (Node built-in test runner, 16 test)
- Workflow GitHub Actions: test di Node 18, 20, dan 22, serta validasi OpenAPI
- Spesifikasi OpenAPI di `docs/openapi.yaml`
- Environment variable `CAFES_FILE` untuk mengganti lokasi data
- `.github/` berisi template PR dan issue, dan workflow CI

### Diperbaiki
- `POST /api/cafes` mengembalikan 500 jika data gagal disimpan, tidak lagi "Berhasil"
- Body JSON yang rusak dan parameter URL yang tidak valid mengembalikan 400
- Server hanya listen saat dijalankan langsung (`node server.js`), sehingga app bisa diimpor untuk test
- Kerentanan dependensi diperbaiki dengan `npm audit fix` (0 kerentanan)

### Diubah
- README dirapikan: jumlah field diperbaiki menjadi 22, contoh data diganti dengan data nyata, dan status data dijelaskan terus terang
- Metadata `package.json` diperbaiki: lisensi, author, repository, dan kebutuhan Node.js
- Script bot scraper dihapus dari `package.json`. Script tersebut mengarah ke folder `src/` yang tidak ikut di repo publik
- Dependensi `playwright` dihapus karena hanya dipakai oleh script bot

## [2.0.0]

### Ditambahkan
- Verifikasi data cafe melalui Google Maps
- Field `gmaps_status`, `gmaps_url`, `gmaps_rating`, `gmaps_review_count`, dan `last_verified_at`
- Dashboard di halaman utama

## [1.0.0]

- Rilis awal API cafe Surabaya
