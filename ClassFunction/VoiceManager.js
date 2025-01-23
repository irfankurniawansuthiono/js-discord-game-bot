import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionsBitField,
} from "discord.js";
import {
  QueueRepeatMode,
  useMainPlayer,
  useQueue,
} from "discord-player";
import { discordEmotes } from "../config.js";
class VoiceManager {
    constructor() {
        this.voiceConnections = new Map();
        this.audioPlayers = new Map();
    }
    async setVolume(message, volume) {
        try {
          // Validasi volume input
          if (isNaN(volume) || volume < 0 || volume > 100) {
            return message.reply(`${discordEmotes.error} Volume must be a number between 0 and 100.`);
          }
      
          // Fetch queue
          const queue = useQueue(message.guild.id);
          if (!queue || !queue.node.isPlaying()) {
            return message.reply(`${discordEmotes.error} No music is currently playing.`);
          }
      
          // Set volume menggunakan queue
          queue.node.setVolume(volume);
          return message.reply(`${discordEmotes.success} Volume set to ${volume}%`);
        } catch (error) {
          console.error("Error while setting volume:", error);
      
          // Tangani berbagai jenis error
          if (error.code === "ERR_ILLEGAL_HOOK_INVOCATION") {
            return message.reply(`${discordEmotes.error} An internal error occurred. Please try again later.`);
          }
      
          return message.reply(`${discordEmotes.error} Error setting volume!`);
        }
      }
      
    async queueMusic(message) {
      try {
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`,
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`,
          });
        }
        const queue = useQueue(message.guild.id);
        if (!queue)
          return message.reply({
            content: `${discordEmotes.error} No music in queue.`,
          });
        const currentQueue = queue.tracks.toArray();
        if (currentQueue.length === 0)
          return message.reply({
            content: `${discordEmotes.error} No music in queue.`,
          });
        if (currentQueue.length > 10) {
          let currentPage = 1;
          const pageSize = 10;
          const totalPages = Math.ceil(currentQueue.length / pageSize);
  
          // Fungsi untuk mendapatkan lagu di halaman tertentu
          const getPageSongs = (pageNumber) => {
            const start = (pageNumber - 1) * pageSize;
            const end = start + pageSize;
            return currentQueue
              .slice(start, end)
              .map((track, index) => `${start + index + 1}. ${track.title}`)
              .join("\n");
          };
  
          // Buat embed awal
          const embed = new EmbedBuilder()
            .setColor("#FFF000")
            .setTitle("🎵 Music Queue")
            .setDescription(getPageSongs(currentPage))
            .setFooter({
              text: `Page ${currentPage}/${totalPages} • Requested by ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL(),
            });
  
          // Buat row button
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("prev")
              .setLabel("Previous")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId("next")
              .setLabel("Next")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === totalPages),
            new ButtonBuilder()
              .setCustomId("close")
              .setLabel("Close")
              .setStyle(ButtonStyle.Danger)
          );
  
          // Kirim pesan awal
          const queueMsg = await message.reply({
            embeds: [embed],
            components: [row],
          });
  
          // Buat collector
          const collector = queueMsg.createMessageComponentCollector({
            time: 60000,
            filter: (i) => i.user.id === message.author.id,
          });
  
          collector.on("collect", async (interaction) => {
            // Handle button clicks
            if (interaction.customId === "prev") {
              if (currentPage > 1) currentPage--;
            } else if (interaction.customId === "next") {
              if (currentPage < totalPages) currentPage++;
            } else if (interaction.customId === "close") {
              await queueMsg.delete().catch(() => {});
              return collector.stop();
            }
  
            // Update embed
            embed.setDescription(getPageSongs(currentPage));
            embed.setFooter({
              text: `Page ${currentPage}/${totalPages} • Requested by ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL(),
            });
  
            // Update button states
            row.components[0].setDisabled(currentPage === 1);
            row.components[1].setDisabled(currentPage === totalPages);
  
            // Update message
            await interaction.update({
              embeds: [embed],
              components: [row],
            });
          });
  
          collector.on("end", () => {
            if (!queueMsg.deleted) {
              row.components.forEach((button) => button.setDisabled(true));
              queueMsg.edit({ components: [row] }).catch(() => {});
            }
          });
        } else {
          // Jika lagu 10 atau kurang
          const embed = new EmbedBuilder()
            .setColor("#FFF000")
            .setTitle("🎵 Music Queue")
            .setDescription(
              currentQueue
                .map((track, index) => `${index + 1}. ${track.title}`)
                .join("\n")
            )
            .setFooter({
              text: `Requested by ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL(),
            });
  
          await message.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error("Error in queueMusic:", error);
        return message.reply({
          content: `${discordEmotes.error} An error occurred while displaying the queue.`,
        });
      }
    }
    async shuffleMusic(message) {
      try {
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`,
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`,
          });
        }
        // Get the queue for the current guild
        const queue = useQueue(message.guild.id);
  
        if (!queue || !queue.isPlaying()) {
          return message.reply(
            `${discordEmotes.error} No music is currently playing!`
          );
        } else if (queue.tracks.length < 2) {
          return message.reply(
            `${discordEmotes.error} The queue must have at least 2 tracks to shuffle!`
          );
        }
  
        // Shuffle the queue
        queue.toggleShuffle();
  
        // Send a success message
        return message.reply("✅ The queue has been shuffled!");
      } catch (error) {
        console.error("Error in shuffleMusic:", error);
        return message.reply({
          content: `${discordEmotes.error} An error occurred while shuffling the queue.`,
        });
      }
    }
    async loopMusic(message, option) {
      try {
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`,
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`,
          });
        }
        // Mendapatkan queue untuk server saat ini
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying()) {
          return message.reply(
            `${discordEmotes.error} No music is currently playing!`
          );
        }
  
        // Tentukan mode loop berdasarkan opsi yang diberikan
        let repeatMode;
        switch (option) {
          case "queue":
            repeatMode = QueueRepeatMode.QUEUE;
            break;
          case "track":
            repeatMode = QueueRepeatMode.TRACK;
            break;
          case "off":
            repeatMode = QueueRepeatMode.OFF;
            break;
          case "autoplay":
            repeatMode = QueueRepeatMode.AUTOPLAY;
            break;
          default:
            return message.reply(
              `${discordEmotes.error} Invalid option: \`${option}\`. Available options: queue, track, off, autoplay.`
            );
        }
  
        // Menerapkan mode loop
        queue.setRepeatMode(repeatMode);
  
        // Membalas dengan konfirmasi mode loop
        const modeText = {
          [QueueRepeatMode.QUEUE]: "🔄 Looping the entire queue.",
          [QueueRepeatMode.TRACK]: "🔂 Looping the current track.",
          [QueueRepeatMode.OFF]: `❌ Looping is now disabled.`,
          [QueueRepeatMode.AUTOPLAY]: "🎵 Autoplay mode enabled.",
        };
  
        return message.reply(modeText[repeatMode]);
      } catch (error) {
        console.error("Error in loopMusic:", error);
        return message.reply(
          `${discordEmotes.error} An error occurred while setting the loop mode.`
        );
      }
    }
  
    async getSyncedLyrics(message, title) {
      try {
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`,
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`,
          });
        }
        // Cari lirik berdasarkan judul lagu
        const results = await player.lyrics.search({ q: title });
        if (!results || results.length === 0) {
          return message.reply({
            content: `${discordEmotes.error} No lyrics found for this track.`,
          });
        }
  
        // Ambil hasil pertama
        const first = results[0];
        if (!first.syncedLyrics) {
          return message.reply({
            content: `${discordEmotes.error} Synced lyrics are not available for this track.`,
          });
        }
  
        // Ambil queue dan pastikan ada track yang sedang diputar
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.currentTrack) {
          return message.reply({
            content: `${discordEmotes.error} No active music queue or track playing.`,
          });
        }
  
        // Muat lirik sinkron ke dalam queue
        const syncedLyrics = queue.syncedLyrics(first);
  
        // Fungsi untuk menangani pembaruan lirik secara live
        const onLyricsUpdate = async (lyrics, timestamp) => {
          const formattedTime = new Date(timestamp).toISOString().substr(14, 5); // Format MM:SS
          try {
            await message.channel.send({
              content: `\`[${formattedTime}]\` ${lyrics}`,
              allowedMentions: { parse: [] },
            });
          } catch (error) {
            console.error("Error sending synced lyrics:", error);
          }
        };
  
        // Langganan perubahan lirik secara live
        syncedLyrics.onChange((lyrics, timestamp) => {
          onLyricsUpdate(lyrics, timestamp).catch(console.error);
        });
  
        // Langganan untuk mulai memantau
        const unsubscribe = syncedLyrics.subscribe();
  
        // Tangani ketika track selesai diputar
        player.events.on("playerFinish", () => {
          unsubscribe();
        });
  
        // Kirim pesan awal
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🎵 Synced Lyrics Started")
          .setDescription(
            `Now showing synced lyrics for: **${
              queue.currentTrack.title ?? title
            }**`
          )
          .setThumbnail(
            queue.currentTrack.thumbnail ?? message.author.displayAvatarURL()
          )
          .setTimestamp();
  
        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error("Error in getSyncedLyrics:", error);
        return message.reply({
          content: `${discordEmotes.error} Failed to get synced lyrics: ${error.message}`,
        });
      }
    }
  
    nowPlaying(message) {
      try {
        // Get the queue for this guild
        const queue = useQueue(message.guild.id);
  
        // Check if queue exists
        if (!queue || !queue.isPlaying()) {
          return message.reply({
            content: `${discordEmotes.error} No music is currently playing!`,
          });
        }
  
        // Get current track
        const currentTrack = queue.currentTrack;
        if (!currentTrack) {
          return message.reply({
            content: `${discordEmotes.error} No track is currently playing!`,
          });
        }
  
        // Format upcoming tracks
        const formatUpcomingTracks = () => {
          const tracks = queue.tracks.toArray();
          if (tracks.length === 0) {
            return "💽 No upcoming tracks in queue";
          }
  
          return tracks
            .slice(0, 5) // Limit to first 5 tracks
            .map((track, index) => {
              const requestedBy =
                track.requestedBy?.displayName ||
                track.requestedBy?.username ||
                "Unknown";
              return `${index + 1}. **${
                track.title
              }** - Requested by: ${requestedBy}`;
            })
            .join("\n");
        };
  
        // Create embed
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🎶 Now Playing")
          .setDescription(`**${currentTrack.title ?? "Unknown Title"}**`)
          .addFields(
            {
              name: "Duration",
              value: currentTrack.duration ?? "Unknown",
              inline: true,
            },
            {
              name: "Requested By",
              value: currentTrack.requestedBy?.displayName
                ? currentTrack.requestedBy?.username
                : "Unknown",
              inline: true,
            },
            {
              name: "Upcoming Tracks",
              value: formatUpcomingTracks(),
              inline: false,
            }
          )
          .setTimestamp();
  
        // Send response
        return message.reply({ embeds: [embed] });
      } catch (error) {
        console.error("Error in nowPlaying command:", error);
        return message.reply({
          content: `${discordEmotes.error} An error occurred while getting the current track information.`,
        });
      }
    }
  
    async searchMusic(message, query) {
      try {
        const player = useMainPlayer();
        const results = await player.search(query, {
          requestedBy: message.author.username,
        });
  
        if (results.tracks.length === 0) {
          return message.reply(`${discordEmotes.error} No results found!`);
        }
  
        // return 10 song
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🎵 Search Results")
          .setDescription(
            results.tracks
              .slice(0, 10)
              .map(
                (track, index) => `${index + 1}. ${track.title} - ${track.author}`
              )
              .join("\n")
          )
          .setTimestamp();
  
        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error("Error in searchMusic:", error);
        message.reply(
          `${discordEmotes.error} Error searching music! Please try again.`
        );
      }
    }
  
    async getLyrics(message, title) {
      try {
        const player = useMainPlayer();
        const lyrics = await player.lyrics.search({ q: title });
  
        if (!lyrics || lyrics.length <= 0) {
          return message.reply(`${discordEmotes.error} No lyrics found!`);
        }
        const trimmedLyrics = lyrics[0].plainLyrics.substring(0, 1997);
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle(`🎵 ${lyrics[0].trackName ?? title}`)
          .setThumbnail(lyrics[0].thumbnail ?? message.author.displayAvatarURL())
          .setAuthor({
            name: lyrics[0]?.artist?.name ?? title, // Gunakan nullish coalescing operator (??) untuk memberikan fallback jika undefined atau null
            iconURL:
              lyrics[0]?.artist?.image ?? message.author.displayAvatarURL(), // Ganti dengan URL gambar default jika artist.image tidak ada
            url: lyrics[0]?.artist?.url ?? "https://irfanks.site", // Ganti dengan URL default atau link yang diinginkan jika artist.url tidak ada
          })
          .setDescription(
            trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics
          )
          .setTimestamp();
  
        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error("Error in getLyrics:", error);
        message.reply(
          `${discordEmotes.error} Error getting lyrics! Please try again.`
        );
      }
    }
    async playMusic(message, query) {
        try {
          const guildId = message.guild.id;
          const voiceChannel = message.member.voice.channel;
           // Regex untuk mendeteksi semua tautan YouTube
          // const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)/;

          // if (youtubeRegex.test(message.content)) {
          //     return message.reply(`${discordEmotes.error} This bot does not support YouTube links yet.);
          // }
          // Basic checks
          if (!voiceChannel) {
            return message.reply("You need to be in a voice channel first!");
          }
      
          if (
            message.guild.members.me.voice.channel &&
            message.guild.members.me.voice.channel !== voiceChannel
          ) {
            return message.reply(
              "I am already playing in a different voice channel!"
            );
          }
      
          // Permission checks
          const permissions = voiceChannel.permissionsFor(message.guild.members.me);
          if (!permissions.has(PermissionsBitField.Flags.Connect)) {
            return message.reply(
              "I do not have permission to join your voice channel!"
            );
          }
      
          if (!permissions.has(PermissionsBitField.Flags.Speak)) {
            return message.reply(
              "I do not have permission to speak in your voice channel!"
            );
          }
      
          const loadingMsg = await message.reply(
            `${discordEmotes.loading} Loading music...`
          );
      
          try {
            const player = useMainPlayer();

      
            const { track } = await player.play(voiceChannel, query, {
              nodeOptions: {
                metadata: {
                  channel: message.channel,
                },
                selfDeaf: true,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 300000, // 5 minutes
                leaveOnEnd: true,
                leaveOnEndCooldown: 300000, // 5 minutes
              },
              requestedBy: message.author,
            });
      
            // Update loading message with track info
            await loadingMsg.edit(`🎶 Added to queue: **${track.title}**`);
      
            // Store the connection
            this.voiceConnections.set(guildId, player);
          } catch (error) {
            console.error("Error playing track:", error);
            await loadingMsg.edit(`${discordEmotes.error} Error: ${error.message}`);
            this.cleanupConnection(guildId);
          }
        } catch (error) {
          console.error("Error in playMusic:", error);
          message.reply(
            `${discordEmotes.error} Error: ${
              error.message || "Failed to play music"
            }`
          );
        }
      }
  
    // Helper method for cleanup
    cleanupConnection(guildId) {
      const connection = this.voiceConnections.get(guildId);
      if (connection) {
        connection.destroy();
        this.voiceConnections.delete(guildId);
      }
    }
  
    // Helper method for cleanup
    cleanupConnection(guildId) {
      const connection = this.voiceConnections.get(guildId);
      if (connection) {
        connection.destroy();
        this.voiceConnections.delete(guildId);
      }
    }
  
    // Helper method for cleanup
    cleanupExistingConnection(guildId) {
      const existingConnection = this.voiceConnections.get(guildId);
      const existingPlayer = this.audioPlayers.get(guildId);
  
      if (existingPlayer) {
        existingPlayer.stop();
        this.audioPlayers.delete(guildId);
      }
  
      if (existingConnection) {
        existingConnection.destroy();
        this.voiceConnections.delete(guildId);
      }
    }
  
    async checkcUserVoice(message) {
      try {
        const guildId = message.guild.id;
        const voiceChannel = message.member.voice.channel;
  
        // Basic checks
        if (!voiceChannel) {
          return message.reply("You need to be in a voice channel first!");
        }
  
        if (
          message.guild.members.me.voice.channel &&
          message.guild.members.me.voice.channel !== voiceChannel
        ) {
          return message.reply(
            "I am already playing in a different voice channel!"
          );
        }
  
        // Permission checks
        const permissions = voiceChannel.permissionsFor(message.guild.members.me);
        if (!permissions.has(PermissionsBitField.Flags.Connect)) {
          return message.reply(
            "I do not have permission to join your voice channel!"
          );
        }
  
        if (!permissions.has(PermissionsBitField.Flags.Speak)) {
          return message.reply(
            "I do not have permission to speak in your voice channel!"
          );
        }
      } catch (error) {
        console.error("Error in checkUserVoice:", error);
        message.reply(
          `${discordEmotes.error} Error checking user voice channel!`
        );
      }
    }
  
    async toggleAutoplay(message) {
      try {
        // check user
        const checkUser = await this.checkcUserVoice(message);
        // set loop to autoplay
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying()) {
          return message.reply(
            `${discordEmotes.error} No music is currently playing!`
          );
        }
  
        // check autoplay is enable or not
        if (queue.repeatMode() === QueueRepeatMode.AUTOPLAY) {
          return message.reply(
            `${discordEmotes.error} Autoplay mode is already enabled!`
          );
        }
  
        // Menerapkan mode loop
        queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
        return message.reply("🎵 Autoplay mode enabled.");
      } catch (error) {
        console.error("Error in toggleAutoplay:", error);
        message.reply(`${discordEmotes.error} Error toggling autoplay!`);
      }
    }
  
    async skipMusic(message) {
      try {
        // Get the player instance for the guild
        const player = useMainPlayer(message.guild.id);
  
        if (!player) {
          return message.reply({
            content: `${discordEmotes.error} No active player found in this server!`,
          });
        }
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`,
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`,
          });
        }
        // Get the queue for the current guild
        const queue = player.nodes.get(message.guild.id);
  
        if (!queue || !queue.isPlaying()) {
          return message.reply({
            content: `${discordEmotes.error} No music is currently playing!`,
          });
        }
  
        // Skip the current track
        queue.node.skip();
  
        // Create embed response
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("⏭️ Skipped")
          .setDescription("The current track has been skipped!");
  
        // Send the embed response
        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error("Error in skipMusic:", error);
        message.reply(`${discordEmotes.error} Error skipping music!`);
      }
    }
    async pauseMusic(message) {
      try {
        // Get the player instance for the guild
        const player = useMainPlayer(message.guild.id);
  
        if (!player) {
          return message.reply({
            content: `${discordEmotes.error} No active player found in this server!`,
          });
        }
  
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`,
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`,
          });
        }
  
        // Get the queue for the current guild
        const queue = player.nodes.get(message.guild.id);
  
        if (!queue || !queue.isPlaying()) {
          return message.reply({
            content: `${discordEmotes.error} No music is currently playing!`,
          });
        }
  
        try {
          // Toggle pause state
          const wasPaused = queue.node.isPaused();
  
          if (wasPaused) {
            queue.node.resume();
          } else {
            queue.node.pause();
          }
  
          // Create embed response
          const embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle(wasPaused ? "▶️ Resumed" : "⏸️ Paused")
            .setDescription(
              wasPaused
                ? "Music playback has been resumed"
                : "Music playback has been paused"
            )
            .setTimestamp();
  
          return message.reply({ embeds: [embed] });
        } catch (playbackError) {
          console.error("Error toggling pause state:", playbackError);
          return message.reply({
            content: `${discordEmotes.error} Failed to ${
              wasPaused ? "resume" : "pause"
            } playback: ${playbackError.message}`,
          });
        }
      } catch (error) {
        console.error("Error in pauseMusic command:", error);
        return message.reply({
          content: `${discordEmotes.error} An error occurred while trying to pause/resume the music.`,
        });
      }
    }
  
    // Method untuk leave voice channel
    async leaveVoice(message) {
      const guildId = message.guild.id;
      const connection = useQueue(guildId);
      if (connection) {
        connection.delete();
        message.reply("👋 Left the voice channel");
      } else {
        message.reply("I am not in a voice channel");
      }
    }
  }

  export { VoiceManager };