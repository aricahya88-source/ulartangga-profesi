# Ular Tangga 3D — 4 Kompetensi Guru

**PlayCanvas Engine + Vite + TypeScript — v3.0.0**

Versi ini merupakan rebuild dari proyek Babylon sebelumnya. Mesin 3D ditulis ulang menggunakan PlayCanvas Engine standalone, sedangkan logika permainan dan bank soal 50 butir tetap dipertahankan.

## Fitur utama

- 1 vs 1, Player A dan Player B.
- Papan 3D 50 petak dengan lima zona kompetensi.
- Angka **1–50 menggunakan DOM world-to-screen overlay**, sehingga tidak bergantung pada tekstur petak dan tetap terbaca ketika kamera berpindah sudut.
- 5 tangga: 4→13, 9→18, 17→28, 26→36, 34→44.
- 5 ular: 15→6, 24→14, 32→21, 43→31, 48→37.
- 5 bonus: 7, 20, 29, 39, 46.
- Final Challenge di petak 50.
- 50 soal literasi: 20 PG, 10 benar/salah, 10 menjodohkan, 10 multi-answer.
- Tiap zona tepat 10 soal: 4 PG + 2 B/S + 2 matching + 2 multi-select.
- Soal diacak sesuai zona dan tidak diulang antarpemain selama bank zona masih tersedia.
- Ular procedural terdiri dari banyak segmen dan bergerak halus setiap frame.
- Tangga procedural 3D dengan rail, rung, dan metal caps.
- Pion berdiri, bukan bidak pipih.
- Material pion dapat dipilih: Glossy Plastic, Metallic, Matte, Marble.
- Material premium: walnut procedural, felt, metal trim, snake scales, marble.
- Dadu 3D procedural dengan pip fisik.
- Kamera sinematik dengan beberapa preset, drag-to-orbit, scroll-to-zoom, dan auto-focus pada dadu/pion/event.
- Pencahayaan key + cool fill + warm fill dan shadow-casting directional light.
- Sparkle effect procedural pada bonus, tangga berhasil, dan kemenangan.
- MediaPipe controller disiapkan sebagai fondasi, tetapi kamera tidak diminta secara otomatis.

## Zona materi

- 1–10: Pedagogik
- 11–20: Profesional
- 21–30: Kepribadian
- 31–40: Sosial
- 41–50: Integratif

## Menjalankan lokal

Gunakan Node.js 22.x.

```bash
npm install
npm run dev
```

Untuk build produksi:

```bash
npm run build
npm run preview
```

## Deploy ke Vercel

- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js: **22.x**

`vercel.json` sudah disediakan.

## Arsitektur

```text
src/
├── game/
│   ├── Board.ts
│   ├── Dice.ts
│   ├── GameManager.ts
│   ├── Player.ts
│   ├── TileEvent.ts
│   └── TurnManager.ts
├── questions/
│   ├── QuestionEngine.ts
│   ├── SingleChoice.ts
│   ├── TrueFalse.ts
│   ├── Matching.ts
│   ├── MultiSelect.ts
│   └── types.ts
├── scene/
│   ├── GameScene.ts
│   ├── BoardFactory.ts
│   ├── CameraController.ts
│   ├── LadderFactory.ts
│   ├── Lighting.ts
│   ├── MaterialFactory.ts
│   ├── PawnFactory.ts
│   └── SnakeFactory.ts
├── effects/
│   ├── Animations.ts
│   ├── ParticleEffects.ts
│   └── PostProcessing.ts
├── ui/
│   ├── HUD.ts
│   └── TileNumberOverlay.ts
├── vision/
│   └── MediaPipeController.ts
├── data/
│   └── questions.json
└── main.ts
```

## Mengapa ular tidak memakai GLB?

Ular perlu menghubungkan petak yang jaraknya berbeda-beda. Meregangkan satu GLB akan membuat kepala, tubuh, dan tekstur ikut terdistorsi. Pada v3.0 ular dibuat sebagai rangkaian segmen procedural sehingga panjangnya otomatis mengikuti pasangan petak, tubuh dapat berkelok, dan animasi dapat mengalir sepanjang badan.

## GLB

GLB tidak dibutuhkan untuk versi ini. `public/models/` tetap tersedia bila nanti ingin menambahkan aset dekorasi atau mengganti pion dengan model eksternal. Gunakan aset buatan sendiri, CC0, atau lisensi yang jelas mengizinkan penggunaan tersebut.

## Validasi yang dilakukan

- Bank soal: 50/50 tervalidasi.
- Setiap kompetensi: 10 soal.
- Tipe keseluruhan: 20 PG, 10 B/S, 10 matching, 10 multi-select.
- TypeScript proyek diperiksa menggunakan stub API lokal untuk menangkap kesalahan sintaks/type internal karena registry npm tidak dapat diakses dari container pembuatan paket.
- Versi dependency dikunci di `package.json`: PlayCanvas 2.22.2, Vite 8.3.0, TypeScript 5.8.3, MediaPipe Tasks Vision 1.0.1.
