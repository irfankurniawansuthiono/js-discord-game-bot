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
        if(!VoiceManager.instance) {
            this.voiceConnections = new Map();
            this.audioPlayers = new Map();

            VoiceManager.instance = this;
        }
        return VoiceManager.instance;
    }
    async setVolume(message, volume) {
        try {
          // Validasi volume input
          if (isNaN(volume) || volume < 0 || volume > 100) {
            return message.reply({content:`${discordEmotes.error} Volume must be a number between 0 and 100.`, ephemeral: true});
          }
      
          // Fetch queue
          const queue = useQueue(message.guild.id);
          if (!queue || !queue.node.isPlaying()) {
            return message.reply({content: `${discordEmotes.error} No music is currently playing.`, ephemeral: true});
          }
      
          // Set volume menggunakan queue
          queue.node.setVolume(volume);
          return message.reply({content:`${discordEmotes.success} Volume set to ${volume}%`, ephemeral: true});
        } catch (error) {
          console.error("Error while setting volume:", error);
      
          // Tangani berbagai jenis error
          if (error.code === "ERR_ILLEGAL_HOOK_INVOCATION") {
            return message.reply({content: `${discordEmotes.error} An internal error occurred. Please try again later.`, ephemeral: true});
          }
      
          return message.reply({content: `${discordEmotes.error} Error setting volume!`, ephemeral: true});
        }
      }
    async karaokeMusic(message, title) {
      try {
          // Cek apakah user berada di voice channel
          const userVoiceChannel = message.member.voice.channel;
          if (!userVoiceChannel) {
              return message.reply(`${discordEmotes.error} You need to be in a voice channel first!`);
          }
  
          // Cek apakah bot sudah berada di voice channel
          const botVoiceChannel = message.guild.members.me.voice.channel;
          if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
              return message.reply(`${discordEmotes.error} You need to be in the same voice channel as the bot!`);
          }
  
          // Kirim pesan awal bahwa karaoke sedang dimulai
          const loadingMsg = await message.reply(`🎤 **Starting Karaoke Mode...** 🎶`);
  
          // Ambil instance player dan mainkan musik
          const player = useMainPlayer();
          const { track } = await player.play(userVoiceChannel, title, {
              nodeOptions: {
                  metadata: { channel: message.channel },
                  selfDeaf: true,
                  leaveOnEnd: true,
                  leaveOnEndCooldown: 300000, // 5 menit
              },
              requestedBy: message.author,
          });
  
          // Ambil queue dan pastikan ada track yang sedang diputar
          const queue = useQueue(message.guild.id);
          if (!queue || !queue.currentTrack) {
              return loadingMsg.edit(`${discordEmotes.error} Failed to play music.`);
          }
  
          // Ambil lirik berdasarkan judul lagu
          const results = await player.lyrics.search({ q: title });
          if (!results || results.length === 0) {
              return loadingMsg.edit(`${discordEmotes.error} No lyrics found for this track.`);
          }
  
          // Ambil hasil pertama dan pastikan ada lirik sinkron
          const first = results[0];
          if (!first.syncedLyrics) {
              return loadingMsg.edit(`${discordEmotes.error} Synced lyrics are not available for this track.`);
          }
  
          // Perbarui pesan awal dengan informasi lagu
          await loadingMsg.edit(`🎤 **Karaoke Mode Activated** 🎶\nNow playing: **${track.title}**`);
  
          // Muat lirik sinkron ke dalam queue
          const syncedLyrics = queue.syncedLyrics(first);
  
          // Fungsi untuk mengirimkan lirik secara real-time
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
  
          // Jalankan lirik secara live
          syncedLyrics.onChange((lyrics, timestamp) => {
              onLyricsUpdate(lyrics, timestamp).catch(console.error);
          });
  
          // Langganan event selesai
          const unsubscribe = syncedLyrics.subscribe();
          player.events.on("playerFinish", () => {
              unsubscribe();
          });
  
      } catch (error) {
          console.error("Error in karaokeMusic:", error);
          return message.reply(`${discordEmotes.error} An error occurred while starting karaoke.`);
      }
  }  
    async queueMusic(message) {
      const author = message.user ?? message.author;
      try {
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`, ephemeral:true
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`, ephemeral:true
          });
        }
        const queue = useQueue(message.guild.id);
        if (!queue)
          return message.reply({
            content: `${discordEmotes.error} No music in queue.`, ephemeral:true
          });
        const currentQueue = queue.tracks.toArray();
        if (currentQueue.length === 0)
          return message.reply({
            content: `${discordEmotes.error} No music in queue.`, ephemeral:true
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
            ephemeral:true
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
              ephemeral:true
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
              text: `Requested by ${author.tag}`,
              iconURL: author.displayAvatarURL(),
            });
  
          await message.reply({ embeds: [embed], ephemeral:true });
        }
      } catch (error) {
        console.error("Error in queueMusic:", error);
        return message.reply({
          content: `${discordEmotes.error} An error occurred while displaying the queue.`, ephemeral: true
        });
      }
    }
    async shuffleMusic(message) {
      try {
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`, ephemeral:true
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`, ephemeral:true
          });
        }
        // Get the queue for the current guild
        const queue = useQueue(message.guild.id);
  
        if (!queue || !queue.isPlaying()) {
          return message.reply(
            `${discordEmotes.error} No music is currently playing!`, {ephemeral:true}
          );
        } else if (queue.tracks.length < 2) {
          return message.reply(
            `${discordEmotes.error} The queue must have at least 2 tracks to shuffle!` ,{ephemeral:true}
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
            ephemeral: true,
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`, ephemeral:true
          });
        }
        // Mendapatkan queue untuk server saat ini
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying()) {
          return message.reply(
            {content:`${discordEmotes.error} No music is currently playing!`, ephemeral: true}
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
              {content:`${discordEmotes.error} Invalid option: \`${option}\`. Available options: queue, track, off, autoplay.`, ephemeral: true}
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
  
        return message.reply({content:`${discordEmotes.success} ${modeText[repeatMode]}`, ephemeral: true});
      } catch (error) {
        console.error("Error in loopMusic:", error);
        return message.reply(
          {content: `${discordEmotes.error} An error occurred while setting the loop mode.`, ephemeral: true}
        );
      }
    }
  
    async getSyncedLyrics(message, title) {
      const author = message.user ?? message.author
      try {
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`,  ephemeral:true
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`, ephemeral:true
          });
        }
  
        // Get the player instance for the guild
        const player = useMainPlayer(message.guild.id);
        // Cari lirik berdasarkan judul lagu
        const results = await player.lyrics.search({ q: title });
        if (!results || results.length === 0) {
          return message.reply({
            content: `${discordEmotes.error} No lyrics found for this track.`, ephemeral:true
          });
        }
  
        // Ambil hasil pertama
        const first = results[0];
        if (!first.syncedLyrics) {
          return message.reply({
            content: `${discordEmotes.error} Synced lyrics are not available for this track.`, ephemeral:true
          });
        }
  
        // Ambil queue dan pastikan ada track yang sedang diputar
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.currentTrack) {
          return message.reply({
            content: `${discordEmotes.error} No active music queue or track playing.`, ephemeral:true
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
            queue.currentTrack.thumbnail ?? author.displayAvatarURL()
          )
          .setTimestamp();
  
        await message.reply({ embeds: [embed], ephemeral:true });
      } catch (error) {
        console.error("Error in getSyncedLyrics:", error);
        return message.reply({
          content: `${discordEmotes.error} Failed to get synced lyrics: ${error.message}`, ephemeral:true
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
            content: `${discordEmotes.error} No music is currently playing!`, ephemeral: true
          });
        }
  
        // Get current track
        const currentTrack = queue.currentTrack;
        if (!currentTrack) {
          return message.reply({
            content: `${discordEmotes.error} No track is currently playing!`, ephemeral: true
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
        return message.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error("Error in nowPlaying command:", error);
        return message.reply({
          content: `${discordEmotes.error} An error occurred while getting the current track information.`, ephemeral: true
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
        const author = message.user ?? message.author
        const lyricsData = await player.lyrics.search({ q: title });
        if (!lyricsData || lyricsData.length === 0) {
          return message.reply(`${discordEmotes.error} No lyrics found!`, {ephemeral: true});
        }
        const lyrics = lyricsData[0]?.plainLyrics || "No lyrics available.";
        const trackName = lyricsData[0]?.trackName ?? title;
        const artistName = lyricsData[0]?.artistName ?? "Unknown Artist";
        const artistImage = lyricsData[0]?.artist?.image ?? author.displayAvatarURL();
        const artistUrl = lyricsData[0]?.artist?.url ?? "https://irfanks.site";
        const thumbnail = lyricsData[0]?.thumbnail ?? author.displayAvatarURL();
    
        const chunks = lyrics.match(/.{1,1900}/gs) || [];
        let page = 0;
    
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle(`🎵 ${trackName}`)
          .setThumbnail(thumbnail)
          .setAuthor({ name: artistName, iconURL: artistImage, url: artistUrl })
          .setDescription(chunks[page])
          .setFooter({ text: `Page ${page + 1} of ${chunks.length}` })
          .setTimestamp();
    
        if (chunks.length === 1) {
          return message.reply({ embeds: [embed], ephemeral: true });
        }
    
        const prevButton = new ButtonBuilder()
          .setCustomId("prev_lyrics")
          .setLabel("◀️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true);
    
        const nextButton = new ButtonBuilder()
          .setCustomId("next_lyrics")
          .setLabel("▶️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(chunks.length <= 1);
    
        const row = new ActionRowBuilder().addComponents(prevButton, nextButton);
    
        const reply = await message.reply({ embeds: [embed], components: [row], ephemeral: true });
        
        const collector = reply.createMessageComponentCollector({ time: 60000 });
    
        collector.on("collect", async (interaction) => {
          if (interaction.user.id !== message.author.id) return interaction.reply({ content: "You can't control this pagination!", ephemeral: true });
          
          if (interaction.customId === "prev_lyrics" && page > 0) {
            page--;
          } else if (interaction.customId === "next_lyrics" && page < chunks.length - 1) {
            page++;
          }
    
          embed.setDescription(chunks[page]);
          embed.setFooter({ text: `Page ${page + 1} of ${chunks.length}` });
          
          prevButton.setDisabled(page === 0);
          nextButton.setDisabled(page === chunks.length - 1);
          
          await interaction.update({ embeds: [embed], components: [row], ephemeral: true});
        });
    
        collector.on("end", () => {
          prevButton.setDisabled(true);
          nextButton.setDisabled(true);
          reply.edit({ components: [row] }).catch(() => {});
        });
      } catch (error) {
        console.error("Error in getLyrics:", error);
        message.reply(`${discordEmotes.error} Error getting lyrics! Please try again.`);
      }
    }
    async playMusic(message, query) {
      const author = message.user ?? message.author
        try {
          const guildId = message.guild.id;
          const voiceChannel = message.member.voice.channel;
          // Basic checks
          if (!voiceChannel) {
            return message.reply({content: "You need to be in a voice channel first!", ephemeral:true});
          }
      
          if (
            message.guild.members.me.voice.channel &&
            message.guild.members.me.voice.channel !== voiceChannel
          ) {
            return message.reply(
              {content: "I am already playing in a different voice channel!", ephemeral:true}
            );
          }
      
          // Permission checks
          const permissions = voiceChannel.permissionsFor(message.guild.members.me);
          if (!permissions.has(PermissionsBitField.Flags.Connect)) {
            return message.reply(
              {content: "I do not have permission to join your voice channel!", ephemeral:true }
            );
          }
      
          if (!permissions.has(PermissionsBitField.Flags.Speak)) {
            return message.reply(
              {content: "I do not have permission to speak in your voice channel!", ephemeral:true }
            );
          }
      
          const loadingMsg = await message.reply(
            {content:`${discordEmotes.loading} Loading music...`, ephemeral:true }
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
              requestedBy: author,
            });
      
            // Update loading message with track info
            await loadingMsg.edit({content:`${discordEmotes.success} 🎶 Added to queue: **${track.title}**`, ephemeral:true});
      
            // Store the connection
            this.voiceConnections.set(guildId, player);
          } catch (error) {
            console.error("Error playing track:", error);
            await loadingMsg.edit({content: `${discordEmotes.error} Error: ${error.message}`, ephemeral:true});
            this.cleanupConnection(guildId);
          }
        } catch (error) {
          console.error("Error in playMusic:", error);
          message.reply(
            {content:`${discordEmotes.error} Error: ${
              error.message || "Failed to play music"
            }`, ephemeral:true}
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
            content: `${discordEmotes.error} No active player found in this server!`, ephemeral:true
          });
        }
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`, ephemeral: true
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`,
            ephemeral: true
          });
        }
        // Get the queue for the current guild
        const queue = player.nodes.get(message.guild.id);
  
        if (!queue || !queue.isPlaying()) {
          return message.reply({
            content: `${discordEmotes.error} No music is currently playing!`, ephemeral: true
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
        message.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error("Error in skipMusic:", error);
        message.reply({content:`${discordEmotes.error} Error skipping music!`, ephemeral: true});
      }
    }
    async pauseMusic(message) {
      try {
        // Get the player instance for the guild
        const player = useMainPlayer(message.guild.id);
  
        if (!player) {
          return message.reply({
            content: `${discordEmotes.error} No active player found in this server!`, ephemeral:true
          });
        }
  
        // Check if the user is in a voice channel
        if (!message.member.voice.channel) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in a voice channel first!`, ephemeral: true
          });
        }
  
        // Get the user's voice channel and the bot's voice channel
        const userVoiceChannel = message.member.voice.channel;
        const botVoiceChannel = message.guild.members.me.voice.channel;
  
        // Check if the bot is in a voice channel and if it's the same as the user's
        if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
          return message.reply({
            content: `${discordEmotes.error} You need to be in the same voice channel with the bot!`, ephemeral: true
          });
        }
  
        // Get the queue for the current guild
        const queue = player.nodes.get(message.guild.id);
  
        if (!queue || !queue.isPlaying()) {
          return message.reply({
            content: `${discordEmotes.error} No music is currently playing!`, ephemeral: true
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
  
          return message.reply({ embeds: [embed], ephemeral: true });
        } catch (playbackError) {
          console.error("Error toggling pause state:", playbackError);
          return message.reply({
            content: `${discordEmotes.error} Failed to ${
              wasPaused ? "resume" : "pause"
            } playback: ${playbackError.message}`,
            ephemeral: true,
          });
        }
      } catch (error) {
        console.error("Error in pauseMusic command:", error);
        return message.reply({
          content: `${discordEmotes.error} An error occurred while trying to pause/resume the music.`,
          ephemeral: true,
        });
      }
    }
  
    // Method untuk leave voice channel
    async leaveVoice(message) {
      const guildId = message.guild.id;
      if(!guildId) return message.reply({content: `${discordEmotes.error} You are not in a server!`, ephemeral: true});
      const connection = useQueue(guildId);
      if (connection) {
        connection.delete();
        message.reply("👋 Left the voice channel", {ephemeral:true});
      } else {
        message.reply("I am not in a voice channel", {ephemeral:true});
      }
    }
  }

  export { VoiceManager };