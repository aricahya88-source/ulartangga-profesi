# Ular Tangga 3D — 4 Kompetensi Guru

Website statis 1 vs 1 berbasis **Vite + TypeScript + Babylon.js** dengan bank soal literasi 50 butir.

## Teknologi
- Vite 8
- TypeScript
- Babylon.js ES modules (`@babylonjs/core` + `@babylonjs/loaders`)
- MediaPipe Tasks Vision (fondasi opsional, tidak meminta izin kamera secara default)
- GLB lokal untuk pion, dadu, ular, dan tangga
- HTML/CSS overlay untuk HUD, soal, skor, dan pembahasan

## Aturan papan
- 1–10: Pedagogik
- 11–20: Profesional
- 21–30: Kepribadian
- 31–40: Sosial
- 41–50: Integratif
- Tangga: 4→13, 9→18, 17→28, 26→36, 34→44
- Ular: 15→6, 24→14, 32→21, 43→31, 48→37
- Bonus: 7, 20, 29, 39, 46
- Petak 50: Final Challenge

Soal diambil acak berdasarkan zona kompetensi dan tidak diulang antarpemain selama bank zona masih tersedia.

## Menjalankan
```bash
npm install
npm run dev
```
Lalu buka alamat lokal yang ditampilkan Vite.

Build produksi:
```bash
npm run build
npm run preview
```

## Deploy Vercel
Hubungkan repository ke Vercel. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.

## Model 3D
Semua model di `public/models` dibuat secara procedural khusus untuk proyek ini, tanpa mengunduh aset pihak ketiga:
- `pawn-blue.glb`
- `pawn-red.glb`
- `dice.glb`
- `snake.glb`
- `ladder.glb`

Dengan demikian tidak ada ketergantungan lisensi model eksternal.

## MediaPipe
`src/vision/MediaPipeController.ts` disiapkan untuk pengembangan mode gesture berikutnya. Controller tidak aktif secara default, jadi game utama tidak meminta akses kamera.

## Bank soal
`src/data/questions.json` berisi tepat 50 soal:
- 10 Pedagogik
- 10 Profesional
- 10 Kepribadian
- 10 Sosial
- 10 Integratif

Komposisi tipe soal: 20 pilihan ganda, 10 benar/salah, 10 menjodohkan, dan 10 jawaban lebih dari satu.
