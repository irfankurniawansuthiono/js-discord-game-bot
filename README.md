# DiscordGameBot  

DiscordGameBot adalah bot Discord yang dirancang untuk memberikan pengalaman bermain game yang menyenangkan dan interaktif di server Discord Anda. Dengan integrasi AI dan fitur gaming yang seru, bot ini siap menjadi tambahan sempurna untuk komunitas Anda.  

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
```  
TOKEN=  
CLIENT_ID=  
API_AI_KEY=  
```  

> **ℹ️ Catatan Penting**:  
> Anda harus mendapatkan API Key melalui grup WhatsApp resmi kami. Ikuti langkah berikut untuk bergabung dan mendaftarkan API Key Anda:  
>  
> 1. Klik tautan berikut untuk bergabung dengan grup WhatsApp:  
> [Grup WhatsApp](https://chat.whatsapp.com/F8ffS5sazP60LYpG0IACEE)  
> 2. Setelah bergabung, gunakan perintah berikut di grup untuk mendaftarkan API Key Anda:  
> ```  
> .regisapi <apikey>  
> ```  

### 4. Jalankan Bot  
Setelah semua konfigurasi selesai, jalankan bot dengan perintah berikut:  
```bash  
node --env-file=.env index.js  
```  

## 🚀 Fitur Utama  

- 🎮 **Game Interaktif**  
  Tambahkan keseruan di server Discord Anda dengan berbagai game interaktif.  
- 🤖 **Integrasi AI**  
  Bot dilengkapi dengan AI untuk meningkatkan pengalaman bermain Anda.  
- 🔧 **Mudah Dikustomisasi**  
  Sesuaikan bot sesuai kebutuhan komunitas Anda.  

## ⚠️ Peringatan  

- **Jangan menjalankan bot ini menggunakan `bun` atau runtime lainnya selain `node.js`,** karena dapat menyebabkan bug yang tidak diinginkan.  
- Pastikan API Key Anda valid dan diperoleh melalui grup resmi kami.  

## 🛠️ Teknologi yang Digunakan  

- [Node.js](https://nodejs.org)  
- [discord.js](https://discord.js.org)  
- [Bun](https://bun.sh) *(digunakan hanya untuk inisialisasi proyek)*  

## ✨ Kontribusi  

Kami menyambut kontribusi dari komunitas! Jika Anda memiliki ide atau peningkatan, silakan buat **issue** atau kirimkan **pull request** di repositori ini.  

## 💬 Dukungan  

Jika Anda membutuhkan bantuan, jangan ragu untuk bergabung dengan server Discord kami:  
[Server Discord](https://discord.gg/9GHsXstwM9)  

---  

Happy coding and gaming! 🎉  

### Fitur Tambahan:
1. **Langkah-Langkah Instalasi yang Detail**  
   Memastikan pengguna memahami proses instalasi dari awal hingga akhir.  

2. **Dukungan dan Server Discord**  
   Menambahkan detail cara mendapatkan bantuan melalui grup resmi.  

3. **Struktur yang Jelas dan Menarik**  
   Membuat setiap bagian mudah dibaca dan dipahami, dengan ikon untuk meningkatkan daya tarik.  
