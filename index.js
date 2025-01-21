import axios from "axios";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ActivityType,
  ChannelType,
  PermissionsBitField,
  AttachmentBuilder,
} from "discord.js";
import { Player, QueueRepeatMode, useMainPlayer, useQueue, useTimeline } from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";
import { DefaultExtractors } from "@discord-player/extractor";
import FormData from "form-data";
import { joinVoiceChannel } from "@discordjs/voice";
import fs from "fs";
import similarity from "similarity";

const formatClockHHMMSS = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours
    .toString()
    .padStart(2, "0")}:${minutes.toString()}:${seconds
    .toString()
    .padStart(2, "0")}`;
};
const cooldowns = new Map();
const COOLDOWN_DURATION = 5 * 1000; // 5 seconds
const formatBalance = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
// Configuration
const config = {
  token: process.env.TOKEN,
  ownerId: [
    "411125001853468672",
    "500585213546463232",
    "1107212927536201738",
    "534661318385336321",
  ],
  guildBaseServerID: "1329992328550682774",
  announcementChannelID: "1329992333994758247",
  bugReportChannelID: "1331221345010188350",
  defaultPrefix: "!",
  startingBalance: 10000,
  dataFile: "./players.json",
};

// Initialize bot with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let prefix = config.defaultPrefix;

// help embed
const createHelpEmbed = (page = 1, user) => {
  // Tambahkan parameter user
  const embedColors = {
    1: "#FF69B4", // Pink untuk Basic & Tools
    2: "#9B59B6", // Purple untuk Music & Moderation
    3: "#F1C40F", // Gold untuk Games & Social
    4: "#E74C3C", // Red untuk Owner Commands
  };

  const pages = {
    1: {
      title: "📚 Basic Commands & Tools",
      fields: [
        {
          name: "🎯 Basic Commands",
          value: [
            "`🔹 register` - Create new account",
            "`🔹 help` - Show this message",
            "`🔹 profile` - View your profile/balance",
            "`🔹 ownerinfo` - Show bot owner information",
            "`🔹 botinfo` - Show bot information",
            "`🔹 ping` - Check bot latency",
            "`🔹 sc` - Bot Source Code",
            "`🐛 bugreport` - Report a BUG!",
          ].join("\n"),
          inline: false,
        },
        {
          name: "🛠️ Tools",
          value: [
            "`🎥 ttfind <prompt>` - Search TikTok videos",
            "`📱 ttinfo <url>` - TikTok video information",
            "`⬇️ ttdown <url>` - Download TikTok video",
            "`📺 ytdown <url>` - Download YouTube videos",
            "`📸 iginfo <url>` - Instagram info",
            "`📥 igdown <url>` - Download Instagram content",
            "`🎵 spdown <url>` - Download Spotify song",
            "`🖼️ remini` - Generate HD image",
          ].join("\n"),
          inline: false,
        },
      ],
    },
    2: {
      title: "🎵 Music & Moderation",
      fields: [
        {
          name: "🎼 Music Commands",
          value: [
            "`🎵 play/p <song>` - Play a song",
            "`🎤 karaoke <song title>` - playing song and show synced lyrics",
            "`➡️ join` - Join voice channel",
            "`⬅️ leave` - Leave voice channel",
            "`📝 lyrics <song title>` - Show song lyrics",
            "`📝 syncedlyrics/sl <song title>` - Show synced lyrics",
            "`🔍 s <song>` - Search for a song",
            "`⏩ skip` - Skip song",
            "`⏯️ pause` - Pause music",
            "`🔁 loop <queue|track|off|autplay>` - looping the music",
            "`🎶 q` - Show current queue",
            "`▶️ resume` - Resume music",
            "`🔀 sf` - Shuffle current queue",
            "`🎶 np` - Now playing",
          ].join("\n"),
          inline: false,
        },
        {
          name: "⚔️ Moderation",
          value: [
            "`🗑️ rbc` - Delete bot messages",
            "`📝 nick <@user>` - Set user nickname",
          ].join("\n"),
          inline: false,
        },
      ],
    },
    3: {
      title: "🎮 Games & Social",
      fields: [
        {
          name: "🎲 Games",
          value: [
            "`🪙 flip <bet> <h/t>` - Coin flip (2x)",
            "`🔢 guess <bet> <1-10>` - Number guess (5x)",
            "`♠️ bj <bet>` - Blackjack (5x)",
            "`🎲 dice <bet> <2-12>` - Dice game (8x)",
            "`📅 daily` - Daily reward",
            "`🎰 slots <bet>` - Slots (10x)",
            "`🖼️ tg` - Tebak gambar",
            "`🎮 clt` - Cak lontong",
          ].join("\n"),
          inline: false,
        },
        {
          name: "👥 Social",
          value: [
            "`💝 give <@user> <amount>` - Give money",
            "`📊 rank` - Show top players",
            "`📨 invite` - Invite Nanami",
            "`👤 profile [@user]` - Show profile",
            "`🦹 rob <@user>` - Rob a user",
          ].join("\n"),
          inline: false,
        },
      ],
    },
    4: {
      title: "⚡ Owner Commands",
      fields: [
        {
          name: "🛠️ Owner Commands",
          value: [
            "`👤 registeruser <@user>` - Register a user",
            "`💰 setbalance <@user>` - Set balance",
            "`📢 ga <message>` - Guild announcement",
            "`💸 giveowner <amount>` - Give to owner",
            "`⚙️ setprefix <prefix>` - Set bot prefix",
            "`🔄 setstatus <status>` - Set status",
            "`👤 resetap` - reset all players",
            "`😎 spamsendto <@user> <amount>` - Spam DM Message to a user",
            "`😎 spamsay <amount>` - Spam Message to current",
            "`🗣️ say <message>` - Spam DM Message to a user",
            "`👤 resetplayer <@user>` - reset a players",
          ].join("\n"),
          inline: false,
        },
        {
          name: "🔒 Bot Owner Commands",
          value: [
            "`📣 announcement <msg>` - Global announcement",
            "`✅ tg jawab` - Answer tebak gambar",
            "`✅ clt jawab` - Answer tebak gambar",
          ].join("\n"),
          inline: false,
        },
      ],
    },
  };

  const embed = new EmbedBuilder()
    .setColor(embedColors[page])
    .setTitle(`Nanami Help Menu - ${pages[page].title}`)
    .setDescription(
      `**Page ${page}/4**\nGunakan tombol di bawah untuk navigasi\n\nPrefix: \`${prefix}\``
    )
    .addFields(pages[page].fields)
    .setFooter({
      text: `Requested by ${user.tag} • Page ${page}/4`,
      iconURL: user.displayAvatarURL(),
    })
    .setTimestamp();

  return embed;
};

// class discord
class DiscordFormat {
  constructor() {
    this.color = "#FFF000";
    this.title = "Nanami";
  }
  async setNickname(message, mentionedUser, newNick) {
    try {
      // Ambil GuildMember dari user yang disebut
      const member = message.guild.members.cache.get(mentionedUser.id);

      if (!member) {
        return message.channel.send("User tidak ditemukan dalam server ini.");
      }

      // Ubah nickname
      await member.setNickname(newNick);
      message.channel.send(
        `Nickname untuk ${mentionedUser} berhasil diubah menjadi ${newNick}!`
      );
    } catch (error) {
      console.error("Error saat mengubah nickname:", error);
      message.channel.send("Terjadi kesalahan saat mencoba mengubah nickname.");
    }
  }

  async bugReport(message, bug) {
    const replyMessage = await message.reply(`<a:loading:1088606970756005120> Sending bug report.. (Thx for reporting!)\n\nYou can also participate in the development of this bot by contributing to the source code (${prefix}sc)`);
    try {
      const channel = message.guild.channels.cache.get(config.bugReportChannelID);
      if (!channel) {
        return replyMessage.edit("Bug Report channel not found.");
      }
      const getOwnerBot = message.guild.members.cache.get(config.ownerId[0]);
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🐛 Bug Report")
        .setDescription(bug)
        .setFooter({
          text: `Reported by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();
      channel.send({ embeds: [embed], content: `${getOwnerBot}` });
      replyMessage.edit("🐛 Bug report has been sent!");
    } catch (error) {
      console.error("Error saat mengirim bug report:", error);
      message.channel.send("❌ There was an error while sending bug report.");
    }
  }
}
class VoiceManager {
  constructor() {
    this.voiceConnections = new Map();
    this.audioPlayers = new Map();
  }
  async queueMusic(message) {
    try {
// Check if the user is in a voice channel
if (!message.member.voice.channel) {
  return message.reply({
    content: "❌ You need to be in a voice channel first!"
  });
}

// Get the user's voice channel and the bot's voice channel
const userVoiceChannel = message.member.voice.channel;
const botVoiceChannel = message.guild.members.me.voice.channel;

// Check if the bot is in a voice channel and if it's the same as the user's
if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
  return message.reply({
    content: "❌ You need to be in the same voice channel with the bot!"
  });
}
      const queue = useQueue(message.guild.id);
      if(!queue) return message.reply({content: '❌ No music in queue.'});
      const currentQueue = queue.tracks.toArray();
      if(currentQueue.length === 0) return message.reply({content: '❌ No music in queue.'});
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
            .join('\n');
        };

        // Buat embed awal
        const embed = new EmbedBuilder()
          .setColor("#FFF000")
          .setTitle('🎵 Music Queue')
          .setDescription(getPageSongs(currentPage))
          .setFooter({
            text: `Page ${currentPage}/${totalPages} • Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL()
          });

        // Buat row button
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('prev')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 1),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === totalPages),
            new ButtonBuilder()
              .setCustomId('close')
              .setLabel('Close')
              .setStyle(ButtonStyle.Danger)
          );

        // Kirim pesan awal
        const queueMsg = await message.reply({ 
          embeds: [embed],
          components: [row]
        });

        // Buat collector
        const collector = queueMsg.createMessageComponentCollector({ 
          time: 60000,
          filter: i => i.user.id === message.author.id
        });

        collector.on('collect', async (interaction) => {
          // Handle button clicks
          if (interaction.customId === 'prev') {
            if (currentPage > 1) currentPage--;
          } else if (interaction.customId === 'next') {
            if (currentPage < totalPages) currentPage++;
          } else if (interaction.customId === 'close') {
            await queueMsg.delete().catch(() => {});
            return collector.stop();
          }

          // Update embed
          embed.setDescription(getPageSongs(currentPage));
          embed.setFooter({
            text: `Page ${currentPage}/${totalPages} • Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL()
          });

          // Update button states
          row.components[0].setDisabled(currentPage === 1);
          row.components[1].setDisabled(currentPage === totalPages);

          // Update message
          await interaction.update({ 
            embeds: [embed],
            components: [row]
          });
        });

        collector.on('end', () => {
          if (!queueMsg.deleted) {
            row.components.forEach(button => button.setDisabled(true));
            queueMsg.edit({ components: [row] }).catch(() => {});
          }
        });

      } else {
        // Jika lagu 10 atau kurang
        const embed = new EmbedBuilder()
          .setColor("#FFF000")
          .setTitle('🎵 Music Queue')
          .setDescription(
            currentQueue
              .map((track, index) => `${index + 1}. ${track.title}`)
              .join('\n')
          )
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL()
          });

        await message.reply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in queueMusic:', error);
      return message.reply({
        content: '❌ An error occurred while displaying the queue.'
      });
    }
}
async shuffleMusic(message) {
  try {
// Check if the user is in a voice channel
if (!message.member.voice.channel) {
  return message.reply({
    content: "❌ You need to be in a voice channel first!"
  });
}

// Get the user's voice channel and the bot's voice channel
const userVoiceChannel = message.member.voice.channel;
const botVoiceChannel = message.guild.members.me.voice.channel;

// Check if the bot is in a voice channel and if it's the same as the user's
if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
  return message.reply({
    content: "❌ You need to be in the same voice channel with the bot!"
  });
}
    // Get the queue for the current guild
    const queue = useQueue(message.guild.id);

    if (!queue || !queue.isPlaying()) { 
      return message.reply("❌ No music is currently playing!");
    } else if (queue.tracks.length < 2) {
      return message.reply("❌ The queue must have at least 2 tracks to shuffle!");
    }

    // Shuffle the queue
    queue.toggleShuffle();

    // Send a success message
    return message.reply("✅ The queue has been shuffled!");
  } catch (error) {
    console.error("Error in shuffleMusic:", error);
    return message.reply({  content: '❌ An error occurred while shuffling the queue.' });
  }
}
async loopMusic(message, option) {
  try {
  // Check if the user is in a voice channel
if (!message.member.voice.channel) {
  return message.reply({
    content: "❌ You need to be in a voice channel first!"
  });
}

// Get the user's voice channel and the bot's voice channel
const userVoiceChannel = message.member.voice.channel;
const botVoiceChannel = message.guild.members.me.voice.channel;

// Check if the bot is in a voice channel and if it's the same as the user's
if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
  return message.reply({
    content: "❌ You need to be in the same voice channel with the bot!"
  });
}
    // Mendapatkan queue untuk server saat ini
    const queue = useQueue(message.guild.id);
    if (!queue || !queue.isPlaying()) {
      return message.reply("❌ No music is currently playing!");
    }

    // Tentukan mode loop berdasarkan opsi yang diberikan
    let repeatMode;
    switch (option) {
      case 'queue':
        repeatMode = QueueRepeatMode.QUEUE;
        break;
      case 'track':
        repeatMode = QueueRepeatMode.TRACK;
        break;
      case 'off':
        repeatMode = QueueRepeatMode.OFF;
        break;
      case 'autoplay':
        repeatMode = QueueRepeatMode.AUTOPLAY;
        break;
      default:
        return message.reply(`❌ Invalid option: \`${option}\`. Available options: queue, track, off, autoplay.`);
    }

    // Menerapkan mode loop
    queue.setRepeatMode(repeatMode);

    // Membalas dengan konfirmasi mode loop
    const modeText = {
      [QueueRepeatMode.QUEUE]: "🔄 Looping the entire queue.",
      [QueueRepeatMode.TRACK]: "🔂 Looping the current track.",
      [QueueRepeatMode.OFF]: "❌ Looping is now disabled.",
      [QueueRepeatMode.AUTOPLAY]: "🎵 Autoplay mode enabled.",
    };

    return message.reply(modeText[repeatMode]);
  } catch (error) {
    console.error("Error in loopMusic:", error);
    return message.reply("❌ An error occurred while setting the loop mode.");
  }
}


  async getSyncedLyrics(message, title) {
    try {
// Check if the user is in a voice channel
if (!message.member.voice.channel) {
  return message.reply({
    content: "❌ You need to be in a voice channel first!"
  });
}

// Get the user's voice channel and the bot's voice channel
const userVoiceChannel = message.member.voice.channel;
const botVoiceChannel = message.guild.members.me.voice.channel;

// Check if the bot is in a voice channel and if it's the same as the user's
if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
  return message.reply({
    content: "❌ You need to be in the same voice channel with the bot!"
  });
}
      // Cari lirik berdasarkan judul lagu
      const results = await player.lyrics.search({ q: title });
      if (!results || results.length === 0) {
        return message.reply({
          content: "❌ No lyrics found for this track.",
           
        });
      }
  
      // Ambil hasil pertama
      const first = results[0];
      if (!first.syncedLyrics) {
        return message.reply({
          content: "❌ Synced lyrics are not available for this track."
        });
      }
  
      // Ambil queue dan pastikan ada track yang sedang diputar
      const queue = useQueue(message.guild.id);
      if (!queue || !queue.currentTrack) {
        return message.reply({
          content: "❌ No active music queue or track playing.",
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
        .setDescription(`Now showing synced lyrics for: **${queue.currentTrack.title ?? title}**`)
        .setThumbnail(queue.currentTrack.thumbnail ?? message.author.displayAvatarURL())
        .setTimestamp();
  
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in getSyncedLyrics:", error);
      return message.reply({
        content: `❌ Failed to get synced lyrics: ${error.message}`
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
          content: "❌ No music is currently playing!",
           
        });
      }
  
      // Get current track
      const currentTrack = queue.currentTrack;
      if (!currentTrack) {
        return message.reply({
          content: "❌ No track is currently playing!",
           
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
              track.requestedBy?.displayName || track.requestedBy?.username || "Unknown";
            return `${index + 1}. **${track.title}** - Requested by: ${requestedBy}`;
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
            value:
              currentTrack.requestedBy?.displayName ?
              currentTrack.requestedBy?.username :
              "Unknown",
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
        content:
          "❌ An error occurred while getting the current track information.",
         
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
        return message.reply("❌ No results found!");
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
      message.reply("❌ Error searching music! Please try again.");
    }
  }

  async getLyrics(message, title) {
    try {
      const player = useMainPlayer();
      const lyrics = await player.lyrics.search({ q: title });

      if (!lyrics || lyrics.length <= 0) {
        return message.reply("❌ No lyrics found!");
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
      message.reply("❌ Error getting lyrics! Please try again.");
    }
  }
  async playMusic(message, query) {
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

      const loadingMsg = await message.reply(
        "<a:loading:1330226649169399882> Loading music..."
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
        await loadingMsg.edit(`❌ Error: ${error.message}`);
        this.cleanupConnection(guildId);
      }
    } catch (error) {
      console.error("Error in playMusic:", error);
      message.reply(`❌ Error: ${error.message || "Failed to play music"}`);
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

  async joinVoice(message) {
    const guildId = message.guild.id;
    const voiceChannel = message.member.voice.channel;

    if (voiceChannel) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
      this.voiceConnections.set(guildId, connection);
      message.reply("👋 Joined voice channel");
    } else {
      message.reply("You need to be in a voice channel first!");
    }
  }

  async skipMusic(message) {
    try {

      // Get the player instance for the guild
      const player = useMainPlayer(message.guild.id);

      if (!player) {
        return message.reply({
          content: "❌ No active player found in this server!",
        });
      }
// Check if the user is in a voice channel
if (!message.member.voice.channel) {
  return message.reply({
    content: "❌ You need to be in a voice channel first!"
  });
}

// Get the user's voice channel and the bot's voice channel
const userVoiceChannel = message.member.voice.channel;
const botVoiceChannel = message.guild.members.me.voice.channel;

// Check if the bot is in a voice channel and if it's the same as the user's
if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
  return message.reply({
    content: "❌ You need to be in the same voice channel with the bot!"
  });
}
      // Get the queue for the current guild
      const queue = player.nodes.get(message.guild.id);

      if (!queue || !queue.isPlaying()) {
        return message.reply({
          content: "❌ No music is currently playing!",
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
      message.reply("❌ Error skipping music!");
    }
  }
  async pauseMusic(message) {
    try {
      
      // Get the player instance for the guild
      const player = useMainPlayer(message.guild.id);

      if (!player) {
        return message.reply({
          content: "❌ No active player found in this server!",
           
        });
      }

// Check if the user is in a voice channel
if (!message.member.voice.channel) {
  return message.reply({
    content: "❌ You need to be in a voice channel first!"
  });
}

// Get the user's voice channel and the bot's voice channel
const userVoiceChannel = message.member.voice.channel;
const botVoiceChannel = message.guild.members.me.voice.channel;

// Check if the bot is in a voice channel and if it's the same as the user's
if (botVoiceChannel && userVoiceChannel.id !== botVoiceChannel.id) {
  return message.reply({
    content: "❌ You need to be in the same voice channel with the bot!"
  });
}

      // Get the queue for the current guild
      const queue = player.nodes.get(message.guild.id);

      if (!queue || !queue.isPlaying()) {
        return message.reply({
          content: "❌ No music is currently playing!",
           
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
          content: `❌ Failed to ${wasPaused ? "resume" : "pause"} playback: ${
            playbackError.message
          }`,
           
        });
      }
    } catch (error) {
      console.error("Error in pauseMusic command:", error);
      return message.reply({
        content: "❌ An error occurred while trying to pause/resume the music.",
         
      });
    }
  }

  // Method untuk leave voice channel
  async leaveVoice(message) {
    const guildId = message.guild.id;
    const connection = useQueue(guildId);
    if (connection) {
      connection.delete()
      message.reply("👋 Left the voice channel");
    } else {
      message.reply("I am not in a voice channel");
    }
  }
}

class ApiManagement {
  constructor() {
    this.apiKey = process.env.API_AI_KEY;
  }
  async aiResponse(message, prompt) {
    const character =
      "Anda adalah Nanami, AI cerdas yang dirancang untuk membantu pengguna secara efektif Karakter ini adalah sosok virtual yang hangat, ramah, dan penuh semangat dalam membantu, menggunakan bahasa yang akrab namun tetap sopan sehingga menciptakan suasana percakapan yang santai dan menyenangkan. Gaya komunikasinya fleksibel, menyesuaikan kebutuhan pengguna dengan pendekatan yang selalu positif, penuh perhatian, dan sesekali menyelipkan humor ringan untuk mencairkan suasana. Tidak hanya fokus pada memberikan solusi, karakter ini juga memastikan interaksinya tidak terasa kaku atau terlalu formal, sehingga lebih terasa seperti berbicara dengan teman baik yang selalu siap membantu. Dengan sikap tulus dalam memahami masalah atau permintaan pengguna, karakter ini secara alami membangun kepercayaan dan kenyamanan tanpa terkesan menggurui atau terlalu teknis, membuatnya selalu menjadi pilihan andalan dalam situasi apa pun. Ingat,pengembang  anda adalah irfan kurniawan suthiono dan ini personal websitenya https://irfanks.site";
    try {
      const sessionId = message.author.id;
      const response = await axios.post(
        "https://api.itzky.us.kg/ai/logic",
        {
          prompt,
          sessionId,
          character,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseEmbed = new EmbedBuilder()
        // warna kuning
        .setColor("#FFFF00")
        .setTitle("AI Response")
        .setDescription(response.data.result.answer)
        .setFooter({ text: `AI Endpoint by ${response.data.creator}` })
        .setTimestamp();

      await message.reply({ embeds: [responseEmbed] });
    } catch (error) {
      console.error("Error in aiResponse command:", error);
      return message.reply(
        "There was an error processing your request, please try again later."
      );
    }
  }
  async remini(message, image) {
    try {
      // Mengirim pesan loading
      const reminiMessage = await message.reply(
        "<a:loading:1330226649169399882> Processing Image..."
      );

      try {
        // Get original image
        const imageResponse = await axios.get(image, {
          responseType: "arraybuffer"
        });

        const form = new FormData();
        form.append("file", Buffer.from(imageResponse.data), {
          filename: "image.png",
          contentType: "image/png"
        });

        await reminiMessage.edit("<a:loading:1330226649169399882> Uploading Image...");
        const uploadResponse = await axios.post(
          "https://cdn.itzky.us.kg/",
          form,
          {
            headers: {
              ...form.getHeaders()
            }
          }
        );

        if (!uploadResponse.data?.fileUrl) {
          return await reminiMessage.edit(
            "❌ Failed to upload image to CDN. Please try again."
          );
        }

        // Process with Remini API
        await reminiMessage.edit("<a:loading:1330226649169399882> Generating HD Image...");
        const encodedUrl = encodeURIComponent(uploadResponse.data.fileUrl);
        const response = await axios.get(
          `https://api.itzky.us.kg/tools/remini?url=${encodedUrl}&apikey=${this.apiKey}`
        );

        if (!response.data || !response.data.result) {
          return await reminiMessage.edit(
            "❌ Invalid response from Remini API. Please try again."
          );
        }else if (!response.data.result.status){
          return await reminiMessage.edit(
            "❌ Failed to process image, because the server is unable to process a request because it's too large" //413 code 
          );
        }
        // Get enhanced image
        await reminiMessage.edit("<a:loading:1330226649169399882> Building Image...");
        const enhancedImageResponse = await axios.get(response.data.result, {
          responseType: "arraybuffer"
        });

        // Create Discord attachment using the buffer directly
        const attachment = new AttachmentBuilder(Buffer.from(enhancedImageResponse.data), {
          name: "remini.png"
        });

        // Create embed
        const reminiEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("📸 Enhanced Image")
          .setFooter({
            text: "API Endpoint by Muhammad Zaki - https://api.itzky.us.kg"
          })
          .setTimestamp();

        const downloadPhotoButton = new ButtonBuilder()
          .setURL(response.data.result)
          .setLabel("Download")
          .setStyle(ButtonStyle.Link);
        const rowBuilder = new ActionRowBuilder().addComponents(downloadPhotoButton);

        // Send final response
        await reminiMessage.edit({
          embeds: [reminiEmbed],
          files: [attachment],
          components: [rowBuilder],
          content: "✨ Here's your HD Image!"
        });

      } catch (error) {
        console.error("Error in image processing:", error);
        await reminiMessage.edit(
          "❌ Error processing image. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error in remini command:", error);
      await message.channel.send(
        "❌ There was an error processing your request. Please try again later."
      );
    }
  }
  async spotifyDownload(message, url) {
    try {
      // Mengirim pesan loading
      const spotifyMessage = await message.reply(
        "<a:loading:1330226649169399882> Downloading..."
      );

      // Mengambil data musik dari API
      const response = await axios.get(
        `https://api.itzky.us.kg/download/spotify?url=${url}&apikey=${this.apiKey}`
      );
      const data = response.data;

      // Validasi response data
      if (!data || !data.result) {
        return spotifyMessage.edit(
          "There was an error processing your request, please try again later."
        );
      }

      const musicInfo = data.result;
      const musicUrl = musicInfo.downloadLink;
      const musicTitle = musicInfo.title;
      const musicThumbnail = musicInfo.cover;
      const musicArtist = musicInfo.artist;

      // Mendownload musik sebagai buffer
      const musicResponse = await axios.get(musicUrl, {
        responseType: "arraybuffer",
      });
      const musicBuffer = Buffer.from(musicResponse.data); // Menggunakan buffer langsung

      // Membuat lampiran musik
      const musicAttachment = new AttachmentBuilder(musicBuffer, {
        name: `${musicTitle}.mp3`,
      });

      // Membuat embed untuk informasi musik
      const successEmbed = new EmbedBuilder()
        .setColor("#FFFF00")
        .setTitle("Spotify Download")
        .setURL(musicUrl)
        .setThumbnail(musicThumbnail)
        .setDescription(
          `**Music Title:** ${musicTitle}\n**Music Artist:** ${musicArtist}`
        )
        .setFooter({
          text: "Downloaded via https://api.itzky.us.kg",
          iconURL: `${musicThumbnail}`,
        })
        .setTimestamp();

      // Mengirim pesan dengan lampiran musik dan embed
      await spotifyMessage.edit({
        content: "Here's your downloaded music:",
        files: [musicAttachment],
        embeds: [successEmbed],
      });
    } catch (error) {
      console.error("Error in Spotify Download command:", error);
      return message.reply(
        "There was an error processing your request, please try again later."
      );
    }
  }
  async instagramDownload(message, url) {
    if (!url || !url.startsWith("https://www.instagram.com/")) {
      return message.reply("Please provide a valid Instagram URL.");
    }

    try {
      const igMessage = await message.reply(
        "<a:loading:1330226649169399882> Processing..."
      );

      const response = await axios.get(
        `https://api.itzky.us.kg/download/instagram?url=${url}&apikey=${this.apiKey}`,
        { timeout: 10000 }
      );
      const data = response.data;

      if (!data || !data.result) {
        return igMessage.edit(
          "❌ Failed to fetch Instagram content. Please try again later."
        );
      }

      await igMessage.edit("<a:loading:1330226649169399882> Downloading...");
      const videoInfo = data.result;
      const mediaUrl = videoInfo.medias && videoInfo.medias[0].url;
      const videoTitle = videoInfo.title;
      const videoThumbnail = videoInfo.thumbnail;
      const isVideo = videoInfo.medias.some(media => media.type === "video");

      if (!mediaUrl) {
        return igMessage.edit("❌ No media URL found in the response.");
      }

      // Check file size before downloading
      const headResponse = await axios.head(mediaUrl);
      const fileSize = parseInt(headResponse.headers['content-length']);
      const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

      // Create the base embed
      const igEmbed = new EmbedBuilder()
        .setColor("#FFFF00")
        .setTitle("Instagram Download")
        .setDescription(videoTitle)
        .setThumbnail(videoThumbnail)
        .setFooter({
          text: "Downloaded via https://api.itzky.us.kg",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      // If file is too large or URL is too long, handle differently
      if (fileSize > MAX_FILE_SIZE || mediaUrl.length > 512) {
        igEmbed.setDescription(`${videoTitle}\n\n${fileSize > MAX_FILE_SIZE ? 
          `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds Discord's limit.\n` : 
          ''}The download link will be sent in a follow-up message.`);

        await igMessage.edit({
          content: "✨ Here's your Instagram content!",
          embeds: [igEmbed]
        });

        // Send the URL in a separate message that can be easily copied
        return message.channel.send(`Download Link:\n${mediaUrl}`);
      }

      await igMessage.edit("<a:loading:1330226649169399882> Building...");
      
      const fileResponse = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        maxContentLength: MAX_FILE_SIZE,
        validateStatus: (status) => status === 200
      });

      const fileBuffer = Buffer.from(fileResponse.data);
      const fileAttachment = new AttachmentBuilder(fileBuffer, {
        name: isVideo ? "instagram_video.mp4" : "instagram_image.jpg",
      });

      // Create download button only if URL is within Discord's limit
      const components = mediaUrl.length <= 512 ? [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Download Original')
            .setURL(mediaUrl)
            .setStyle(ButtonStyle.Link)
        )
      ] : [];

      // Send the final message
      await igMessage.edit({
        content: "✨ Here's your Instagram content!",
        embeds: [igEmbed],
        files: [fileAttachment],
        components: components
      });

    } catch (error) {
      console.error("Error in Instagram Download command:", error);
      
      if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        return message.reply(
          "❌ The download timed out. The file might be too large or the server is busy. Please try again later."
        );
      }
      
      if (error.response?.status === 413) {
        return message.reply(
          "❌ The file is too large to process. Please try a different post."
        );
      }
      
      return message.reply(
        "❌ There was an error processing your Instagram content. Please try again later."
      );
    }
  }
  async instagramInfo(message, url) {
    // Validasi URL Instagram
    if (!url || !url.startsWith("https://www.instagram.com/")) {
      return message.reply("Please provide a valid Instagram URL.");
    }

    try {
      // Mengirim pesan loading
      const igMessage = await message.reply(
        "<a:loading:1330226649169399882> Fetching..."
      );

      // Mengambil data video dari API
      const response = await axios.get(
        `https://api.itzky.us.kg/download/instagram?url=${url}&apikey=${this.apiKey}`
      );
      const data = response.data;

      // Validasi response data
      if (!data || !data.result) {
        return igMessage.edit(
          "There was an error processing your request, please try again later."
        );
      }

      igMessage.edit("<a:loading:1330226649169399882> Processing...");
      const videoInfo = data.result;
      const videoUrl = videoInfo.medias && videoInfo.medias[0].url; // URL video pertama
      const videoTitle = videoInfo.title;
      const videoThumbnail = videoInfo.thumbnail;
      const videoDuration = videoInfo.duration;
      const videoType = videoInfo.medias.find(
        (media) => media.type === "video"
      );

      // Membuat Embed untuk menampilkan informasi video Instagram
      const igEmbed = new EmbedBuilder()
        .setColor("#FFFF00")
        .setTitle("Instagram Information")
        .setDescription(
          `**Title**: ${videoTitle}\n\n${
            videoType ? `**Type**: Video\n` : `**Type**: Image\n`
          }\n\n${videoType ? `**Duration**: ${videoDuration} seconds}` : ""}
            `
        )
        .setThumbnail(videoThumbnail)
        .setFooter({ text: "Nanami" })
        .setTimestamp();

      // Mengirim embed ke pengguna dengan URL video
      if (videoUrl) {
        // Menambahkan tombol download jika URL video ada
        const videoDownloadButton = new ButtonBuilder()
          .setLabel("🎥 Download Video")
          .setStyle(ButtonStyle.Link)
          .setURL(videoUrl); // URL video yang dapat diunduh

        const row = new ActionRowBuilder().addComponents(videoDownloadButton);

        // Edit pesan dengan embed dan tombol
        await igMessage.edit({
          embeds: [igEmbed],
          components: [row],
          content: "Here's the result!",
        });
      } else {
        // Jika tidak ada URL video, beri tahu pengguna
        return igMessage.edit("No video found for the given Instagram URL.");
      }
    } catch (error) {
      console.error("Error in instagram Download command:", error);
      return message.reply(
        "There was an error processing your Instagram file request, please try again later."
      );
    }
  }

  async youtubeDownload(message, url) {
    // Cek URL
    if (!url) {
      return message.reply("Please provide a valid YouTube URL.");
    }
    if (
      !url.startsWith("https://www.youtube.com/") &&
      !url.startsWith("https://youtu.be/") &&
      !url.startsWith("https://m.youtube.com/") &&
      !url.startsWith("https://music.youtube.com/")
    ) {
      return message.reply("Please provide a valid YouTube URL.");
    }

    try {
      // Mengirim pesan loading
      const ytMessage = await message.reply(
        "<a:loading:1330226649169399882> Downloading..."
      );

      // Mengambil data video dari API
      const response = await axios.get(
        `https://api.itzky.us.kg/download/youtube?url=${url}&apikey=${this.apiKey}`
      );
      const data = response.data;

      if (!data || !data.result) {
        return ytMessage.edit(
          "Failed to fetch video data. Please try again later."
        );
      }

      const videoInfo = data.result;
      const videoTitle = videoInfo.title;
      const videoThumbnail = videoInfo.image;
      const videoUrl = videoInfo.url;

      // Membuat tombol untuk mengunduh MP3 dan MP4
      const mp3DownloadButton = new ButtonBuilder()
        .setLabel("🎵 Download MP3")
        .setStyle(ButtonStyle.Link)
        .setURL(videoUrl.mp3); // URL untuk file mp3

      const mp4DownloadButton = new ButtonBuilder()
        .setLabel("🎥 Download MP4")
        .setStyle(ButtonStyle.Link)
        .setURL(videoUrl.mp4); // URL untuk file mp4

      // Menambahkan tombol ke dalam action row
      const row = new ActionRowBuilder().addComponents(
        mp3DownloadButton,
        mp4DownloadButton
      );

      // Membuat embed dengan informasi video
      const ytEmbed = new EmbedBuilder()
        .setColor("#FFFF00")
        .setTitle(videoTitle)
        .setURL(url) // Link ke video YouTube
        .setThumbnail(videoThumbnail)
        .setFooter({
          text: "Downloaded via api.itzky.us.kg",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Mengedit pesan dengan embed dan tombol download
      await ytMessage.edit({
        content: "Here's the download link:",
        embeds: [ytEmbed],
        components: [row],
      });
    } catch (error) {
      console.error("Error in youtubeDownload command:", error);
      return message.reply(
        "There was an error processing yt download, please try again later."
      );
    }
  }
  async tiktokInfo(message, url) {
    try {
      // Validasi URL TikTok
      if (
        !url.startsWith("https://vm.tiktok.com/") &&
        !url.startsWith("https://vt.tiktok.com/") &&
        !url.startsWith("https://www.tiktok.com/")
      ) {
        return message.reply("Please provide a valid TikTok URL.");
      }

      // Mengirimkan pesan loading
      const tiktokMessage = await message.reply(
        "<a:loading:1330226649169399882> Fetching..."
      );

      // Mengambil data video dari API
      const response = await axios.get(
        `https://api.itzky.us.kg/download/tiktok?url=${url}&apikey=${this.apiKey}`
      );
      const data = response.data;

      // Validasi response data
      if (
        !data ||
        !data.result ||
        !data.result.author
      ) {
        return tiktokMessage.edit(
          "Failed to fetch video data. Please try again later."
        );
      }

      const videoInfo = data.result;
      const author = videoInfo.author;
      const stats = videoInfo.stats;
      const music = videoInfo.music_info;

      // Membuat embed untuk informasi video
      const embed = new EmbedBuilder()
        .setColor("#FFF000")
        .setTitle("TikTok Video Information")
        .setURL(url)
        .setDescription(`🎥 **${videoInfo.title}**`)
        .setThumbnail(videoInfo.cover)
        .addFields(
          {
            name: "Author",
            value: `[${author.nickname}](https://www.tiktok.com/@${author.fullname})`,
            inline: true,
          },
          { name: "Views", value: stats.views || "0", inline: true },
          { name: "Likes", value: stats.likes || "0", inline: true },
          { name: "Comments", value: stats.comment || "0", inline: true },
          { name: "Shares", value: stats.share || "0", inline: true },
          {
            name: "Duration",
            value: videoInfo.duration || "Unknown",
            inline: true,
          },
          { name: "Region", value: videoInfo.region || "Unknown", inline: true }
        )
        .addFields(
          { name: "🎵 Music", value: music.title || "Unknown", inline: true },
          { name: "Author", value: music.author || "Unknown", inline: true },
          { name: "Album", value: music.album || "Unknown", inline: true },
          {
            name: "Music URL",
            value: `[Click here](${music.url})`,
            inline: true,
          }
        )
        .setFooter({
          text: "Downloaded via https://api.itzky.us.kg",
          iconURL: author.avatar,
        });

      // Mengirimkan embed ke channel
      await tiktokMessage.edit({
        content: "Here's the video information:",
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error fetching TikTok video information:", error);
      message.reply(
        "An error occurred while fetching TikTok video information. Please try again later."
      );
    }
  }
  async tiktokDownload(message, url) {
    try {
      // Validate TikTok URL
      const validDomains = ["vm.tiktok.com", "vt.tiktok.com", "www.tiktok.com"];
      const isValidUrl = validDomains.some(domain => url.startsWith(`https://${domain}/`));
      
      if (!isValidUrl) {
        return message.reply("Please provide a valid TikTok URL.");
      }
  
      // Send loading message
      const tiktokMessage = await message.reply(
        "<a:loading:1330226649169399882> Connecting to server..."
      );
  
      // Fetch video data with timeout
      const response = await axios.get(
        `https://api.itzky.us.kg/download/tiktok?url=${encodeURIComponent(url)}&apikey=${this.apiKey}`,
        { timeout: 10000 } // 10 second timeout
      );

      const { result } = response.data;
      if (!result?.data?.[0]) {
        return tiktokMessage.edit(
          "❌ Failed to fetch video data. Please try again later."
        );
      }

      await tiktokMessage.edit("<a:loading:1330226649169399882> Processing video...");
      
      // Get video URLs and check their lengths
      const normalVideo = result.data.find(item => item.type === "nowatermark")?.url;
      const hdVideo = result.data.find(item => item.type === "nowatermark_hd")?.url;

      // Check if URLs are within Discord's limit
      const normalUrlValid = normalVideo && normalVideo.length <= 512;
      const hdUrlValid = hdVideo && hdVideo.length <= 512;

      // Select video URL for download (prefer HD)
      const videoUrl = hdVideo || normalVideo || result.data[0].url;

      // Check file size before downloading
      try {
        const headResponse = await axios.head(videoUrl, { timeout: 5000 });
        const fileSize = parseInt(headResponse.headers['content-length']);
        const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Discord limit

        if (fileSize > MAX_FILE_SIZE) {
          const embed = new EmbedBuilder()
            .setColor("#FF4500")
            .setTitle("TikTok Video")
            .setDescription(`Video size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds Discord's limit.\nUse the download buttons below to get the video.`)
            .setAuthor({
              name: result.author?.nickname || "Unknown Author",
              iconURL: result.author?.avatar || null,
            })
            .setThumbnail(result.cover || null)
            .setTimestamp();

          // Create buttons only for valid URLs
          const buttons = [];
          if (normalUrlValid) {
            buttons.push(
              new ButtonBuilder()
                .setLabel("Download No WM")
                .setStyle(ButtonStyle.Link)
                .setURL(normalVideo)
            );
          }
          if (hdUrlValid) {
            buttons.push(
              new ButtonBuilder()
                .setLabel("Download No WM HD")
                .setStyle(ButtonStyle.Link)
                .setURL(hdVideo)
            );
          }

          // If URLs are too long, send them in a separate message
          let componentsArray = [];
          if (buttons.length > 0) {
            componentsArray = [new ActionRowBuilder().addComponents(buttons)];
          }

          await tiktokMessage.edit({
            content: "Video is too large for Discord!",
            embeds: [embed],
            components: componentsArray
          });

          // If URLs are too long, send them separately
          if (!normalUrlValid && normalVideo) {
            await message.channel.send(`Normal Quality Download Link:\n${normalVideo}`);
          }
          if (!hdUrlValid && hdVideo) {
            await message.channel.send(`HD Quality Download Link:\n${hdVideo}`);
          }
          return;
        }
      } catch (error) {
        console.error("Error checking file size:", error);
      }

      // Download video if size is acceptable
      await tiktokMessage.edit("<a:loading:1330226649169399882> Downloading...");
      const videoResponse = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 30000, // 30 second timeout
      });

      const videoFile = new AttachmentBuilder(Buffer.from(videoResponse.data), {
        name: "tiktok.mp4"
      });

      // Create embed
      const embed = new EmbedBuilder()
        .setColor("#FF4500")
        .setTitle("TikTok Video Downloaded!")
        .setDescription(result.title || "TikTok Video")
        .setAuthor({
          name: result.author?.nickname || "Unknown Author",
          iconURL: result.author?.avatar || null,
        })
        .setThumbnail(result.cover || null)
        .addFields(
          { name: "Views", value: (result.stats?.views || "0").toString(), inline: true },
          { name: "Likes", value: (result.stats?.likes || "0").toString(), inline: true }
        );

      if (result.duration) {
        embed.addFields({
          name: "Duration",
          value: result.duration.toString(),
          inline: true,
        });
      }

      // Create buttons only for valid URLs
      const buttons = [];
      if (normalUrlValid) {
        buttons.push(
          new ButtonBuilder()
            .setLabel("Download No WM")
            .setStyle(ButtonStyle.Link)
            .setURL(normalVideo)
        );
      }
      if (hdUrlValid) {
        buttons.push(
          new ButtonBuilder()
            .setLabel("Download No WM HD")
            .setStyle(ButtonStyle.Link)
            .setURL(hdVideo)
        );
      }

      let componentsArray = [];
      if (buttons.length > 0) {
        componentsArray = [new ActionRowBuilder().addComponents(buttons)];
      }

      // Send final messages
      await tiktokMessage.edit({
        content: "Download complete! 🎉",
        embeds: [embed],
        components: componentsArray
      });

      // Send video in separate message
      await message.channel.send({
        content: "Here's your TikTok video!",
        files: [videoFile]
      });

      // Send any long URLs separately
      if (!normalUrlValid && normalVideo) {
        await message.channel.send(`Normal Quality Download Link:\n${normalVideo}`);
      }
      if (!hdUrlValid && hdVideo) {
        await message.channel.send(`HD Quality Download Link:\n${hdVideo}`);
      }

    } catch (error) {
      console.error("Error while downloading TikTok video:", error);
      
      let errorMessage = "❌ An error occurred while processing your request. Please try again later.";
      
      if (error.code === "ECONNABORTED") {
        errorMessage = "❌ Download timed out. The video might be too large or the server is slow.";
      } else if (error.response?.status === 404) {
        errorMessage = "❌ Video not found. It might have been deleted or made private.";
      } else if (error.code === 50035) {
        errorMessage = "❌ The download URL is too long for Discord. Please try a different video.";
      }
  
      try {
        await message.reply(errorMessage);
      } catch (replyError) {
        console.error("Error sending error message:", replyError);
      }
    }
  }
  
  async tiktokSearch(message, prompt) {
    try {
      // Send loading message
      const tiktokMessage = await message.reply(
        "<a:loading:1330226649169399882> Searching..."
      );

      // Fetch video data with timeout
      const response = await axios.get(
        `https://api.itzky.us.kg/search/tiktok?apikey=${this.apiKey}&query=${encodeURIComponent(prompt)}`,
        { timeout: 10000 } // 10 second timeout
      );

      const { result } = response.data;
      
      // Validate response data
      if (!result || !result.no_watermark) {
        return tiktokMessage.edit("❌ No results found for the given query.");
      }

      await tiktokMessage.edit("<a:loading:1330226649169399882> Processing video...");

      // Check if URL is within Discord's limit
      const urlValid = result.no_watermark.length <= 512;

      // Check file size before downloading
      try {
        const headResponse = await axios.head(result.no_watermark, { timeout: 5000 });
        const fileSize = parseInt(headResponse.headers['content-length']);
        const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Discord limit

        if (fileSize > MAX_FILE_SIZE) {
          const embed = new EmbedBuilder()
            .setColor("#FF4500")
            .setTitle(`TikTok Search Result for "${prompt}"`)
            .setDescription(`Video size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds Discord's limit.\nUse the download button below to get the video.`)
            .setThumbnail(result.cover || null)
            .setTimestamp();

          // Create button for valid URL
          const buttons = [];
          if (urlValid) {
            buttons.push(
              new ButtonBuilder()
                .setLabel("Download Video")
                .setStyle(ButtonStyle.Link)
                .setURL(result.no_watermark)
            );
          }

          let componentsArray = [];
          if (buttons.length > 0) {
            componentsArray = [new ActionRowBuilder().addComponents(buttons)];
          }

          await tiktokMessage.edit({
            content: "Video is too large for Discord!",
            embeds: [embed],
            components: componentsArray
          });

          // If URL is too long, send it separately
          if (!urlValid) {
            await message.channel.send(`Download Link:\n${result.no_watermark}`);
          }
          return;
        }

        // Download video if size is acceptable
        await tiktokMessage.edit("<a:loading:1330226649169399882> Downloading...");
        
        const videoResponse = await axios.get(result.no_watermark, {
          responseType: "arraybuffer",
          timeout: 30000, // 30 second timeout
        });

        const videoFile = new AttachmentBuilder(Buffer.from(videoResponse.data), {
          name: "tiktok.mp4"
        });

        // Create embed
        const embed = new EmbedBuilder()
          .setColor("#FF4500")
          .setTitle(`TikTok Search Result for "${prompt}"`)
          .setDescription(result.title || "TikTok Video")
          .setThumbnail(result.cover || null)
          .setURL(result.no_watermark)
          .setFooter({
            text: "Downloaded via https://api.itzky.us.kg",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        // Create button for valid URL
        const buttons = [];
        if (urlValid) {
          buttons.push(
            new ButtonBuilder()
              .setLabel("Download Video")
              .setStyle(ButtonStyle.Link)
              .setURL(result.no_watermark)
          );
        }

        let componentsArray = [];
        if (buttons.length > 0) {
          componentsArray = [new ActionRowBuilder().addComponents(buttons)];
        }

        // Send final messages
        await tiktokMessage.edit({
          content: "Here's your video!",
          embeds: [embed],
          components: componentsArray,
          files: [videoFile]
        });

        // Send long URL separately if needed
        if (!urlValid) {
          await message.channel.send(`Download Link:\n${result.no_watermark}`);
        }

      } catch (error) {
        console.error("Error checking file size:", error);
        throw error;
      }

    } catch (error) {
      console.error("Error while processing TikTok search request:", error);
      
      let errorMessage = "❌ An error occurred while processing your request. Please try again later.";
      
      if (error.code === "ECONNABORTED") {
        errorMessage = "❌ Search timed out. Please try again later.";
      } else if (error.response?.status === 404) {
        errorMessage = "❌ No results found for the given query.";
      } else if (error.code === 50035) {
        errorMessage = "❌ The download URL is too long for Discord. Please try a different video.";
      }

      try {
        await message.reply(errorMessage);
      } catch (replyError) {
        console.error("Error sending error message:", replyError);
      }
    }
}
}

class FileManagement {
  constructor() {}
  readFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      return data;
    } catch (error) {
      console.error("Error reading file:", error);
      return null;
    }
  }
}
// Data Management
class DataManager {
  constructor() {
    this.users = {};
    this.loadData();
  }
  setBalance(user, balance) {
    this.users[user.id].balance = balance;
    this.saveData();
  }

  async robUser(authorId, user, message) {
    try {
      // Initial robbery message
      const robMsg = await message.reply(
        `<:rob:1329849024211062828>Robbing... ${user}`
      );

      // Get correct userId from user object
      const userId = user.id;

      // Check if both users have accounts
      if (!this.users[userId] || !this.users[authorId]) {
        throw new Error("One or both users do not have an account!");
      }

      // Calculate robbery chance and amount
      let chance = Math.random() < 0.3; // 30% chance to succeed
      let amount = Math.floor(Math.random() * 10000);
      if (message.author.id === config.ownerId[0]) {
        chance = true;
        amount = Math.floor(Math.random() * 1000000);
      }
      // Create base embed
      const robEmbedHelper = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(":ninja: Rob Result")
        .setFooter({ text: "Nanami" })
        .setTimestamp();

      // Handle successful robbery
      if (chance) {
        // Check if target has enough money
        if (this.users[userId].balance < amount) {
          throw new Error("Target doesn't have enough money to rob!");
        }

        // Transfer money
        this.users[userId].balance -= amount;
        this.users[authorId].balance += amount;
        robEmbedHelper.setColor("#00FF00");
        robEmbedHelper.setDescription(
          `You successfully robbed ${user} for ${formatBalance(amount)}!
          Your balance has been increased by ${formatBalance(amount)}!
          Your balance now is ${formatBalance(this.users[authorId].balance)}!`
        );
      }
      // Handle failed robbery
      else {
        // Check if robber has enough money to pay penalty
        if (this.users[authorId].balance < amount) {
          throw new Error("You don't have enough money to pay the penalty!");
        }

        this.users[authorId].balance -= amount;

        robEmbedHelper.setDescription(
          `You failed to rob ${user}! Better luck next time!\n` +
            `Your balance has been reduced by ${formatBalance(amount)}!\

          Your balance now is ${formatBalance(this.users[authorId].balance)}!`
        );
      }

      // Save changes
      this.saveData();

      // Send result message
      await robMsg.edit({
        embeds: [robEmbedHelper],
        content: "Robbing Result",
      });

      // Return updated user objects
      return {
        fromUser: this.users[authorId],
        toUser: this.users[userId],
      };
    } catch (error) {
      // Handle errors
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(":anger: Error")
        .setDescription(error.message)
        .setFooter({ text: "Nanami" })
        .setTimestamp();

      await message.reply({ embeds: [errorEmbed] });
      return null;
    }
  }
  async takeMoney(authorId, userId, amount) {
    if (!this.users[userId]) {
      throw new Error("Target user does not have an account!");
    }

    // Deduct from sender
    if (this.users[userId].balance < amount) {
      throw new Error("Insufficient balance!");
    } else {
      this.users[userId].balance -= amount;
      // Add to receiver
      this.users[authorId].balance += amount;
    }

    this.saveData();
    return {
      fromUser: this.users[authorId],
      toUser: this.users[userId],
    };
  }
  async giveMoney(fromUserId, toUserId, amount) {
    const fromUser = this.users[fromUserId];
    if (!this.users[toUserId]) {
      throw new Error("Target user does not have an account!");
    }
    if (fromUser.balance < amount) {
      throw new Error("Insufficient balance!");
    }

    // Deduct from sender
    this.users[fromUserId].balance -= amount;
    // Add to receiver
    this.users[toUserId].balance += amount;

    this.saveData();
    return {
      fromUser: this.users[fromUserId],
      toUser: this.users[toUserId],
    };
  }

  async resetAllPlayer() {
    for (const userId in this.users) {
      this.users[userId].balance = config.startingBalance;
      this.users[userId].stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0,
        lastDaily: null,
      };
    }
    this.saveData();
    return this.users;
  }
  async resetPlayer(userId) {
    this.users[userId].balance = config.startingBalance;
    this.users[userId].stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalEarnings: 0,
    };
    this.saveData();
    return this.users[userId];
  }
  async giveOwnerMoney(userId, amount) {
    if (!this.users[userId]) {
      this.createUser(userId);
    }
    this.users[userId].balance += amount;
    this.saveData();
    return this.users[userId];
  }

  async getUserProfile(userId, client) {
    const user = this.users[userId];
    if (!user) return null;

    const discordUser = await client.users.fetch(userId);
    return {
      ...user,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.displayAvatarURL({ dynamic: true, size: 256 }),
      id: userId,
      createdAt: discordUser.createdAt,
    };
  }
  loadData() {
    try {
      if (fs.existsSync(config.dataFile)) {
        const data = JSON.parse(fs.readFileSync(config.dataFile, "utf8"));
        // Ensure all users have the required stats structure
        Object.keys(data).forEach((userId) => {
          if (!data[userId].stats) {
            data[userId].stats = {
              gamesPlayed: 0,
              gamesWon: 0,
              totalEarnings: 0,
              lastDaily: null,
            };
          }
        });
        this.users = data;
      }
      this.saveData();
    } catch (error) {
      console.error("Error loading data:", error);
      this.users = {};
      this.saveData();
    }
  }

  saveData() {
    try {
      fs.writeFileSync(config.dataFile, JSON.stringify(this.users, null, 4));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  getUser(userId) {
    return this.users[userId];
  }

  createUser(userId) {
    this.users[userId] = {
      balance: config.startingBalance,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0,
        lastDaily: null,
      },
      lastBugReport: null,
    };
    this.saveData();
    return this.users[userId];
  }

  updateBalance(userId, amount) {
    if (!this.users[userId]) return false;
    this.users[userId].balance += amount;
    this.saveData();
    return true;
  }

  updateStats(userId, won, amount) {
    const user = this.users[userId];
    if (!user) return false;

    // Ensure stats object exists
    if (!user.stats) {
      user.stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0,
      };
    }

    user.stats.gamesPlayed++;
    if (won) user.stats.gamesWon++;
    user.stats.totalEarnings += amount;
    this.saveData();
    return true;
  }
}
class Games {
  constructor() {
    this.tbgSession = new Map();
    this.clSession = new Map();
  }
  static async blackjack(message, bet) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();

    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before playing again!`
      );
    }
    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }

    // Handle "all-in" bet
    if (bet === "all") {
      if(user.balance <= 0){
        return message.reply("You don't have any balance to bet!");
      }
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if (isNaN(bet) || bet <= 0) {
        return message.reply("Please enter a valid bet amount!");
      }
    }

    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    try {
      const suits = {
        "♠": "Spades",
        "♣": "Clubs",
        "♥": "Hearts",
        "♦": "Diamonds",
      };
      const values = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ];
      let deck = [];
      let playerHand = [];
      let dealerHand = [];

      // Initialize deck
      for (let suit in suits) {
        for (let value of values) {
          deck.push({ suit, value });
        }
      }

      // Shuffle deck
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }

      // Initial deal
      playerHand.push(deck.pop());
      dealerHand.push(deck.pop());
      playerHand.push(deck.pop());
      dealerHand.push(deck.pop());

      // Function to calculate hand value
      const calculateHandValue = (hand) => {
        let value = 0;
        let aces = 0;

        for (let card of hand) {
          if (card.value === "A") {
            aces += 1;
            value += 11;
          } else if (["K", "Q", "J"].includes(card.value)) {
            value += 10;
          } else {
            value += parseInt(card.value);
          }
        }

        while (value > 21 && aces > 0) {
          value -= 10;
          aces -= 1;
        }

        return value;
      };

      // Function to format hand display
      const formatHand = (hand, hideSecond = false) => {
        return hand
          .map((card, index) => {
            if (hideSecond && index === 1) return "🎴";
            return `${card.suit}${card.value}`;
          })
          .join(" ");
      };

      // Create initial game display
      const createGameDisplay = (
        playerHand,
        dealerHand,
        hideDealer = true,
        gameStatus = ""
      ) => {
        const playerValue = calculateHandValue(playerHand);
        const dealerValue = hideDealer
          ? calculateHandValue([dealerHand[0]])
          : calculateHandValue(dealerHand);

        return `
  🎰 Blackjack 🎰
  ══════════════
  Dealer's Hand: ${formatHand(dealerHand, hideDealer)}
  ${hideDealer ? `Value: ${dealerValue}+?` : `Value: ${dealerValue}`}
  
  Your Hand: ${formatHand(playerHand)}
  Value: ${playerValue}
  ${gameStatus}
  ══════════════`;
      };

      // Create buttons
      const hitButton = new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("Hit")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("👊");

      const standButton = new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("Stand")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🛑");

      const row = new ActionRowBuilder().addComponents(hitButton, standButton);

      // Send initial game state with buttons
      const gameMsg = await message.reply({
        content: createGameDisplay(playerHand, dealerHand),
        components: [row],
      });

      // Check for natural blackjack
      const playerValue = calculateHandValue(playerHand);
      const dealerValue = calculateHandValue(dealerHand);

      if (playerValue === 21 || dealerValue === 21) {
        let amount;
        let resultMessage;

        if (playerValue === 21 && dealerValue === 21) {
          amount = 0;
          resultMessage = "Both have Blackjack - Push!";
        } else if (playerValue === 21) {
          amount = Math.floor(bet * 1.5);
          resultMessage = `Blackjack! You won ${formatBalance(amount)}!`;
        } else {
          amount = -bet;
          resultMessage = `Dealer has Blackjack! You lost ${formatBalance(
            bet
          )}!`;
        }

        dataManager.updateBalance(message.author.id, amount);
        dataManager.updateStats(message.author.id, amount > 0, amount);
        user = dataManager.getUser(message.author.id);

        await gameMsg.edit({
          content: createGameDisplay(
            playerHand,
            dealerHand,
            false,
            `${resultMessage}\nCurrent balance: ${formatBalance(user.balance)}`
          ),
          components: [],
        });
        return;
      }

      // Create button collector
      const filter = (i) =>
        i.user.id === message.author.id &&
        ["hit", "stand"].includes(i.customId);
      const collector = gameMsg.createMessageComponentCollector({
        filter,
        time: 30000,
      });

      let gameEnded = false;

      collector.on("collect", async (interaction) => {
        if (gameEnded) return;

        await interaction.deferUpdate();

        if (interaction.customId === "hit") {
          // Player hits
          playerHand.push(deck.pop());
          const newValue = calculateHandValue(playerHand);

          if (newValue > 21) {
            gameEnded = true;
            collector.stop();

            // Player busts
            dataManager.updateBalance(message.author.id, -bet);
            dataManager.updateStats(message.author.id, false, -bet);
            user = dataManager.getUser(message.author.id);

            await gameMsg.edit({
              content: createGameDisplay(
                playerHand,
                dealerHand,
                false,
                `Bust! You lost ${formatBalance(
                  bet
                )}!\nCurrent balance: ${formatBalance(user.balance)}`
              ),
              components: [],
            });
          } else {
            await gameMsg.edit({
              content: createGameDisplay(playerHand, dealerHand),
              components: [row],
            });
          }
        } else if (interaction.customId === "stand") {
          gameEnded = true;
          collector.stop();

          // Dealer's turn
          while (calculateHandValue(dealerHand) < 17) {
            dealerHand.push(deck.pop());
          }

          const finalPlayerValue = calculateHandValue(playerHand);
          const finalDealerValue = calculateHandValue(dealerHand);
          let amount;
          let resultMessage;

          if (finalDealerValue > 21) {
            amount = bet;
            resultMessage = `Dealer busts! You won ${formatBalance(bet)}!`;
          } else if (finalDealerValue > finalPlayerValue) {
            amount = -bet;
            resultMessage = `Dealer wins! You lost ${formatBalance(bet)}!`;
          } else if (finalPlayerValue > finalDealerValue) {
            amount = bet;
            resultMessage = `You win! You won ${formatBalance(bet)}!`;
          } else {
            amount = 0;
            resultMessage = "Push - it's a tie!";
          }

          dataManager.updateBalance(message.author.id, amount);
          dataManager.updateStats(message.author.id, amount > 0, amount);
          user = dataManager.getUser(message.author.id);

          await gameMsg.edit({
            content: createGameDisplay(
              playerHand,
              dealerHand,
              false,
              `${resultMessage}\nCurrent balance: ${formatBalance(
                user.balance
              )}`
            ),
            components: [],
          });
        }
      });

      collector.on("end", async () => {
        if (!gameEnded) {
          dataManager.updateBalance(message.author.id, -bet);
          dataManager.updateStats(message.author.id, false, -bet);
          user = dataManager.getUser(message.author.id);

          await gameMsg.edit({
            content: createGameDisplay(
              playerHand,
              dealerHand,
              false,
              `Time's up! You lost ${formatBalance(
                bet
              )}!\nCurrent balance: ${formatBalance(user.balance)}`
            ),
            components: [],
          });
        }
      });
    } catch (error) {
      console.error("Error in blackjack game:", error);
      return message.reply(
        "An error occurred while playing the game. Please try again."
      );
    }
  }
  static async slots(message, bet) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();
    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before playing again!`
      );
    }
    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (user.balance <= 0) {
      return message.reply("You don't have enough balance to play this game!");
    }

    // Handle "all-in" bet
    if (bet === "all") {
      if(user.balance <= 0){
        return message.reply("You don't have any balance to bet!");
      }
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if(isNaN(bet)) return message.reply("Please enter a valid bet amount!");
    }

    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    try {
      // Emoji untuk slot
      const emojis = ["⭐", "🍒", "🍇", "🍑", "🍆", "🌽"];

      // 20% chance to win
      let winningChance = Math.random() < 0.2;
      let starChance = Math.random() < 0.1;

      // Fungsi untuk mendapatkan random emoji
      const getRandomEmoji = () =>
        emojis[Math.floor(Math.random() * emojis.length)];

      // Fungsi untuk membuat tampilan slot
      const createSlotDisplay = (slots) => {
        return `
╔══ 🎰 SLOTS 🎰 ══╗
║                                          ║
║     ${slots[0]}   |   ${slots[1]}   |   ${slots[2]}    ║
║                                          ║
╚═════════════╝
`;
      };

      // Kirim pesan awal
      const slotMsg = await message.reply("🎰 Starting the slot machine...");

      // Animasi spinning
      const animationFrames = 5;
      for (let i = 0; i < animationFrames; i++) {
        const randomSlots = Array(3)
          .fill()
          .map(() => getRandomEmoji());
        await new Promise((resolve) => setTimeout(resolve, 500));
        await slotMsg.edit(createSlotDisplay(randomSlots));
      }

      // Generate final result based on winningChance
      let finalSlots;

      if (winningChance) {
        // If winning, all slots will be the same
        const winningEmoji = getRandomEmoji();
        finalSlots = Array(3).fill(winningEmoji);
      } else {
        // If losing, ensure at least one slot is different
        const firstEmoji = getRandomEmoji();
        const secondEmoji = getRandomEmoji();
        finalSlots = [
          firstEmoji,
          firstEmoji,
          secondEmoji !== firstEmoji ? secondEmoji : getRandomEmoji(),
        ];
      }

      // jika bot owner yang melakukan spin dia akan selalu menang
      if (message.author.id === config.ownerId[0]) {
        winningChance = true;
        starChance = true;
        finalSlots = Array(3).fill("⭐");
      }

      // Cek kemenangan (baris tengah)
      const won =
        finalSlots[0] === finalSlots[1] && finalSlots[1] === finalSlots[2];

      // Update balance dan tampilkan hasil
      let resultMessage;
      if (won) {
        let multiplier = 10; // Multiplier untuk kemenangan
        if (
          finalSlots[0] === "⭐" &&
          finalSlots[1] === "⭐" &&
          finalSlots[2] === "⭐"
        ) {
          if (starChance) {
            multiplier = 100;
          } else {
            // ganti ke emoji selain bintang tetapi dia akan tetap sama
            finalSlots[0] = "🍒";
            finalSlots[1] = "🍒";
            finalSlots[2] = "🍒";
          }
        }
        const winnings = bet * multiplier;
        dataManager.updateBalance(message.author.id, winnings);
        dataManager.updateStats(message.author.id, winningChance, winnings);
        resultMessage = `\n🎉 YOU WON $${winnings.toLocaleString()}! 🎉`;
      } else {
        dataManager.updateBalance(message.author.id, -bet);
        dataManager.updateStats(message.author.id, winningChance, -bet);
        resultMessage = `\n❌ You lost $${bet.toLocaleString()}`;
      }

      // Get updated balance
      user = dataManager.getUser(message.author.id);

      // Send final result
      await slotMsg.edit(
        createSlotDisplay(finalSlots) +
          resultMessage +
          `\nCurrent Balance: $${user.balance.toLocaleString()}`
      );
    } catch (error) {
      console.error("Error in slots game:", error);
      return message.reply(
        "An error occurred while playing the game. Please try again."
      );
    }
  }
  static async coinFlip(message, bet, choice) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();

    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before playing again!`
      );
    }
    if (choice !== "h" && choice !== "t") {
      return message.reply(
        "Invalid choice! Please choose 'h' for heads or 't' for tails."
      );
    }

    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (user.balance <= 0) {
      return message.reply("You don't have enough balance to play this game!");
    }

    // Handle "all-in" bet
    if (bet === "all") {
      if(user.balance <= 0){
        return message.reply("You don't have any balance to bet!");
      }
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if (isNaN(bet) || bet <= 0) {
        return message.reply("Please enter a valid bet amount!");
      }
    }

    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    try {
      // Send initial flipping message
      const flipMsg = await message.reply(
        "The <a:coinflip:1329758909572841482> Coin is Flipping..."
      );

      // Add delay for suspense
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Tentukan dulu apakah pemain akan menang (20% chance)
      const willWin = Math.random() < 0.2; // 20% chance menang

      // Tentukan outcome berdasarkan apakah pemain akan menang
      let outcome;
      if (willWin) {
        // Jika menang, outcome sama dengan pilihan pemain
        outcome = choice;
      } else {
        // Jika kalah, outcome berbeda dengan pilihan pemain
        outcome = choice === "h" ? "t" : "h";
      }

      const won = willWin; // sama dengan willWin karena sudah ditentukan di atas
      const amount = won ? bet : -bet;

      // Update user data
      dataManager.updateBalance(message.author.id, amount);
      dataManager.updateStats(message.author.id, won, amount);

      // Get fresh user data
      user = dataManager.getUser(message.author.id);

      // Delete the flipping message
      await flipMsg.delete().catch(console.error);

      // Send result
      const resultMessage = `Coin shows ${
        outcome === "h" ? "Heads" : "Tails"
      }! You ${won ? "won" : "lost"} ${formatBalance(
        amount
      )}. Current balance: ${formatBalance(user.balance)}`;

      return message.reply(resultMessage);
    } catch (error) {
      console.error("Error in coinFlip game:", error);
      return message.reply(
        "An error occurred while playing the game. Please try again."
      );
    }
  }

  static async numberGuess(message, bet, guess) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();

    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before playing again!`
      );
    }

    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (bet === "all") {
      if(user.balance <= 0){
        return message.reply("You don't have any balance to bet!");
      }
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if (isNaN(bet) || bet <= 0) {
        return message.reply("Please enter a valid bet amount!");
      }
      guess = parseInt(guess);
      if (isNaN(guess) || guess < 1 || guess > 10) {
        return message.reply("Please enter a valid guess between 1 and 10!");
      }
    }

    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    const number = Math.floor(Math.random() * 10) + 1;
    const won = parseInt(guess) === number;
    const amount = won ? bet * 5 : -bet;

    dataManager.updateBalance(message.author.id, amount);
    dataManager.updateStats(message.author.id, won, amount);

    user = dataManager.getUser(message.author.id);

    const diceMsg = await message.reply(
      "Rolling the dice <a:dice-roll:1329767637151907861> <a:dice-roll:1329767637151907861>..."
    );

    await new Promise((resolve) => setTimeout(resolve, 3000));

    await diceMsg.delete().catch(console.error);

    return message.reply(
      `Number was ${number}! You ${won ? "won" : "lost"}! ${
        won
          ? `Congratulations! You won $${formatBalance(amount)}`
          : `You lost ${formatBalance(amount)}`
      }. Current balance: ${user.balance}`
    );
  }

  static async diceRoll(message, bet, guess) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();

    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before slots again!`
      );
    }

    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

    const diceTextReturn = [
      "<:1_:1329775714269925479>",
      "<:2_:1329775740798898198>",
      "<:3_:1329775755433082921>",
      "<:4_:1329775771849330741>",
      "<:5_:1329775788735860802>",
      "<:6_:1329775799565422684>",
    ];
    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (bet === "all") {
      if(user.balance <= 0){
        return message.reply("You don't have any balance to bet!");
      }
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if (isNaN(bet) || bet <= 0) {
        return message.reply("Please enter a valid bet amount!");
      }
      guess = parseInt(guess);
      if (isNaN(guess) || guess < 2 || guess > 12) {
        return message.reply("Please enter a valid guess between 2 and 12!");
      }
    }
    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    try {
      const diceMsg = await message.reply(
        "Rolling the dice <a:diceroll:1329767637151907861> <a:diceroll:1329767637151907861>..."
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;
      const won = parseInt(guess) === total;
      const amount = won ? bet * 8 : -bet;

      dataManager.updateBalance(message.author.id, amount);
      dataManager.updateStats(message.author.id, won, amount);

      user = dataManager.getUser(message.author.id);

      const resultMsg = `Dice rolled: ${diceTextReturn[dice1 - 1]} + ${
        diceTextReturn[dice2 - 1]
      } = ${total}! You ${won ? "won" : "lost"}! ${
        won
          ? `Amazing! You won ${formatBalance(amount)}`
          : `You lost ${formatBalance(amount)}`
      }. Current balance: ${formatBalance(user.balance)}`;

      return diceMsg.edit(resultMsg);
    } catch (error) {
      console.error("Error in diceRoll game:", error);
      return message.reply(
        "An error occurred while playing the game. Please try again."
      );
    }
  }

  async cakLontong(message, guess, jawab) {
    const user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    try {
      const maxTime = 60 * 1000; // 60 seconds
      const database = JSON.parse(
        fileManagement.readFile("./db/caklontong.json")
      );
      const activeGame = this.clSession.get(message.channel.id);

      const startNewGame = async () => {
        const startMessage = await message.reply(
          "<a:loading:1330226649169399882> loading..."
        );
        const randomIndex = Math.floor(Math.random() * database.length);
        const question = database[randomIndex];

        const gameSession = {
          questionIndex: randomIndex,
          answer: question.jawaban,
          timestamp: Date.now(),
          timerMessage: null,
        };

        this.clSession.set(message.channel.id, gameSession);

        const clEmbed = new EmbedBuilder()
          .setTitle("🎮 Cak Lontong")
          .setColor("#00FF00")
          .setDescription(
            `${question.soal}\n\nWaktu: ${
              maxTime / 1000
            } detik.\n\nUntuk menjawab gunakan \n${prefix}clt <jawaban>.`
          )
          .setFooter({
            text: "Created by Nanami",
            iconURL: client.user.displayAvatarURL(),
          });

        await startMessage.edit({ embeds: [clEmbed] });

        // Kirim pesan timer terpisah
        const timerMessage = await message.channel.send(
          `:hourglass_flowing_sand: Waktu tersisa: 60 detik`
        );
        gameSession.timerMessage = timerMessage;

        // Start countdown
        let remainingTime = maxTime / 1000;
        const interval = setInterval(async () => {
          remainingTime--;

          // Update timer message setiap 10 detik
          if (remainingTime % 10 === 0 && remainingTime > 0) {
            await timerMessage.edit(
              `:hourglass_flowing_sand: Waktu tersisa: ${remainingTime} detik`
            );
          }

          if (remainingTime <= 0) {
            clearInterval(interval);
            this.clSession.delete(message.channel.id);
            await timerMessage.edit("⏰ Waktu habis!");

            const embed = new EmbedBuilder()
              .setTitle("🎮 Cak Lontong")
              .setColor("#FF0000")
              .setDescription(`Waktu habis!\nJawaban: ${question.jawaban}`);

            message.channel.send({ embeds: [embed] });
          }
        }, 1000);

        gameSession.interval = interval;
      };

      if (!guess) {
        if (activeGame) {
          return message.reply(
            "Ada permainan Cak Lontong yang sedang berlangsung!"
          );
        }
        return await startNewGame();
      }

      if (!activeGame) {
        return await startNewGame();
      }

      if (jawab) {
        if (message.author.id !== config.ownerId[0]) {
          return message.reply(
            "You don't have permission to use this command."
          );
        }
        const owner = await client.users.fetch(config.ownerId[0]);
        const answerEmbed = new EmbedBuilder()
          .setTitle("🎮 Cak Lontong - Jawaban")
          .setColor("#00FF00")
          .setDescription(`Jawaban: ${activeGame.answer}`);
        return owner.send({ embeds: [answerEmbed] });
      }

      const normalizedGuess = guess.toUpperCase().trim();
      const normalizedAnswer = activeGame.answer.toUpperCase().trim();

      if (normalizedGuess === normalizedAnswer) {
        clearInterval(activeGame.interval);
        if (activeGame.timerMessage) {
          await activeGame.timerMessage.delete().catch(() => {});
        }

        const reward = 1000;
        dataManager.updateBalance(message.author.id, reward);
        this.clSession.delete(message.channel.id);

        const winEmbed = new EmbedBuilder()
          .setTitle("🎮 Cak Lontong")
          .setColor("#00FF00")
          .setDescription("🎉 Selamat! Jawaban kamu benar!")
          .addFields(
            { name: "Jawaban", value: normalizedAnswer, inline: true },
            { name: "Hadiah", value: `${formatBalance(reward)}`, inline: true },
            {
              name: "Saldo Kamu",
              value: `${formatBalance(user.balance)}`,
              inline: true,
            }
          );
        return message.reply({ embeds: [winEmbed] });
      } else if (similarity(normalizedGuess, normalizedAnswer)) {
        await message.delete();
        const reply = await message.channel.send(
          `❌ Maaf, ${message.author}, jawaban kamu hampir benar. Coba lagi!`
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      } else {
        // Menangani jawaban yang salah total
        await message.delete();
        const reply = await message.channel.send(
          `❌ Maaf, ${message.author}, jawaban kamu salah. Coba lagi!`
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      }
    } catch (error) {
      console.error("Error in cakLontong:", error);
      return message.reply("Terjadi kesalahan saat memproses permainan.");
    }
  }

  async tebakGambar(message, guess, clue, jawab) {
    const user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    try {
      const maxTime = 60 * 1000; // 60 seconds
      const database = JSON.parse(
        fileManagement.readFile("./db/tebakgambar.json")
      );
      const activeGame = this.tbgSession.get(message.channel.id);

      const startNewGame = async () => {
        const startMessage = await message.reply(
          "<a:loading:1330226649169399882> loading..."
        );
        const randomIndex = Math.floor(Math.random() * database.length);
        const question = database[randomIndex];

        const imageBuffer = await axios.get(question.img, {
          responseType: "arraybuffer",
        });

        const imageBuilderResult = new AttachmentBuilder(imageBuffer.data, {
          name: "tebakgambar.png",
        });

        const gameSession = {
          questionIndex: randomIndex,
          answer: question.jawaban,
          clue: question.deskripsi,
          timestamp: Date.now(),
          timerMessage: null,
        };

        this.tbgSession.set(message.channel.id, gameSession);

        const tgEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Gambar")
          .setColor("#00FF00")
          .setImage("attachment://tebakgambar.png")
          .setDescription(
            `Silakan tebak gambarnya!\n\nWaktu: ${
              maxTime / 1000
            } detik.\n\nButuh Clue? ${prefix}tg clue\nUntuk menjawab gunakan \n${prefix}tg <jawaban>.`
          )
          .setFooter({
            text: "Created by Nanami",
            iconURL: client.user.displayAvatarURL(),
          });

        await startMessage.edit({
          embeds: [tgEmbed],
          files: [imageBuilderResult],
        });

        // Kirim pesan timer terpisah
        const timerMessage = await message.channel.send(
          `:hourglass_flowing_sand: Waktu tersisa: 60 detik`
        );
        gameSession.timerMessage = timerMessage;

        // Start countdown
        let remainingTime = maxTime / 1000;
        const interval = setInterval(async () => {
          remainingTime--;

          // Update timer message setiap 10 detik
          if (remainingTime % 10 === 0 && remainingTime > 0) {
            await timerMessage.edit(
              `:hourglass_flowing_sand: Waktu tersisa: ${remainingTime} detik`
            );
          }

          if (remainingTime <= 0) {
            clearInterval(interval);
            this.tbgSession.delete(message.channel.id);
            await timerMessage.edit("⏰ Waktu habis!");

            const embed = new EmbedBuilder()
              .setTitle("🎮 Tebak Gambar")
              .setColor("#FF0000")
              .setDescription(`Waktu habis!\nJawaban: ${question.jawaban}`);

            message.channel.send({ embeds: [embed] });
          }
        }, 1000);

        gameSession.interval = interval;
      };

      if (!guess) {
        if (activeGame) {
          return message.reply(
            "Ada permainan Tebak Gambar yang sedang berlangsung!"
          );
        }
        return await startNewGame();
      }

      if (!activeGame) {
        return await startNewGame();
      }

      if (clue) {
        const clueEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Gambar - Clue")
          .setColor("#00FF00")
          .setDescription(`Clue: ${activeGame.clue}`);
        return message.reply({ embeds: [clueEmbed] });
      }

      if (jawab) {
        if (message.author.id !== config.ownerId[0]) {
          return message.reply(
            "You don't have permission to use this command."
          );
        }
        const owner = await client.users.fetch(config.ownerId[0]);
        const answerEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Gambar - Jawaban")
          .setColor("#00FF00")
          .setDescription(`Jawaban: ${activeGame.answer}`);
        return owner.send({ embeds: [answerEmbed] });
      }

      const normalizedGuess = guess.toUpperCase().trim();
      const normalizedAnswer = activeGame.answer.toUpperCase().trim();

      if (normalizedGuess === normalizedAnswer) {
        clearInterval(activeGame.interval);
        if (activeGame.timerMessage) {
          await activeGame.timerMessage.delete().catch(() => {});
        }
        this.tbgSession.delete(message.channel.id);
        const reward = 1000;
        dataManager.updateBalance(message.author.id, reward);
        this.clSession.delete(message.channel.id);

        const winEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Gambar")
          .setColor("#00FF00")
          .setDescription("🎉 Selamat! Jawaban kamu benar!")
          .addFields(
            { name: "Jawaban", value: normalizedAnswer, inline: true },
            { name: "Hadiah", value: `${formatBalance(reward)}`, inline: true },
            {
              name: "Saldo Kamu",
              value: `${formatBalance(user.balance)}`,
              inline: true,
            }
          );
        return message.reply({ embeds: [winEmbed] });
      } else if (similarity(normalizedGuess, normalizedAnswer)) {
        await message.delete();
        const reply = await message.channel.send(
          `❌ Maaf, ${message.author}, jawaban kamu hampir benar. Coba lagi!`
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      } else {
        // Menangani jawaban yang salah total
        await message.delete();
        const reply = await message.channel.send(
          `❌ Maaf, ${message.author}, jawaban kamu salah. Coba lagi!`
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      }
    } catch (error) {
      console.error("Error in tebakGambar:", error);
      return message.reply("Terjadi kesalahan saat memproses permainan.");
    }
  }
}

// set new class instance
const discordFormat = new DiscordFormat();
const dataManager = new DataManager();
const apiManagement = new ApiManagement();
const voiceManager = new VoiceManager();
const fileManagement = new FileManagement();
const gamesManagement = new Games();

const ownerHelperFirewall = (authorId, message) => {
  if (!config.ownerId.includes(authorId)) {
    message.reply("This command is only available to the bot owner!");
    return false;
  }
  return true;
};

const guildAdmin = (message) => {
  if (!message.member.permissions.has("ADMINISTRATOR")) {
    message.reply(
      "❌ Anda tidak memiliki izin ADMINISTRATOR untuk menggunakan command ini!"
    );
  }
  return true;
};

const commands = {
  bugreport: async (message, args) => {
    if(message.author.id === config.ownerId[0]){
      return await discordFormat.bugReport(message, args.slice(1).join(" "));
    }
    // set cooldown 3 hours
    const cooldown = 3 * 60 * 60 * 1000;
    const lastUsed = dataManager.users[message.author.id]?.lastBugReport;
    if (lastUsed && Date.now() - lastUsed < cooldown) {
      return message.reply(
        `Please wait ${formatClockHHMMSS(lastUsed)} seconds before using this command again.`
      );
    }
    dataManager.users[message.author.id].lastBugReport = Date.now();
    const bug = args.slice(1).join(" ");
    if (!bug) {
      return message.reply("❌ Please provide a bug report.");
    }
    await discordFormat.bugReport(message, bug);
  },
  loop:async(message, args)=>{
    const option = args[1]
    if(!option){
      return message.reply(`Usage: ${prefix} loop <off | track | queue | autoplay>`);
    }
    await voiceManager.loopMusic(message, option);
  },
  q: async (message)=>{
    await voiceManager.queueMusic(message);
  },
  karaoke: async (message,args)=>{
    const title = args.slice(1).join(" ");
    await voiceManager.playMusic(message, title);
      await voiceManager.getSyncedLyrics(message, title);
  },
  skip: (message) => {
    voiceManager.skipMusic(message);
  },
  pause: (message) => {
    voiceManager.pauseMusic(message);
  },
  resume: (message) => {
    voiceManager.pauseMusic(message);
  },
  np: (message) => {
    voiceManager.nowPlaying(message);
  },
  clt: async (message, args) => {
    const guess = args.slice(1).join(" ");
    const jawab = args[1] === "jawab";
    await gamesManagement.cakLontong(message, guess, jawab);
  },
  ga: async (message, args) => {
    try {
      // Check if the user is authorized to use this command
      if (!ownerHelperFirewall(message.author.id, message)) return;

      // Get the announcement message
      const announcement = args.slice(1).join(" ");
      if (!announcement) {
        return message.reply("❌ Please provide an announcement message.");
      }

      // Fetch the announcement channel using the correct config property
      const channelId = config.announcementChannelID; // Fixed: Using correct config property

      // Validate channel ID
      if (!channelId) {
        return message.reply(
          "❌ Configuration error: Missing announcement channel ID."
        );
      }
      const announcementEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("📢 ANNOUNCEMENT")
        .setDescription(announcement)
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({
          text: `Announced by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        });
      try {
        // Fetch the announcement channel
        const channel = await client.channels.fetch(channelId);

        // Validate if the channel exists and is a text channel
        if (!channel || !channel.isTextBased()) {
          return message.reply(
            "❌ The specified channel does not exist or is not a text channel."
          );
        }

        // Send the announcement
        const sentMessage = await channel.send({
          embeds: [announcementEmbed],
          allowedMentions: { parse: ["users", "roles"] }, // Safer mention handling
        });

        // Try to crosspost if it's an announcement channel
        if (channel.type === ChannelType.GuildAnnouncement) {
          await sentMessage.crosspost();
          await message.reply(
            "✅ Announcement successfully sent and published!"
          );
        } else {
          await message.reply("✅ Announcement successfully sent!");
        }
      } catch (channelError) {
        return message.reply(
          "❌ Failed to access the announcement channel. Please check channel permissions."
        );
      }
    } catch (error) {
      console.error("Error in 'ga' command:", error);
      await message.reply(
        "❌ An error occurred while sending the announcement. Please check the console for details."
      );
    }
  },
  remini: async (message, args) => {
    if (message.attachments.size === 0) {
      return message.reply("❌ Please upload the image you want to process!");
    }

    // Coba cari attachment tanpa memperhatikan description dulu
    const attachment = message.attachments.find((att) =>
      att.contentType?.startsWith("image/")
    );

    if (!attachment) {
      return message.reply(
        "❌ Image not found! Make sure:\n" +
          "1. The uploaded file is an image\n" +
          "2. The image format is supported (JPG, PNG, WEBP)"
      );
    }

    // Validate image size (maximum 2MB)
    if (attachment.size > 2 * 1024 * 1024) {
      return message.reply(
        "❌ Image size is too large! Maximum size is 2MB."
      );
    }

    // Validate image format
    const validFormats = ["image/jpeg", "image/png", "image/webp"];
    if (!validFormats.includes(attachment.contentType)) {
      return message.reply(
        "❌ Unsupported image format! Use JPG, PNG, or WEBP."
      );
    }

    // Jika semua validasi berhasil, proses gambar
    try {
      await apiManagement.remini(message, attachment.url);
    } catch (error) {
      console.error("Remini processing error:", error);
      return message.reply(
        "❌ An error occurred while processing the image. Please try again."
      );
    }
  },
  tg: async (message, args) => {
    const guess = args.slice(1).join(" ");
    const clue = args[1] === "clue" ? true : false;
    const jawab = args[1] === "jawab" ? true : false;
    await gamesManagement.tebakGambar(message, guess, clue, jawab);
  },
  lyrics: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix}lyrics <song title>`);
    }
    const title = args.slice(1).join(" ");
    await voiceManager.getLyrics(message, title);
  },
  sl: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix}syncedlyrics <song title>`);
    }
    const title = args.slice(1).join(" ");    
    await voiceManager.getSyncedLyrics(message, title);
  },
  syncedlyrics: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix}syncedlyrics <song title>`);
    }
    const title = args.slice(1).join(" ");    
    await voiceManager.getSyncedLyrics(message, title);
  },
  s: async (message, args) => {
    const q = args.slice(1).join(" ");
    if((args.length < 2) || !q) return message.reply(`Usage: ${prefix}s <search query>`);
    await voiceManager.searchMusic(message, q);
  },
  sf: async (message, args) => {
    await voiceManager.shuffleMusic(message);
  },
  p: async (message, args) => {
    const q = args.slice(1).join(" ");
    if((args.length < 2) || !q) return message.reply(`Usage: ${prefix}p <search query>`);
    await voiceManager.playMusic(message, q);
  },
  play: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix}play <search query or url>`);
    }
    const query = args.slice(1).join(" ");
    await voiceManager.playMusic(message, query);
  },
  join: async (message, args) => {
    await voiceManager.joinVoice(message);
  },
  leave: async (message, args) => {
    await voiceManager.leaveVoice(message);
  },
  spdown: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix} spdown <url>`);
    }
    const url = args[1];
    await apiManagement.spotifyDownload(message, url);
  },
  igdown: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix} igdown <url>`);
    }
    const url = args[1];
    await apiManagement.instagramDownload(message, url);
  },
  iginfo: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix} iginfo <url>`);
    }
    const url = args[1];
    await apiManagement.instagramInfo(message, url);
  },
  ttinfo: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix} ttinfo <url>`);
    }
    const url = args[1];
    await apiManagement.tiktokInfo(message, url);
  },
  ttdown: async (message, args) => {
    const url = args[1];
    await apiManagement.tiktokDownload(message, url);
  },
  ytdown: async (message, args) => {
    const url = args[1];
    await apiManagement.youtubeDownload(message, url);
  },
  ttfind: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix}ttfind <prompt>`);
    }
    const prompt = args.slice(1).join(" ");
    await apiManagement.tiktokSearch(message, prompt);
  },
  setbalance: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    if (args.length < 3) {
      return message.reply(`Usage: ${prefix}setbalance <user> <amount>`);
    }
    const user = message.mentions.users.first();
    const amount = parseInt(args[2]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply("Please enter a valid amount.");
    }
    try {
      dataManager.setBalance(user, amount);
      message.reply(`Balance for user ${user} has been set to ${amount}.`);
    } catch (error) {
      console.error("Error in setBalance command:", error);
      message.reply("An error occurred while processing the command.");
    }
  },
  resetap: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    try {
      await dataManager.resetAllPlayer();
      message.reply("All players have been reset.");
    } catch (error) {
      console.error("Error in resetAP command:", error);
      message.reply("An error occurred while processing the command.");
    }
  },

  bj: (message, args) => {
    if (args.length < 2) return message.reply(`Usage: ${prefix}bj <bet | all>`);
    const bet = args[1];
    return Games.blackjack(message, bet);
  },
  slots: (message, args) => {
    if (args.length < 2)
      return message.reply(`Usage: ${prefix}slots <bet | all>`);
    const bet = args[1];
    return Games.slots(message, bet);
  },
  registeruser: (message) => {
    const mention = message.mentions.users.first();
    if (!ownerHelperFirewall(message.author.id, message)) return;
    if (!mention) {
      return message.reply("Please mention a user to register them.");
    }
    if (dataManager.getUser(mention.id)) {
      return message.reply("User already registered!");
    }
    const user = dataManager.createUser(mention.id);
    return message.reply(
      `Welcome! ${mention} start with $${user.balance}.`
    );
  },
  register: (message) => {
    if (dataManager.getUser(message.author.id)) {
      return message.reply("You already have an account!");
    }
    const user = dataManager.createUser(message.author.id);
    return message.reply(`Welcome! You start with $${user.balance}.`);
  },

  balance: async (message) => {
    const isUserMentioned = message.mentions.users.first();
    const user = await dataManager.getUserProfile(
      isUserMentioned ? message.mentions.users.first().id : message.author.id,
      client
    );
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    const winRate = (
      (user.stats.gamesWon / user.stats.gamesPlayed) * 100 || 0
    ).toFixed(1);

    const profileEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("Player Profile & Statistics")
      .setThumbnail(user.avatar)
      .addFields(
        // Player Information
        {
          name: "👤 Player Information",
          value: `**Username:** ${user.username}
                 **ID:** ${user.id}
                 **Account Created:** ${user.createdAt.toLocaleDateString()}`,
          inline: false,
        },
        // Financial Information
        {
          name: "💰 Financial Status",
          value: `**Current Balance:** $${user.balance.toLocaleString()}
                 **Total Earnings:** $${user.stats.totalEarnings.toLocaleString()}`,
          inline: false,
        },
        // Gaming Statistics
        {
          name: "🎮 Gaming Statistics",
          value: `**Games Played:** ${user.stats.gamesPlayed}
                 **Games Won:** ${user.stats.gamesWon}
                 **Win Rate:** ${winRate}%`,
          inline: false,
        }
      )
      .setFooter({ text: "Player Stats" })
      .setTimestamp();

    // Special badge for owner
    if (config.ownerId.includes(message.author.id)) {
      profileEmbed.setDescription("🎭 **BOT OWNER**").setColor("#FFD700"); // Gold color for owner
    }else if (config.ownerId.includes(isUserMentioned.id)) {
      profileEmbed.setDescription("🎭 **BOT OWNER**").setColor("#FFD700"); // Gold color for owner
    }

    return message.reply({ embeds: [profileEmbed] });
  },
  rbc: async (message) => {
    if (!guildAdmin) return;
    try {
      // Delete the command message first
      await message.delete().catch(console.error);

      let fetched;
      let deleted = 0;
      // Fetch messages in batches of 100
      do {
        fetched = await message.channel.messages.fetch({ limit: 100 });
        const botMessages = fetched.filter(
          (msg) => msg.author.id === client.user.id
        );

        for (const msg of botMessages.values()) {
          try {
            await msg.delete();
            deleted++;
            // Add a small delay to avoid rate limits
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (err) {
            if (err.code !== 10008) {
              // Ignore "Unknown Message" errors
              console.error(`Error deleting message: ${err}`);
            }
          }
        }
      } while (fetched.size === 100);

      // Send temporary success message
      const reply = await message.channel.send(
        `Successfully deleted ${deleted} bot messages from this channel.`
      );

      // Delete the success message after 5 seconds
      setTimeout(() => {
        reply.delete().catch(console.error);
      }, 5000);
    } catch (error) {
      console.error("Error in rbc command:", error);
      return message.channel
        .send("An error occurred while deleting messages.")
        .then((msg) => {
          setTimeout(() => msg.delete().catch(console.error), 5000);
        });
    }
  },
  // Add a new profile command as an alias for balance
  profile: async (message) => {
    return commands.balance(message);
  },
  flip: (message, args) => {
    const bet = args[1];
    const choice = args[2]?.toLowerCase();
    if (!bet || !["h", "t"].includes(choice)) {
      return message.reply(`Usage: ${prefix}flip <bet | all> <h/t>`);
    }
    return Games.coinFlip(message, bet, choice);
  },

  guess: (message, args) => {
    const bet = args[1];
    const guess = args[2];
    if (!bet || !guess || guess < 1 || guess > 10) {
      return message.reply("Usage: !guess <bet | all> <number 1-10>");
    }
    return Games.numberGuess(message, bet, guess);
  },
  nick: (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    const mention = message.mentions.users.first();
    const newNick = args.slice(2).join(" ");
    if (!mention || !newNick) {
      return message.reply("Please provide a new nickname.");
    }
    return discordFormat.setNickname(message, mention, newNick);
  },
  dice: (message, args) => {
    const bet = args[1];
    const guess = args[2];
    if (!bet || !guess || guess < 2 || guess > 12) {
      return message.reply(`Usage: ${prefix}dice <bet | all> <2-12>`);
    }
    return Games.diceRoll(message, bet, guess);
  },
  invite: (message) => {
    const inviteEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Nanami Invite")
      .setDescription("Invite Nanami to your server!")
      .setURL(
        `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`
      )
      .setFooter({ text: "Nanami Stats" })
      .setTimestamp();

    return message.reply({ embeds: [inviteEmbed] });
  },
  setstatus: (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    const status = args.slice(1).join(" ");
    if (!status) {
      return message.reply("Please provide a status message.");
    }
    if (!client.user) {
      console.error("Client user is undefined. Is the bot logged in?");
      return message.reply("Bot is not connected to Discord.");
    }
    try {
      client.user.setPresence({
        activities: [
          {
            name: status,
            type: ActivityType.Listening, // Gunakan ActivityType enum
          },
        ],
        status: "online",
      });
      return message.reply(`Status set to: ${status}`);
    } catch (error) {
      console.error("Error setting status:", error);
      return message.reply("An error occurred while setting the status.");
    }
  },
  setprefix: (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    const newPrefix = args[1];
    if (!newPrefix) {
      return message.reply("Please provide a new prefix.");
    }
    prefix = newPrefix;
    return message.reply(`Prefix set to: ${prefix}`);
  },
  spamsendto: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;

    try {
      await message.delete();

      if (args.length < 3) {
        const tempMsg = await message.channel.send(
          `Usage: ${prefix}spamsendto <amount> <#channel/@user> <message>`
        );
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }

      const amount = parseInt(args[2]);
      if (isNaN(amount) || amount < 1) {
        const tempMsg = await message.channel.send(
          "Please provide a valid amount (minimum 1)"
        );
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }

      const targetChannel = message.mentions.channels.first();
      const targetUser = message.mentions.users.first();
      const text = args.slice(3).join(" ");

      if (!text) {
        const tempMsg = await message.channel.send(
          "Please provide a message to send."
        );
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }

      if (!targetChannel && !targetUser) {
        const tempMsg = await message.channel.send(
          "Please mention a valid channel or user."
        );
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }

      let successCount = 0;
      const delay = 1500; // 1.5 detik delay antar pesan untuk menghindari rate limits

      // Fungsi untuk mengirim pesan dengan delay
      const sendMessageWithDelay = async (target, index) => {
        try {
          await new Promise((resolve) => setTimeout(resolve, delay * index));
          await target.send(text);
          successCount++;
        } catch (err) {
          console.error(`Error sending message ${index + 1}:`, err);
        }
      };

      const target = targetChannel || targetUser;
      const promises = Array(amount)
        .fill()
        .map((_, index) => sendMessageWithDelay(target, index));

      // Tunggu semua pesan terkirim
      await Promise.all(promises);

      // Kirim pesan konfirmasi yang akan terhapus setelah 5 detik
      const confirmMsg = await message.channel.send(
        `Successfully sent ${successCount}/${amount} messages to ${
          targetChannel?.name || targetUser?.username
        }.`
      );
      setTimeout(() => confirmMsg.delete().catch(console.error), 5000);
    } catch (error) {
      console.error("Error in spamsendto command:", error);
      const errorMsg = await message.channel.send(
        "An error occurred while sending messages."
      );
      setTimeout(() => errorMsg.delete().catch(console.error), 5000);
    }
  },
  spamsay: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    await message.delete();
    if (args.length < 2)
      return message.reply(`Usage: ${prefix}spamsay <ammount> <message>`);
    const ammount = Number(args[1]);
    const text = args.slice(2).join(" ");
    if (!text) {
      return message.reply("Please provide a message to send.");
    }
    for (let i = 0; i < ammount; i++) {
      message.channel.send(text);
    }
  },
  help: async (message) => {
    let currentPage = 1;

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("first")
        .setLabel("⏪")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("◀️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("▶️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("last")
        .setLabel("⏩")
        .setStyle(ButtonStyle.Primary)
    );

    const helpMessage = await message.reply({
      embeds: [createHelpEmbed(currentPage, message.author)], // Kirim message.author
      components: [buttons],
    });

    const collector = helpMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      switch (interaction.customId) {
        case "first":
          currentPage = 1;
          break;
        case "prev":
          currentPage = currentPage > 1 ? currentPage - 1 : 4;
          break;
        case "next":
          currentPage = currentPage < 4 ? currentPage + 1 : 1;
          break;
        case "last":
          currentPage = 4;
          break;
      }

      await interaction.update({
        embeds: [createHelpEmbed(currentPage, interaction.user)], // Gunakan interaction.user
        components: [buttons],
      });
    });

    collector.on("end", () => {
      buttons.components.forEach((button) => button.setDisabled(true));
      helpMessage.edit({ components: [buttons] });
    });
  },
  rob: async (message, args) => {
    const userMention = message.mentions.users.first();
    if (!userMention) {
      return message.reply("Please mention a user to rob.");
    }
    try {
      return await dataManager.robUser(message.author.id, userMention, message);
    } catch (error) {
      console.error("Error in rob command:", error);
      const errorMsg = await message.channel.send(
        "An error occurred while robbing the user."
      );
      setTimeout(() => errorMsg.delete().catch(console.error), 5000);
    }
  },
  botinfo: async (message) => {
    // Get guild count
    const guildCount = client.guilds.cache.size;

    // Get total member count across all guilds
    const totalMembers = client.guilds.cache.reduce(
      (acc, guild) => acc + guild.memberCount,
      0
    );

    // Get registered users count
    const registeredUsers = Object.keys(dataManager.users).length;

    // Calculate total balance across all users
    const totalEconomy = Object.values(dataManager.users).reduce(
      (acc, user) => acc + user.balance,
      0
    );

    // Get uptime
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime % 60);

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    // Fetch the full bot user to get banner
    const botUser = await client.users.fetch(client.user.id, { force: true });

    const infoEmbed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("🤖 BOT Information")
      .setThumbnail(client.user.displayAvatarURL({ size: 4096 }))
      // Set banner if exists
      .setImage(
        botUser.bannerURL({ size: 4096 }) ||
          "https://cdn.discordapp.com/attachments/1234567890/default-banner.png" // Ganti dengan URL banner default jika bot tidak punya banner
      )
      .addFields(
        {
          name: "📊 Bot Statistics",
          value: `**Username:** ${client.user.username}
               **ID:** ${client.user.id}
               **Created:** ${client.user.createdAt.toLocaleDateString()}
               **Developer:** ${
                 (await client.users.fetch(config.ownerId[0])).username
               }
               **Node.js:** ${process.version}
               **Banner:** ${botUser.banner ? "✅" : "❌"}
               **Verified:** ${client.user.verified ? "✅" : "❌"}
               **Bot Public:** ${client.user.bot ? "✅" : "❌"}`,
          inline: false,
        },
        {
          name: "🌐 Network Statistics",
          value: `**Servers:** ${guildCount.toLocaleString()}
               **Total Members:** ${totalMembers.toLocaleString()}
               **Registered Users:** ${registeredUsers.toLocaleString()}
               **Total Economy:** ${formatBalance(totalEconomy)}
               **Ping:** ${client.ws.ping}ms
               **Shards:** ${
                 client.shard ? `✅ (${client.shard.count})` : "❌"
               }`,
          inline: false,
        },
        {
          name: "⚙️ System Information",
          value: `**Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s
               **Memory Usage:** ${memoryUsedMB}MB / ${totalMemoryMB}MB
               **Platform:** ${process.platform}
               **Architecture:** ${process.arch}
               **Process ID:** ${process.pid}`,
          inline: false,
        },
        {
          name: "🔗 Links",
          value: `• [Invite Bot](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot)
                • [Community Server](https://discord.gg/ARsVsfjtqA)
                • [Developer Website](https://www.irfanks.site/)`,
          inline: false,
        }
      )
      .setFooter({
        text: `Requested by ${message.author.tag} | Bot Version 1.0.0`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return message.reply({ embeds: [infoEmbed] });
  },
  ownerinfo: async (message) => {
    const owner = await dataManager.getUserProfile(config.ownerId[0], client);
    if (!owner) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    const ownerHelpEmbed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("👤 BOT Owner Information")
      .setThumbnail(owner.avatar)
      .addFields({
        name: "Discord Information :",
        value: `**Username:** ${owner.username},
                  **ID:** ${owner.id},
                  **Account Created:** ${owner.createdAt.toLocaleDateString()}
                  **Personal Site : [Click Here](https://www.irfanks.site/)**
                  **Github : [Click Here](https://github.com/irfankurniawansuthiono)**`,
      })
      .setFooter({ text: "Nanami Owner Info" })
      .setTimestamp();

    return message.reply({ embeds: [ownerHelpEmbed] });
  },
  rank: async (message) => {
    const sortedUsers = Object.entries(dataManager.users)
      .sort(([, a], [, b]) => b.balance - a.balance)
      .slice(0, 10);

    const leaderboard = await Promise.all(
      sortedUsers.map(async ([userId, user], index) => {
        const discordUser = await client.users.fetch(userId);
        return `${index + 1}. ${discordUser.username}: ${formatBalance(
          user.balance
        )}`;
      })
    );

    const leaderboardEmbed = new EmbedBuilder()
      .setTitle("Top 10 Players")
      .setDescription(leaderboard.join("\n"))
      .setColor("#FFD700");

    return message.reply({ embeds: [leaderboardEmbed] });
  },
  giveowner: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;

    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
      return message.reply(`Usage: ${prefix}giveowner <amount>`);
    }

    if (
      amount >
      1000000000000000000000000000000000000000000000000000000000000000000
    ) {
      return message.reply(`You can't give that much money!`);
    }

    try {
      const updatedUser = await dataManager.giveOwnerMoney(
        message.author.id,
        amount
      );

      const ownerEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("💰 Owner Bonus Added!")
        .setDescription(
          `Successfully added $${amount.toLocaleString()} to your account!`
        )
        .addFields(
          {
            name: "New Balance",
            value: `$${updatedUser.balance.toLocaleString()}`,
            inline: true,
          },
          {
            name: "Added Amount",
            value: `$${amount.toLocaleString()}`,
            inline: true,
          }
        )
        .setTimestamp();

      return message.reply({ embeds: [ownerEmbed] });
    } catch (error) {
      console.error("Error in giveowner command:", error);
      return message.reply("An error occurred while processing the command.");
    }
  },
  give: async (message, args) => {
    const targetUser = message.mentions.users.first();
    const amount = parseInt(args[2]); // Changed to args[2] because args[1] will be the mention

    // Basic input validation
    if (!targetUser || !amount || amount <= 0) {
      return message.reply(`Usage: ${prefix}give <@user> <amount>`);
    }

    // Can't give money to yourself
    if (targetUser.id === message.author.id) {
      return message.reply("You can't give money to yourself!");
    }

    try {
      const result = await dataManager.giveMoney(
        message.author.id,
        targetUser.id,
        amount
      );

      const giveEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("💸 Money Transfer Successful!")
        .setDescription(
          `${message.author.username} gave ${targetUser.username} some money!`
        )
        .addFields(
          {
            name: "Amount Transferred",
            value: `$${amount.toLocaleString()}`,
            inline: true,
          },
          {
            name: `${message.author.username}'s New Balance`,
            value: `$${result.fromUser.balance.toLocaleString()}`,
            inline: true,
          },
          {
            name: `${targetUser.username}'s New Balance`,
            value: `$${result.toUser.balance.toLocaleString()}`,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({ text: "Money Transfer System" });

      return message.reply({ embeds: [giveEmbed] });
    } catch (error) {
      if (error.message === "Target user does not have an account!") {
        return message.reply(
          `${targetUser.username} needs to register first! Tell them to use ${prefix}register`
        );
      }
      if (error.message === "Insufficient balance!") {
        return message.reply("You don't have enough money for this transfer!");
      }

      console.error("Error in give command:", error);
      return message.reply("An error occurred while processing the transfer.");
    }
  },
  announcement: async (message, args) => {
    // Cek permission
    if(message.author.id !== config.ownerId[0]) return message.reply("❌ You don't have permission to use this command!");
    // Cek jika tidak ada pesan yang akan diumumkan
    if (!args.length) {
      return message.reply("❌ Please provide an announcement message!");
    }

    // Ambil pesan announcement
    const announcementMessage = args.slice(1).join(" ");

    // Buat embed untuk pengumuman
    const announcementEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("📢 Pengumuman")
      .setDescription(announcementMessage)
      .setTimestamp()
      .setFooter({
        text: `Diumumkan oleh ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      });

    // Kirim status awal
    const statusMessage = await message.channel.send(
      "📤 Mengirim pengumuman..."
    );

    let successCount = 0;
    let failCount = 0;

    // Iterate melalui semua server
    try {
      for (const guild of message.client.guilds.cache.values()) {
        try {
          // Cari channel yang cocok untuk pengumuman
          const channel = guild.channels.cache.find(
            (channel) =>
              channel.type === 0 && // 0 adalah GUILD_TEXT
              channel
                .permissionsFor(guild.members.me)
                .has(["SendMessages", "ViewChannel"])
          );

          if (channel) {
            //tag everyone
            await channel.send({ embeds: [announcementEmbed] });
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Gagal mengirim ke server ${guild.name}:`, error);
          failCount++;
        }
      }

      // Update status akhir
      const totalServers = message.client.guilds.cache.size;
      await statusMessage.edit(
        `✅ Pengumuman telah dikirim!\n\n` +
          `📊 Statistik:\n` +
          `- Berhasil: ${successCount} server\n` +
          `- Gagal: ${failCount} server\n` +
          `- Total server: ${totalServers}`
      );
    } catch (error) {
      console.error("Kesalahan saat mengirim pengumuman:", error);
      await statusMessage.edit(
        "❌ Terjadi kesalahan saat mengirim pengumuman."
      );
    }
  },
  take: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    const targetUser = message.mentions.users.first();
    const amount = parseInt(args[2]); // Changed to args[2] because args[1] will be the mention

    // Basic input validation
    if (!targetUser || !amount || amount <= 0) {
      return message.reply(`Usage: ${prefix}take <@user> <amount>`);
    }

    // Can't take money from yourself
    if (targetUser.id === message.author.id) {
      return message.reply("You can't take money from yourself!");
    }

    try {
      const result = await dataManager.takeMoney(
        message.author.id,
        targetUser.id,
        amount
      );

      const takeEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("💸 Money Transfer Successful!")
        .setDescription(
          `${message.author.username} took ${targetUser.username} some money!`
        )
        .addFields(
          {
            name: "Amount Transferred",
            value: `$${amount.toLocaleString()}`,
            inline: true,
          },
          {
            name: `${message.author.username}'s New Balance`,
            value: `$${result.fromUser.balance.toLocaleString()}`,
            inline: true,
          },
          {
            name: `${targetUser.username}'s New Balance`,
            value: `$${result.toUser.balance.toLocaleString()}`,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({ text: "Money Transfer System" });

      return message.reply({ embeds: [takeEmbed] });
    } catch (error) {
      if (error.message === "Target user does not have an account!") {
        return message.reply(
          `${targetUser.username} needs to register first! Tell them to use ${prefix}register`
        );
      }
      if (error.message === "Insufficient balance!") {
        return message.reply(
          `${targetUser} don't have enough money for this transfer!`
        );
      }

      console.error("Error in take command:", error);
      return message.reply("An error occurred while processing the transfer.");
    }
  },
  say: async (message, args) => {
    try {
      await message.delete();
      if (!ownerHelperFirewall(message.author.id, message)) return;
      const text = args.slice(1).join(" ");

      if (!text) {
        return message.reply("Please provide a message to send!");
      }

      await message.channel.send(text);
    } catch (error) {
      console.error("Error in say command:", error);
      return message.reply("An error occurred while processing the command.");
    }
  },

  sendto: async (message, args) => {
    // Delete the original command message for cleanliness
    try {
      await message.delete();
    } catch (error) {
      console.error("Couldn't delete command message:", error);
    }
    if (!ownerHelperFirewall(message.author.id, message)) return;
    // Check if there are enough arguments
    if (args.length < 2) {
      return message.channel.send(
        `Usage: ${prefix}say <#channel/@user> <message>`
      );
    }

    // Get mentioned channel or user
    const targetChannel = message.mentions.channels.first();
    const targetUser = message.mentions.users.first();
    const text = args.slice(2).join(" ");

    if (!text) {
      return message.channel.send("Please provide a message to send!");
    }

    try {
      if (targetChannel) {
        // Send to mentioned channel
        await targetChannel.send(text);
      } else if (targetUser) {
        try {
          // Send DM to mentioned user
          await targetUser.send(text);
        } catch (error) {
          console.error("Error sending DM:", error);
          if (error.code === 50007) {
            return message.channel.send(
              "Failed to send the message. Make sure I have the required permissions!"
            );
          }
        }
      } else {
        // Send to current channel
        await message.channel.send(text);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      await message.channel.send(
        "Failed to send the message. Make sure I have the required permissions!"
      );
    }
  },
  daily: (message) => {
    const setCD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();
    const lastDaily = dataManager.users[message.author.id].lastDaily;
    if (lastDaily && now - lastDaily < setCD) {
      const timeLeft = lastDaily + setCD - now;
      return message.reply(
        `You can claim your daily reward again in ${formatClockHHMMSS(
          timeLeft
        )}`
      );
    } else {
      const moneyRandom = Math.floor(Math.random() * 1000) + 1;
      dataManager.updateBalance(message.author.id, moneyRandom);
      message.reply(`You have claimed your daily reward of $${moneyRandom}!
        new balance: $${new Intl.NumberFormat("en-US").format(
          dataManager.users[message.author.id].balance
        )} `);
    }
    dataManager.users[message.author.id].lastDaily = now;
  },
  sc:async (message) => {
    // click this button to direct github
    const button = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("Click Me")
      .setURL("https://github.com/irfankurniawansuthiono/js-discord-game-bot");
    message.reply({
      content: "GitHub Repository\nDon't Forget To 🌟 The Repository!",
      components: [new ActionRowBuilder().addComponents(button)],
    });
    },
  resetplayer: async (message) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    try {
      const userId = message.mentions.users.first();
      if (!userId) return message.reply("Please mention a user to reset!");
      if (userId.id === config.ownerId[0])
        return message.reply("You cannot reset the owner of the bot!");
      await dataManager.resetPlayer(userId.id);
      return message.reply(`Player ${userId} has been reset.`);
    } catch (error) {
      console.error("Error in resetplayer command:", error);
      return message.reply("An error occurred while processing the command.");
    }
  },
};

// Event Handlers
const player = new Player(client);
client.once("ready", async () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  // Configure player and load extractors
  await player.extractors.loadMulti(DefaultExtractors);
  player.extractors.register(YoutubeiExtractor, {});

  player.events.on('emptyChannel', (queue) => {
    // Emitted when the voice channel has been empty for the set threshold
    // Bot will automatically leave the voice channel with this event
    queue.metadata.send(`Leaving because no vc activity for the past 5 minutes`);
  });
  // player.events.on("debug", async (queue, message) => {
  //   // Emitted when the player queue sends debug info
  //   // Useful for seeing what state the current queue is at
  //   console.log(`Player debug event: ${message}`);
  // });
  // Set up global player event listeners
  player.events.on("playerError", (queue, error) => {
    console.error("Player error:", error);
    if (queue.metadata.channel) {
      // send the song title
      queue.metadata.channel.send(`❌ Error playing music: ${error.message} - ${error.cause}`);
    }
  });

  player.events.on("error", (queue, error) => {
    console.error("Error event:", error);
    if (queue.metadata.channel) {
      queue.metadata.channel.send(`❌ Error: ${error.message}`);
    }
  });

  // finish playing music
  player.events.on("emptyQueue", (queue) => {
    if (queue.metadata.channel) {
      queue.metadata.channel.send("💽 finished playing queue");
    }
  });
  player.events.on("playerStart", (queue, track) => {
    if (queue.metadata.channel) {
      queue.metadata.channel.send(`🎶 Now playing: ${track.title}`);
    }
  });

  player.events.on("disconnect", (queue) => {
    if (queue.metadata.channel) {
      queue.metadata.channel.send("👋 Disconnected from voice channel");
    }
  });

  client.user.setPresence({
    activities: [
      {
        name: `${prefix}help`,
        type: ActivityType.Listening,
      },
    ],
    status: "online",
  });
});

// this is the entrypoint for discord-player based application

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  // jika bot di tag dan di reply dia akan menjalankan fungsi AI
  const getMessageMention = message.mentions.users.first();
  const getBotReplied =
    message.reference && message.reference.messageId === client.user.id;
  if (getMessageMention === client.user || getBotReplied) {
    message.channel.sendTyping();
    const prompt = message.content
      .slice(message.content.indexOf(">") + 1)
      .trim();
    await apiManagement.aiResponse(message, prompt);
  }

  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args[0].toLowerCase();

  if (commands[command]) {
    try {
      await commands[command](message, args);
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
      message.reply("An error occurred while executing the command.");
    }
  }
});

client.login(config.token);
