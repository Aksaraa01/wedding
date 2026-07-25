# **Aksara Ultimate End-to-End Database & System Architecture Blueprint**

Dokumen ini menyajikan spesifikasi teknis tingkat lanjut (enterprise-grade) untuk seluruh arsitektur sistem, skema database relasional (3NF), real-time protocol, serta alur data end-to-end (E2E) platform **Aksara Wedding Experience**. Arsitektur ini dirancang untuk memastikan skalabilitas tinggi, konsistensi data, nol biaya lisensi scanner fisik, perlindungan data sensitif, serta integrasi mulus antara aktivitas tamu di hari-H dengan dasbor internal pekerja.

## **1\. Arsitektur Jaringan & Topologi Sistem**

Aksara menggunakan arsitektur modular berbasis **Event-Driven Architecture (EDA)** untuk mendukung komunikasi real-time berlatensi rendah tanpa membebani database transaksional utama.

| Komponen | Teknologi Stack | Fungsi & Karakteristik Teknis   |
| :---- | :---- | :---- |
| **Web Frontend** | Next.js (React), Tailwind CSS | Rendering undangan digital secara dinamis (SSR/ISR) untuk kecepatan loading maksimal di HP tamu. |
| **Backend API Gateway** | Node.js (Express/NestJS) atau Go (Fiber) | Mengelola rute dinamis, autentikasi JWT, validasi skema input, dan sanitasi payload. |
| **Real-Time Message Broker** | Redis Pub/Sub & WebSockets (WS) | Menyalakan jembatan interaksi real-time dari ketukan tombol "Setujui" di dashboard WO ke layar HP tamu dan layar LED panggung. |
| **Transactional Database** | PostgreSQL (v15+) | Menjamin kepatuhan ACID penuh untuk transaksi keuangan, pencatatan RSVP tamu, dan status check-in hari-H. |
| **Asynchronous Task Queue** | BullMQ (Redis-backed) atau Celery | Memproses pengiriman pesan WhatsApp Blast, antrean pengingat otomatis (H-1), dan pencatatan log tanpa memblokir thread API utama. |
| **WhatsApp Gateway API** | Official WhatsApp Business API / Zenziva / Fonikte | Menangani pengiriman notifikasi, pelacakan status (Sent, Delivered, Read), dan webhook interaksi tamu secara dua arah. |

## **2\. Skema Database Relasional (PostgreSQL DDL \- 3NF Compliant)**

Untuk memastikan integritas data, performa kueri yang cepat melalui pengindeksan yang tepat, serta pemisahan aset multimedia beralokasi besar, berikut adalah rancangan skema SQL terstruktur:

`-- 1. Tabel Master Users`  
`CREATE TABLE users (`  
    `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
    `email VARCHAR(150) UNIQUE NOT NULL,`  
    `password_hash VARCHAR(255) NOT NULL, -- Di-hash menggunakan Argon2id`  
    `phone_number VARCHAR(20) UNIQUE NOT NULL,`  
    `role VARCHAR(30) DEFAULT 'CLIENT' CHECK (role IN ('ADMIN', 'WORKER', 'CONSULTANT', 'CLIENT')),`  
    `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,`  
    `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`  
`);`

`-- 2. Tabel Wedding Profiles`  
`CREATE TABLE wedding_profiles (`  
    `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
    `user_id UUID REFERENCES users(id) ON DELETE CASCADE,`  
    `bride_name VARCHAR(100) NOT NULL,`  
    `groom_name VARCHAR(100) NOT NULL,`  
    `estimated_wedding_date DATE NOT NULL,`  
    `estimated_guest_count INTEGER NOT NULL CHECK (estimated_guest_count > 0),`  
    `slug VARCHAR(100) UNIQUE NOT NULL, -- Contoh: 'dimas-kirana'`  
    `rekening_bank VARCHAR(100), -- Format: "BCA - 123456789 a/n Dimas"`  
    `gift_shipping_address TEXT,`  
    `total_project_cost DECIMAL(15, 2) DEFAULT 0.00,`  
    `payment_status VARCHAR(30) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIAL_DP', 'FULLY_PAID')),`  
    `global_web_templates(id),`  
    `global_physical_templates(id),`  
    `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,`  
    `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`  
`);`

`-- 3. Tabel Pemisahan Aset Multimedia (1:N ke Wedding Profile)`  
`CREATE TABLE multimedia_assets (`  
    `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
    `wedding_profile_id UUID REFERENCES wedding_profiles(id) ON DELETE CASCADE,`  
    `asset_url TEXT NOT NULL, -- Disimpan berupa tautan CDN (S3/Cloudinary)`  
    `asset_type VARCHAR(30) NOT NULL CHECK (asset_type IN ('PREWED_PHOTO', 'BACKGROUND_MUSIC', 'LOGO_ASSET')),`  
    `display_order INTEGER DEFAULT 0,`  
    `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`  
`);`

`-- 4. Tabel Master Tamu Undangan (Guests)`  
`CREATE TABLE guests (`  
    `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
    `wedding_profile_id UUID REFERENCES wedding_profiles(id) ON DELETE CASCADE,`  
    `name VARCHAR(150) NOT NULL,`  
    `phone_number VARCHAR(20) NOT NULL,`  
    `table_number VARCHAR(30) DEFAULT 'TBA',`  
    `category VARCHAR(50) DEFAULT 'Umum' CHECK (category IN ('Keluarga', 'Kerabat', 'Kantor', 'Kuliah', 'Umum')),`  
    `qr_token VARCHAR(100) UNIQUE NOT NULL, -- Token hash unik untuk QR Code`  
    `check_in_status VARCHAR(30) DEFAULT 'NOT_SCANNED' CHECK (check_in_status IN ('NOT_SCANNED', 'SCANNED')),`  
    `scanned_at TIMESTAMP WITH TIME ZONE NULL,`  
    `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,`  
    `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`  
`);`

`-- 5. Tabel Respons Reservasi (RSVP Automation)`  
`CREATE TABLE rsvp_responses (`  
    `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
    `guest_id UUID REFERENCES guests(id) ON DELETE CASCADE UNIQUE, -- Satu tamu hanya memiliki 1 status RSVP aktif`  
    `is_attending VARCHAR(30) NOT NULL CHECK (is_attending IN ('ATTENDING', 'DECLINED', 'TENTATIVE')),`  
    `pax_count INTEGER DEFAULT 0 CHECK (pax_count >= 0),`  
    `rejection_reason TEXT NULL, -- ucapan dari undangan`  
    `responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`  
`);`

`-- 6. Tabel Ucapan Doa & Wish Wall`  
`CREATE TABLE wishes (`  
    `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
    `wedding_profile_id UUID REFERENCES wedding_profiles(id) ON DELETE CASCADE,`  
    `guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,`  
    `guest_display_name VARCHAR(150) NOT NULL,`  
    `wish_text TEXT NOT NULL,`  
    `origin_type VARCHAR(30) NOT NULL CHECK (origin_type IN ('PRE_WEDDING_WEB', 'POST_SCAN_BALLROOM')),`  
    `moderation_status VARCHAR(30) DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING', 'APPROVED', 'HIDDEN', 'PINNED')),`  
    `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`  
`);`

`-- 7. Tabel Log Pengiriman WhatsApp Blast (Tracking & Automation Loop)`  
`CREATE TABLE whatsapp_logs (`  
    `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
    `guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,`  
    `message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('INITIAL_INVITE', 'RSVP_REMINDER', 'H_MIN_1_ALERT')),`  
    `delivery_status VARCHAR(30) DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED')),`  
    `sent_at TIMESTAMP WITH TIME ZONE NULL,`  
    `delivered_at TIMESTAMP WITH TIME ZONE NULL,`  
    `read_at TIMESTAMP WITH TIME ZONE NULL,`  
    `error_message TEXT NULL,`  
    `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,`  
    `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`  
`);`

`-- 8. Tabel Tiket Keluhan & Feedback Pengantin (Internal Ops & SLA Engine)`  
`CREATE TABLE feedback_tickets (`  
    `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
    `wedding_profile_id UUID REFERENCES wedding_profiles(id) ON DELETE CASCADE,`  
    `target_feature VARCHAR(50) NOT NULL CHECK (target_feature IN ('WEB_INVITATION', 'PHYSICAL_INVITATION', 'WA_BLAST', 'WISH_WALL')),`  
    `feedback_text TEXT NOT NULL,`  
    `assigned_consultant_id UUID REFERENCES users(id) ON DELETE SET NULL,`  
    `ticket_status VARCHAR(30) DEFAULT 'OPEN' CHECK (ticket_status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),`  
    `sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL, -- Ditentukan saat pembuatan tiket (1-2 jam dari saat terbuat)`  
    `resolved_at TIMESTAMP WITH TIME ZONE NULL,`  
    `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,`  
    `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`  
`);`

`CREATE TABLE global_web_templates (`   
`id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`   
`template_code VARCHAR(50) UNIQUE NOT NULL, -- Contoh: 'EDITORIAL_01', 'MINIMALIST_SAND', 'ADAT_JAWA_01' name VARCHAR(100) NOT NULL,`   
`style_category VARCHAR(50) NOT NULL CHECK (style_category IN ('ADAT', 'MODERN_MINIMALIS')),`   
`preview_thumbnail_url TEXT NOT NULL, -- Gambar sampul katalog di CDN`   
`is_active BOOLEAN DEFAULT TRUE,`   
`created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`   
`)`

`CREATE TABLE global_physical_templates (`   
`id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`   
`sku_code VARCHAR(50) UNIQUE NOT NULL, -- Contoh: 'PHY-GOLD-EMBOSS-01'`   
`name VARCHAR(100) NOT NULL,`   
`material_description TEXT NOT NULL, -- Keterangan`   
`kertas (Jasmine, Akasia, dll)`   
`base_price_per_pcs DECIMAL(15, 2) NOT NULL,`   
`preview_mockup_url TEXT NOT NULL, -- Foto mockup cetak 3D untuk katalog asset_blueprint_path TEXT NOT NULL, -- Path file mentah cetak (.ai / .pdf vector) di secure storage`   
`is_active BOOLEAN DEFAULT TRUE,`   
`created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`   
`);` 

`-- INDEKS UNTUK MENGOPTIMALKAN KINERJA KUERI`  
`CREATE INDEX idx_guests_qr_token ON guests(qr_token);`  
`CREATE INDEX idx_guests_profile_id ON guests(wedding_profile_id);`  
`CREATE INDEX idx_wishes_moderation ON wishes(wedding_profile_id, moderation_status);`  
`CREATE INDEX idx_whatsapp_logs_tracking ON whatsapp_logs(guest_id, message_type);`  
`CREATE INDEX idx_feedback_tickets_sla ON feedback_tickets(ticket_status, sla_deadline);`

## **3\. Alur Proses & Logika Bisnis End-to-End (E2E)**

### **A. Registrasi Pengantin & Dynamic Provisioning**

Saat pengantin baru mendaftar di situs Aksara, sistem backend menjalankan operasi ACID transaction yang aman untuk mencegah korupsi data:

> 1. **Input Validasi:** Backend menerima bride\_name, groom\_name, estimated\_wedding\_date, estimated\_guest\_count, nomor HP, email, dan sandi.  
> 2. **Pemberian ID & Penyimpanan Kredensial:** Menyimpan record di tabel users dengan enkripsi sandi menggunakan Argon2id.  
> 3. **Pembuatan Slug Unik:** Backend mengecek keunikan rute slug otomatis (misal: /dimas-kirana). Jika bertabrakan, sistem menambahkan akhiran numerik acak (misal: /dimas-kirana-2) di tabel wedding\_profiles.  
> 4. **Penugasan Konsultan Awal:** Secara acak atau berbasis beban kerja terendah, salah satu akun staf internal (dengan role CONSULTANT) langsung dipetakan ke profil pengantin ini guna memantau progres pengerjaan di bawah batasan SLA.

### **B. Mekanisme Reservasi Otomatis (RSVP Automation Engine)**

Ketika tamu undangan mengeklik tautan personalisasi mereka (misal: aksara.wedding/dimas-kirana?guest=TOKEN\_A), data yang dikirimkan dipetakan ke tabel relasional secara presisi:

> * Jika tamu memilih **"TIDAK HADIR" (DECLINED):** Baris data tamu di guests tetap utuh, tetapi record rsvp\_responses dibuat dengan is\_attending \= 'DECLINED' dan pax\_count \= 0\. Tamu diwajibkan menuliskan alasan ketidakhadiran pada field rejection\_reason untuk laporan statistik visual pengantin.  
> * Jika tamu memilih **"HADIR" (ATTENDING):** Field pax\_count diisi sesuai konfirmasi tamu (misal: "2 pax").  
> * **Logika Pengendalian Kapasitas (Catering Cap Logic):** Backend akan menjumlahkan seluruh pax\_count yang bersatus ATTENDING untuk kemudian dicocokkan dengan estimated\_guest\_count di tabel wedding\_profiles. Jika jumlah konfirmasi kehadiran riil melebihi estimasi awal pengantin sebesar 20%, sistem akan mengirimkan notifikasi peringatan dini ke dasbor internal pengantin dan konsultan agar mereka dapat mengantisipasi penambahan porsi katering di vendor eksternal.

### **C. QR Guest Book, Web-Based Scanner & Real-Time Live Greetings**

Untuk menghindari pembelian alat scanner tambahan yang mahal, Aksara menerapkan **Web-Based QR Code Reader** berbasis peramban HP milik kru WO. Integrasi ini murni gratis dan aman.

| Tahapan Alur | Proses Backend & Database | Pengalaman Tamu & Visual Hari-H   |
| :---- | :---- | :---- |
| **1\. Akses Scanner WO** | Kru WO membuka halaman khusus /dimas-kirana/scanner. Halaman memicu kamera HP menggunakan API bawaan gratis navigator.mediaDevices.getUserMedia. | Kamera HP kru WO menyala langsung di dalam browser Chrome/Safari tanpa perlu mengunduh aplikasi lain dari App Store/Play Store. |
| **2\. Pemindaian QR Tamu** | QR Code milik tamu (berisi token unik dari field qr\_token) dipindai. Browser mengurai token dan menembak endpoint API aman POST /api/wedding/scan. | Tamu menunjukkan layar HP-nya yang menampilkan halaman undangan digital pribadinya yang berisi visualisasi kode QR unik mereka sendiri. |
| **3\. Validasi & Penanganan Duplikasi** | Backend mengecek data di tabel guests: \- Jika status check\_in\_status \= 'NOT\_SCANNED', sistem memperbaruinya menjadi 'SCANNED' dan mengisi scanned\_at \= CURRENT\_TIMESTAMP. \- Jika status sudah 'SCANNED', API melempar pesan galat (Error): *"Sudah Check-In pada \[scanned\_at\]"* untuk mencegah satu tiket digunakan oleh dua orang yang berbeda secara ilegal. | Layar HP kru WO berkedip hijau terang dengan suara bip lembut jika berhasil, atau menyala merah menyala disertai detail log penipuan tiket jika QR dipindai untuk kedua kalinya. |
| **4\. Trigger Real-Time Greetings** | Setelah pemutakhiran database berhasil, backend mempublikasikan event ke **Redis Pub/Sub channel**: wedding:dimas-kirana:checked\_in dengan payload berisi data tamu terverifikasi (Nama, Meja, Kategori). WebSocket Server menangkap event ini dan menyalurkannya langsung ke koneksi WS aktif milik tamu. | **Seketika tanpa refresh halaman\!** Layar HP tamu yang tadinya menampilkan QR Code bertransisi lembut menjadi kartu ucapan sinematik mewah: *"Selamat Datang, Bapak Aditya Pratama\! Anda berada di Meja VIP-01 (Keluarga)"*. Layar monitor penerima tamu juga memperbarui log daftar kehadiran secara anggun. |

### **D. WhatsApp Blast Engine, Tracking Loop, & Smart Reminders**

Pengiriman pesan otomatis tidak boleh mengganggu kenyamanan tamu. Oleh sebab itu, Aksara membedakan alur pengingat secara selektif untuk menghemat kuota porsi katering pengantin:

> * **Pengiriman Undangan Awal (Initial Blast):** Mengirimkan pesan berisi link personalisasi tamu. Status WhatsApp dipantau melalui integrasi webhook gateway untuk mencatat metrik status di tabel whatsapp\_logs (SENT, DELIVERED, READ).  
> * **Pengingat Belum Merespon (RSVP Reminder):** BullMQ menjalankan tugas terjadwal 5 hari sebelum acara. Tugas ini menyaring data tamu di database yang status RSVP-nya di tabel rsvps\_responses masih kosong (belum merespons sama sekali). Sistem hanya akan mengirimkan pesan pengingat kepada segmen tamu yang acuh ini untuk memperjelas kehadiran mereka.  
> * **Pengingat H-1 Selektif (H-1 Smart Reminder):** Diluncurkan 24 jam sebelum akad/resepsi dimulai. **Sistem menerapkan aturan ketat:** Hanya mengirim pesan pengingat ke tamu yang baris datanya di tabel rsvp\_responses berstatus tegas is\_attending \= 'ATTENDING'. Tamu yang telah menyatakan tidak hadir (DECLINED) atau belum merespons sama sekali tidak akan dikirimi pesan ini. Hal ini menjamin pengantin tidak membuang anggaran souvenir dan katering berharga di hari bahagia mereka.

### **E. Integrasi Doa Tamu (Wish Wall: Pre-Wedding vs. Live Ballroom)**

Tabel wishes dirancang untuk mengelola ucapan selamat dalam dua siklus yang berbeda:

> 1. **Fase 1: Pre-Wedding Web Wishes**  
>    Sebelum hari pernikahan, tamu yang membuka undangan web dapat langsung mengisi kolom ucapan di bagian bawah situs. Ucapan ini terekam dengan tipe origin\_type \= 'PRE\_WEDDING\_WEB'. Status moderasi awal diatur menjadi APPROVED secara otomatis agar langsung menghiasi galeri doa di bagian bawah situs undangan pengantin.  
> 2. **Fase 2: Post-Scan Live Ballroom Wishes**  
>    Pasca pemindaian QR Code di meja penerima tamu hari-H, tamu diarahkan langsung ke halaman input doa instan melalui HP mereka sendiri. Doa yang dikirimkan terekam dengan tipe origin\_type \= 'POST\_SCAN\_BALLROOM' dan berstatus awal PENDING.  
>    Doa-doa ini akan masuk ke antrean dasbor tim WO / moderator. Begitu WO mengeklik tombol "Setujui" di dasbor internal mereka, status berubah menjadi APPROVED atau PINNED, yang seketika memicu broadcast WebSocket untuk melayangkan ucapan tersebut secara kinetik di layar LED panggung utama resepsi pengantin.

### **F. Tiket Keluhan & Logika Manajemen Finansial Internal Ops**

Untuk mendukung kualitas pengerjaan dan komitmen SLA 1-2 jam, sistem internal memantau siklus revisi dari pengantin sebagai berikut:

> 1. **Pemberian Umpan Balik (Feedback Creation):** Pengantin mengeklik tombol revisi draf di portal klien mereka (misal: merevisi musik latar di draf web undangan atau mengubah draf kata-kata WhatsApp Blast). Tiket keluhan baru tercipta otomatis di tabel feedback\_tickets dengan status OPEN.  
> 2. **Pemicu SLA Timer:** Detik itu juga, sistem menghitung tenggat waktu batas penyelesaian (sla\_deadline) selama tepat 2 jam ke depan dari waktu pembuatan tiket (created\_at). Dasbor internal pekerja Aksara akan memutar visualisasi waktu hitung mundur yang berubah warna secara progresif (Hijau \> Oranye \> Merah Berkedip) seiring mendekatnya tenggat.  
> 3. **Input Biaya Rekalkulasi & Status Finansial:** Jika revisi tersebut menuntut penambahan elemen fisik (seperti menambah kuota cetak amplop, peningkatan kualitas kertas, atau kuota WhatsApp Blast ekstra), pekerja internal dapat memasukkan nominal biaya tambahan pada kolom input di dasbor internal. Input ini akan mengeksekusi kalkulasi ulang pada field total\_project\_cost di tabel wedding\_profiles.  
> 4. **Pembaruan Status Pembayaran Manual:** Staf keuangan dapat memverifikasi bukti transfer manual dari klien dan mengubah status pembayaran (UNPAID, PARTIAL\_DP, atau FULLY\_PAID) di dasbor pekerja. Status terbaru ini secara instan dikirim ke portal pengantin klien untuk memunculkan notifikasi pelunasan atau langsung mengunci/membuka fitur draf web undangan digital mereka secara otomatis.

*Aksara Wedding Experience Platform Technical Specification Blueprint \- Confidential.*