import { EmbedBuilder } from "discord.js";
import fs from "fs";
import {config} from "../config.js"; // Pastikan config memiliki ownerId

class BackupFiles {
    constructor(client) {
        if (!BackupFiles.instance) {
            this.client = client;
            this.playersPath = "./players.json";
            this.guildsPath = "./guilds.json";
            BackupFiles.instance = this;
        }
        return BackupFiles.instance;
    }

    async startBackup() {
        try {
            // Cek apakah file backup tersedia sebelum mengirim
            if (!fs.existsSync(this.playersPath) || !fs.existsSync(this.guildsPath)) {
                throw new Error("File backup tidak ditemukan. Pastikan file tersedia sebelum mengirim.");
            }

            // Ambil ID dan user owner
            const ownerId = config.ownerId[0];
            const owner = await this.client.users.fetch(ownerId);

            // Dapatkan tanggal & waktu sekarang
            const now = new Date();
            const formattedDate = now.toLocaleString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: "Asia/Jakarta",
            });

            // Buat embed untuk informasi backup
            const embed = new EmbedBuilder()
                .setColor("#FFD700")
                .setTitle("📂 Backup Files")
                .setDescription("Backup berhasil dilakukan. Berikut adalah file backup-nya.")
                .addFields(
                    { name: "📅 Tanggal Backup", value: formattedDate },
                    { name: "📁 Players File", value: this.playersPath, inline: true },
                    { name: "📁 Guilds File", value: this.guildsPath, inline: true }
                )
                .setFooter({ text: "Nanami Backup System" })
                .setTimestamp();

            // Kirim embed + file ke owner
            await owner.send({
                embeds: [embed],
                files: [this.playersPath, this.guildsPath],
            });

            console.log(`Backup berhasil dikirim ke owner pada ${formattedDate}`);
        } catch (error) {
            console.error("Backup failed:", error);

            // Kirim pesan error ke owner jika backup gagal
            try {
                const ownerId = config.ownerId[0];
                const owner = await this.client.users.fetch(ownerId);

                const errorEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle("⚠️ Backup Failed")
                    .setDescription(`Terjadi kesalahan saat mengirim file backup.\n\n**Error:** ${error.message}`)
                    .setFooter({ text: "Nanami Backup System" })
                    .setTimestamp();

                await owner.send({ embeds: [errorEmbed] });
            } catch (err) {
                console.error("Failed to notify owner:", err);
            }
        }
    }
}

export default BackupFiles;
