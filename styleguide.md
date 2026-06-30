# Nalara Design System & Style Guide

Dokumen ini berisi panduan desain, palette warna, tipografi, komponen UI, dan pola layout yang digunakan di seluruh aplikasi **Nalara** (mulai dari Landing Page hingga modul Student, Lecturer, Tentor, dll.). 

Panduan ini bertujuan untuk memastikan konsistensi visual (consistency), harmoni (harmony), dan hierarki (hierarchy) yang kuat di setiap halaman.

---

## 1. Fondasi Desain & Tema (Nalara Tech Theme)

Nalara menggunakan **Dark Theme Premium** dengan aksen biru/azure cerah dan aksen kuning/lemon hangat. Detail konfigurasi ini dapat dilihat pada file global CSS: [globals.css](file:///c:/project/nalara/src/app/globals.css).

### A. Palet Warna (Color Palette)

#### 🔵 Core Navy & Blue (Tema Utama)
- **Navy**: `#0663C7` (`var(--navy)`) — Warna brand utama untuk tombol primary dan aksen dominan.
- **Deep Blue**: `#0053AD` (`var(--d-blue)`) — Background gradient gelap atau button hover state.
- **Medium Blue**: `#0671E0` (`var(--m-blue)`) — Hover state primary.
- **Azure**: `#4196F0` (`var(--azure)`) — Aksen teks terang, links, dan border glow.
- **Sky Blue**: `#DBEDFF` (`var(--sky)`) — Background subtle untuk elemen aktif.
- **Light Blue**: `#EEF5FC` (`var(--l-blue)`) — Highlight teks sangat halus.

#### 💛 Accent & Warning (Aksen/Perhatian)
- **Lemon**: `#FFA826` (`var(--lemon)`) — Tombol CTA penting, highlight promosi.
- **Medium Yellow**: `#FFB240` (`var(--m-yellow)`) — Aksen tech badge.
- **Dark Yellow**: `#E48900` (`var(--d-yellow)`) — Hover state CTA.
- **Straw**: `#FFC670` (`var(--straw)`) — Teks sekunder untuk perhatian/warning.

#### 🌑 Neutral & Dark Spec (Latar Belakang & Teks)
- **Dark Gray**: `#212121` (`var(--bg-dark)`) — Latar belakang halaman utama.
- **Darker Gray**: `#191919` (`var(--bg-darker)`) — Latar belakang section khusus / navbar / panel.
- **Silver**: `#F5F7FA` (`var(--silver)`) — Warna teks utama (cerah dan kontras tinggi).
- **Grey-Blue**: `#ABBED1` (`var(--grey-blue)`) — Warna deskripsi/paragraf (readable, tidak menusuk mata).
- **Disabled/Dark Grey**: `#4D4D4D` (`var(--d-grey)`) & `#717171` (`var(--grey)`) — Untuk borders, teks non-aktif, atau disabled buttons.

---

## 2. Tipografi (Typography)

Sistem tipografi diatur menggunakan dua font utama melalui Google Fonts:
1. **Plus Jakarta Sans** (`var(--font-display)`): Digunakan untuk Heading/Judul agar terkesan modern dan tech-oriented.
2. **Inter** (`var(--font-sans)`): Digunakan untuk body text, list, dan form element agar memiliki tingkat keterbacaan (readability) yang tinggi.

### Aturan Hierarki Tipografi
* **Hero Title (h1)**: `font-size: 3.6rem` (desktop) / `line-height: 1.15` / `font-weight: 800`.
* **Section Title (h2)**: `font-size: 2.2rem - 2.5rem` / `font-weight: 700` / `color: var(--white)`.
* **Card/Module Title (h3)**: `font-size: 1.3rem - 1.5rem` / `font-weight: 700`.
* **Body / Paragraph (p)**: `font-size: 1rem` / `line-height: 1.6` / `color: var(--grey-blue)`.

---

## 3. Komponen UI Utama (Reusable UI Components)

Tombol dan kartu dirancang menggunakan kombinasi class global dari [globals.css](file:///c:/project/nalara/src/app/globals.css) dan inline style React.

### A. Tombol (Buttons)

Semua tombol menggunakan kelas dasar `.nalara-btn`.

1. **Primary Button** (`.nalara-btn-primary`)
   - **Tampilan**: Gradient biru (`var(--navy)` ke `var(--m-blue)`), bayangan biru lembut.
   - **Guna**: Registrasi, Simpan, Kirim.
2. **Secondary Button** (`.nalara-btn-secondary`)
   - **Tampilan**: Semi-transparan putih dengan border halus.
   - **Guna**: Batal, Pelajari Lebih Lanjut, Unduh Silabus.
3. **CTA (Call-to-Action) Button** (`.nalara-btn-cta`)
   - **Tampilan**: Gradient Lemon-Yellow dengan bayangan orange-kuning cerah.
   - **Guna**: Pendaftaran Terbatas, Beli Kelas, Mulai Belajar.

### B. Badge Teknologi (Tech Badges)
Digunakan untuk melabeli informasi tanggal, status, atau tag materi.
* **Standard Badge** (`.badge-tech`): Background biru transparan, teks Azure.
* **Accent Badge** (`.badge-tech-accent`): Background orange transparan, teks Lemon.

### C. Glassmorphism Panels & Cards
Elemen kontainer di atas latar belakang radial gradient menggunakan `.glass-panel` yang memiliki properti:
* `background: rgba(33, 33, 33, 0.7)`
* `backdrop-filter: blur(16px)`
* `border: 1px solid var(--border-color)`
* **Hover Effect**: Border sedikit menyala dan bayangan membesar secara halus menggunakan `var(--transition-normal)`.

---

## 4. Struktur Halaman & Layout

### A. Navigation Bar (Navbar)
Navbar di Nalara menggunakan pendekatan *floating pill navigation* yang melayang di bagian atas halaman:
- `position: fixed; top: 1.25rem; left: 50%; transform: translateX(-50%);`
- Lebar maksimum: `1100px` dengan background blur `rgba(11, 11, 12, 0.45)` untuk mempertahankan readability konten di belakangnya.

### B. Pembatas Section (Section Dividers)
Gunakan pembatas halus di antara bagian-bagian besar halaman agar transisi terasa mulus:
```css
/* Gradasi halus dari transparan ke border-color lalu kembali transparan */
background: linear-gradient(90deg, transparent, var(--border-color) 30%, var(--border-color) 70%, transparent);
height: 1px;
```

---

## 5. Implementasi & Ekstensi ke Modul Lain

Saat mengembangkan modul baru seperti **Student**, **Lecturer**, **Tentor**, atau **Superadmin**, ikuti prinsip-prinsip berikut agar tampilan tetap konsisten dengan Landing Page:

1. **Gunakan CSS Variables**: Hindari menggunakan nilai warna hex langsung (hardcoded). Gunakan `var(--primary)`, `var(--bg-dark)`, dan `var(--white)` agar jika ada perubahan tema global, modul lain langsung menyesuaikan.
2. **Terapkan Card Standard**: Gunakan component pembungkus seperti `<Card glow>` yang telah disediakan di modul quiz: [Card.tsx](file:///c:/project/nalara/src/components/quiz/Card.tsx) (jika ada).
3. **Pertahankan Layout Spacing**: Berikan padding section vertikal yang konsisten (`padding: 5rem 1.5rem` atau `7rem 1.5rem` untuk hero/header utama).
4. **Optimalkan Micro-animations**: Terapkan `@keyframes fadeInUp` untuk transisi halaman masuk agar terkesan premium dan interaktif.
