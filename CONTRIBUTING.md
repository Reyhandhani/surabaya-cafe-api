# Panduan Kontribusi

Terima kasih sudah tertarik berkontribusi. Ada beberapa cara membantu:

- **Melaporkan bug** atau data yang salah lewat [issue](https://github.com/Reyhandhani/surabaya-cafe-api/issues).
- **Melengkapi data**, misalnya mengisi `facilities`, `needs_tags`, `instagram`, atau alamat yang masih berisi nama kategori.
- **Memperbaiki kode atau dokumentasi** lewat pull request.

## Menyiapkan workspace

```bash
git clone https://github.com/Reyhandhani/surabaya-cafe-api.git
cd surabaya-cafe-api
npm install
npm run dev
```

Butuh Node.js 18 atau lebih baru.

## Alur kerja

1. Buat issue dulu untuk perubahan besar, supaya bisa didiskusikan.
2. Buat branch dari `main`, misalnya `fix/alamat-kosong` atau `feat/filter-harga`.
3. Buat perubahan dan pastikan `npm test` lulus. Jika mengubah endpoint, perbarui juga `docs/openapi.yaml`.
4. Buka pull request dan isi template yang tersedia.

## Aturan data

- Jangan menambahkan data yang tidak bisa diverifikasi. Sertakan sumber jika memungkinkan.
- Jaga format field sesuai README. Tipe Array tetap Array, bukan string.
- Jangan mengubah `id` pada data yang sudah ada. `id` dihitung dari nama dan koordinat, dan dipakai sebagai referensi oleh pengguna API.
- Perubahan besar pada `data/cafes.json` sebaiknya dibuat dalam pull request terpisah dari perubahan kode.

## Gaya kode

- Ikuti gaya kode yang sudah ada di `server.js`.
- Gunakan nama variabel dan endpoint dalam bahasa Inggris. Pesan untuk pengguna boleh dalam bahasa Indonesia.
- Hindari dependensi baru kecuali benar-benar perlu.

## Commit

Gunakan pesan commit yang singkat dan jelas dalam bahasa Inggris atau Indonesia, misalnya:

```
fix: address field showing category name
feat: add pagination metadata to search
docs: update endpoint table
```
