# Kebijakan Keamanan

## Versi yang didukung

Hanya versi terbaru di branch `main` yang mendapat perbaikan keamanan.

## Melaporkan kerentanan

Jangan buka issue publik untuk kerentanan keamanan. Laporkan lewat salah satu cara berikut:

- Fitur [Private vulnerability reporting](https://github.com/Reyhandhani/surabaya-cafe-api/security/advisories/new) di GitHub.
- Atau hubungi pengelola lewat profil [GitHub Reyhandhani](https://github.com/Reyhandhani).

Sertakan:

- Langkah untuk mereproduksi masalah
- Dampak yang mungkin terjadi
- Endpoint atau file yang terdampak

Laporan akan ditanggapi sesegera mungkin. Setelah diperbaiki, kredit akan diberikan jika pelapor menghendaki.

## Catatan penggunaan

- Endpoint `POST /api/cafes` dilindungi header `x-api-key` yang dicocokkan dengan `ADMIN_API_KEY`. Jangan pernah commit key asli ke repo. Pakai `.env.example` sebagai contoh.
- Key dibandingkan langsung, bukan dengan perbandingan waktu konstan. Ini cukup untuk penggunaan skala kecil, tapi perlu diperkuat jika endpoint ini dipakai luas.
