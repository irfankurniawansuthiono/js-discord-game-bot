# Nanami

Nanami adalah bot Discord yang dirancang untuk menambahkan keseruan ke server Anda. Dengan integrasi AI dan fitur gaming yang seru, bot ini siap menjadi tambahan sempurna untuk komunitas Anda.

> **⚠️ Peringatan**: Bot ini tidak memiliki dokumentasi, jika anda ingin bertanya silahkan chat dan tag ipanks69 di [Server Discord](https://discord.gg/hXT5R2ND9a) 

## 📥 Instalasi

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan bot ini:

### 0. Discord Developer Portal
Untuk menjalankan bot ini, Anda harus memiliki akun Discord Developer Portal. Jika Anda belum memiliki akun, silakan daftar di [discord.com/developers](https://discord.com/developers).
> **ℹ️ Tata Cara Pembuatan Bot**:
> 1. Masuk ke [Discord Developer Portal](https://discord.com/developers).
> 2. Klik "New Application".
> 3. Masukkan nama dan deskripsi untuk aplikasi Anda.
> 4. Klik "Create".
> 5. Klik "Copy" pada bagian "Bot > Token" untuk mendapatkan token bot Anda.
> 6. Klik "Copy" pada bagian "Bot > Client ID" untuk mendapatkan ID bot Anda.

### 1. Clone Repositori
Clone repositori ini ke perangkat Anda:
```bash
git clone https://github.com/irfankurniawansuthiono/js-discord-game-bot.git
cd DiscordGameBot
```

### 2. Pasang Dependencies
Gunakan `npm` untuk menginstal semua dependencies yang diperlukan. Jangan gunakan `bun` atau runtime lainnya, karena dapat menyebabkan bug.
```bash
npm install
```

### 3. Konfigurasi File `.env`

Buat file `.env` di direktori root dan isi dengan format berikut:

```dotenv
TOKEN=
CLIENT_ID=
API_AI_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
GITHUB_TOKEN=
GITHUB_USERNAME=
ALVIAN_API_KEY=
```

#### 🔑 Cara Mendapatkan API Key dan Token:

##### 🤖 **API_AI_KEY (ITZKY API)**
1. Klik tautan berikut untuk bergabung dengan grup WhatsApp:
[Grup WhatsApp](https://chat.whatsapp.com/F8ffS5sazP60LYpG0IACEE).
2. Setelah Bergabung dengan Grup WhatsApp, silahkan dm bot itzky dengan nomor ini +7 996 845-47-96.
3. ketikkan perintah `.regisapi <apikey_custom>`.
4. Bot akan mengirimkan response bahwa  API Key telah didaftarkan.
5. Tempelkan ke file `.env` Anda seperti berikut:
   ```dotenv
   API_AI_KEY=apikey_custom
   ```

##### 📻 **Spotify (Developer API)**
1. Buka [https://developer.spotify.com](https://developer.spotify.com).
2. Login menggunakan akun Spotify Anda.
3. Klik **Dashboard**, lalu tekan tombol **Create an App**.
4. Masukkan nama dan deskripsi, lalu klik **Create**.
5. Setelah berhasil dibuat, klik pada aplikasi tersebut.
6. Salin `Client ID` dan `Client Secret` yang ditampilkan.
7. Tempelkan ke `.env` Anda pada bagian:
   ```dotenv
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

##### 🐱 **GitHub Token (Classic Token)**
> **⚠️ Peringatan**: Silahkan buat repository bernama public-uploads dan didalamnya ada folder file dengan 1 gambar random di dalamnya lalu push ke repository tersebut. fitur ini hanya membantu agar bot melakukan otomatisasi commit ke repository, agar github profile tetap hijau. JANGAN LUPA GANTI config.resetCommitId di file config.js dan salin SHA init pertama kali agar repository tidak berantakan. bisa di reset dengan command resetrepo.

1. Masuk ke akun GitHub Anda di [https://github.com](https://github.com).
2. Buka menu profil > **Settings**.
3. Di sidebar kiri, pilih **Developer Settings**.
4. Klik **Personal Access Tokens > Tokens (classic)**.
5. Klik **Generate new token (classic)**.
6. Beri nama token dan centang scope yang Anda butuhkan (misalnya `read:user`, `repo` jika diperlukan).
7. Klik **Generate Token**, lalu salin token yang muncul.
8. Tempelkan token tersebut ke `.env`:
   ```dotenv
   GITHUB_TOKEN=your_github_token
   GITHUB_USERNAME=your_github_username
   ```

##### 🧩 **Alvian API Key**
1. Kunjungi situs resmi: [https://api.alvianuxio.eu.org](https://api.alvianuxio.eu.org).
2. Lakukan **Sign Up** menggunakan email atau metode yang disediakan.
3. Setelah berhasil login, buka menu **API Key**.
4. Salin API Key yang tersedia dan tempelkan ke file `.env` Anda:
   ```dotenv
   ALVIAN_API_KEY=your_alvian_api_key
   ```
> **Catatan**: Pastikan API Key Anda aktif dan memiliki akses sesuai kebutuhan bot. Jangan pernah membagikan API Key secara publik.

### 4. Jalankan Bot
Setelah semua konfigurasi selesai, jalankan bot dengan perintah berikut:
```bash
npm start
```

## 🚀 Fitur Utama

- 🎮 **Game Interaktif**  
  Tambahkan keseruan di server Discord Anda dengan berbagai game interaktif.
- 🤖 **Integrasi AI**  
  Bot dilengkapi dengan AI untuk meningkatkan pengalaman bermain Anda.
- 🔧 **Mudah Dikustomisasi**  
  Sesuaikan bot sesuai kebutuhan komunitas Anda.

## ⚠️ Peringatan

- **Bot ini masih dalam tahap pengembangan.**
- **Jangan menjalankan bot ini menggunakan `bun` atau runtime lainnya selain `node.js`,** karena dapat menyebabkan bug yang tidak diinginkan.
- Pastikan semua API Key Anda valid dan diperoleh melalui sumber resmi.

## 🛠️ Teknologi yang Digunakan

- [Node.js](https://nodejs.org)
- [discord.js](https://discord.js.org)
- [Bun](https://bun.sh) *(digunakan hanya untuk inisialisasi proyek)*

## ✨ Kontribusi

Kami menyambut kontribusi dari komunitas! Jika Anda memiliki ide atau peningkatan, silakan buat **issue** atau kirimkan **pull request** di repositori ini.

## 💬 Dukungan

Jika Anda membutuhkan bantuan, jangan ragu untuk bergabung dengan server Discord kami:  
[Server Discord](https://discord.gg/hXT5R2ND9a)
[WhatsApp Channel](https://whatsapp.com/channel/0029Vb6zaGq3LdQXZ5PJpR0f)

---

Happy coding and gaming! 🎉
