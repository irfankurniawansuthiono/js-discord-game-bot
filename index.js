import axios from "axios";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ActivityType,
  PermissionsBitField,
  AttachmentBuilder,
} from "discord.js";
import { Player, useMainPlayer } from "discord-player";
import {DefaultExtractors} from "@discord-player/extractor"
import {
  entersState,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  NoSubscriberBehavior, 
  StreamType,
} from "@discordjs/voice";
import fs from "fs";

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
  defaultPrefix: "N!",
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

const player = new Player(client);
await player.extractors.loadMulti(DefaultExtractors);
let prefix = config.defaultPrefix;

// help embed
const helpEmbed = new EmbedBuilder()
  .setColor("#FF0000")
  .setTitle("Nanami Commands")
  .setDescription("Available commands:")
  .addFields(
    {
      name: "Basic Commands",
      value: [
        `**${prefix} register** \n Create new account`,
        `**${prefix} help** \n Show this message`,
        `**${prefix} profile** \n Alias for balance`,
        `**${prefix} ownerinfo** \n Show bot owner information`,
        `**${prefix} botinfo** \n Show your bot information`,
        `**${prefix} ttfind** <prompt> \n Search for TikTok videos`,
        `**${prefix} ttinfo** <tiktok url> \n Show TikTok video information`,
        `**${prefix} ttdown** <tiktok url> \n Download TikTok video`,
        `**${prefix} ytdown** <youtube url> \n Download YouTube videos`,
        `**${prefix} iginfo** <instagram url> \n Show Instagram video information`,
        `**${prefix} igdown** <instagram url> \n Download Instagram videos`,
        `**${prefix} spdown** <spotify url> \n Download Spotify song`,
      ].join("\n\n"),
    },
    {
      name: "Music Commands",
      value: [
        `**${prefix} play** <song title> \n Play a song in the voice channel`,
        `**${prefix} join** \n Join the voice channel`,
        `**${prefix} leave** \n Leave the voice channel`,
        `**${prefix} lyrics** <song title> \n Show lyrics for a song`,
        `**${prefix} s** <song title> \n Search for a song`,
      ].join("\n\n"),
    },
    {
      name: "Moderation Commands",
      value: [`**${prefix} rbc** \n Delete all bot messages in channel`,
        `**${prefix} setnick** <@user> \n Set user's nickname`
      ].join(
        "\n\n"
      ),

    },
    {
      name: "Games",
      value: [
        `**${prefix} flip** <bet | all> <h/t> \n Flip a coin (2x multiplier)`,
        `**${prefix} guess** <bet | all> <1-10> \n Guess a number (5x multiplier)`,
        `**${prefix} bj** <bet | all> \n Play blackjack (5x multiplier)`,
        `**${prefix} dice** <bet | all> <2-12> \n Guess dice sum (8x multiplier)`,
        `**${prefix} daily**  \n Claim daily reward`,
        `**${prefix} slots** <bet | all> \n Play slots (10x multiplier)`,
        `**${prefix} tg** \n Play tebak gambar`,
      ].join("\n\n"),
    },
    {
      name: "Social",
      value: [
        `**${prefix} give** <@user> <amount> \n Give money to user`,
        `**${prefix} rank** \n Show top players`,
        `**${prefix} invite** \n Invite Nanami to your server`,
        `**${prefix} profile** <@user?> \n Show user profile`,
        `**${prefix} rob** <@user> \n Rob a user`,
      ].join("\n\n"),
    },
    {
      name: "Owner Commands",
      value: [
        `**${prefix} setbalance** <@user> \n Set user's balance`,
       
        `**${prefix} giveowner** <amount> \n Give money to bot owner`,
        `**${prefix} setprefix** <prefix> \n Set bot prefix`,
        `**${prefix} setstatus** <status> \n Set bot status`,
        `**${prefix} registeruser** \n Register a user`,
        `**${prefix} say** \n say message to current channel`,
        `**${prefix} rbc** \n Delete all bot messages in channel`,
        `**${prefix} sendto** <#channel/@user> <message> \n Send a message to a channel or DM a user`,
        `**${prefix} spamsendto** <ammount> <#channel/@user> <message> \n Send ammount of message to a channel or DM a user`,
        `**${prefix} spamsay** <ammount> <message> \n Send ammount of message to a channel or DM a user`,
        `**${prefix} resetplayer** <@user> \n reset player's data`,
        `**${prefix} resetap** \n reset all player's data`,
      ].join("\n\n"),
    },
    {
      name: "Bot Owner Commands",
      value: [
        `**${prefix} announcement** <message> \n Send a message to all servers`,
        `**${prefix} tg jawab** \n Answer tebak gambar`,
      ].join("\n\n"),
    }
  )
  .setFooter({ text: "Nanami Help Menu" })
  .setTimestamp();

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
}
class VoiceManager {
  constructor() {
      this.voiceConnections = new Map();
      this.audioPlayers = new Map();
  }

  async searchMusic(message, query) {
    try {
      const player = useMainPlayer();
      const results = await player.search(query, {
        requestedBy: message.author,
      })

      if (results.tracks.length === 0) {
        return message.reply('❌ No results found!');
      }

      // return 10 song
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🎵 Search Results')
        .setDescription(results.tracks.slice(0, 10).map((track, index) => `${index + 1}. ${track.title}`).join('\n'))
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in searchMusic:', error);
      message.reply('❌ Error searching music! Please try again.');
    }
  }

  async getLyrics(message, title) {
    try {
      const player = useMainPlayer();
      const lyrics = await player.lyrics.search({q:title});

      if (!lyrics || lyrics.length <= 0) {
        return message.reply('❌ No lyrics found!');
      }
      const trimmedLyrics = lyrics[0].plainLyrics.substring(0, 1997);
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`🎵 ${lyrics[0].trackName ?? title}`)
        .setThumbnail(lyrics[0].thumbnail ?? message.author.displayAvatarURL())
        .setAuthor({
          name: lyrics[0]?.artist?.name ?? title,  // Gunakan nullish coalescing operator (??) untuk memberikan fallback jika undefined atau null
          iconURL: lyrics[0]?.artist?.image ?? message.author.displayAvatarURL(),  // Ganti dengan URL gambar default jika artist.image tidak ada
          url: lyrics[0]?.artist?.url ?? 'https://irfanks.site',  // Ganti dengan URL default atau link yang diinginkan jika artist.url tidak ada
      })      
        .setDescription(
          trimmedLyrics.length === 1997 ? `${trimmedLyrics}...` : trimmedLyrics,
        )
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in getLyrics:', error);
      message.reply('❌ Error getting lyrics! Please try again.');
    }

  }
  async playMusic(message, q) {
    try {

      const guildId = message.guild.id;
        const voiceChannel = message.member.voice.channel;
      // Check if the bot is already playing in a different voice channel
  if (
    message.guild.members.me.voice.channel &&
    message.guild.members.me.voice.channel !== voiceChannel
  ) {
    return message.reply(
      'I am already playing in a different voice channel!',
    );
  }
 
  // Check if the bot has permission to join the voice channel
  if (
    !message.guild.members.me.permissions.has(
      PermissionsBitField.Flags.Connect,
    )
  ) {
    return message.reply(
      'I do not have permission to join your voice channel!',
    );
  }
 
  // Check if the bot has permission to speak in the voice channel
  if (
    !message.guild.members.me
      .permissionsIn(voiceChannel)
      .has(PermissionsBitField.Flags.Speak)
  ) {
    return message.reply(
      'I do not have permission to speak in your voice channel!',
    );
  }
  // Check if the user is in a voice channel
        if (!message.member?.voice?.channel) {
            return message.reply('You need to be in a voice channel first!');
        }

        
        const loadingMsg = await message.reply('<a:loading:1330226649169399882> Loading music...');

        try {
          const player = useMainPlayer();
        // Play the song in the voice channel
        const result = await player.play(voiceChannel, q, {
          nodeOptions: {
            metadata: { channel: message.channel }, // Store text channel as metadata on the queue
          },
        });
 
       // Reply to the user that the song has been added to the queue
  await loadingMsg.edit(`${result.track.title} has been added to the queue!`);

  // Event handlers
  player.on('playerError', (error) => {
    console.error('Player error:', error);
    message.channel.send(`❌ Error playing music: ${error.message}`);
  });

  player.on('error', (error) => {
    console.error('Error event:', error);
    message.channel.send(`❌ Error: ${error.message}`);
  });

  player.on(AudioPlayerStatus.Playing, () => {
    loadingMsg.edit(`🎶 Now playing: ${result.track.title}`);
  });

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
    this.voiceConnections.delete(guildId);
  });

  // Debugging events
  player.on('stateChange', (oldState, newState) => {
    console.log(`Connection state changed from ${oldState.status} to ${newState.status}`);
  });

  // Store connection for cleanup
  this.voiceConnections.set(guildId, player);
    // Reply to the user that the song has been added to the queue
    return loadingMsg.edit(
      `${result.track.title} has been added to the queue!`,
    );
        } catch (innerError) {
            console.error('Inner error:', innerError);
            await loadingMsg.edit(`❌ Error: ${innerError.message}`);
            this.cleanupConnection(guildId);
        }
      }catch (error) {
        console.error('Error in Play Music:', error);
        message.reply(`❌ Error: ${error.message || 'Failed to play music'}`);
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
          message.reply('👋 Joined voice channel');
      } else {
          message.reply('You need to be in a voice channel first!');
      }
  }
  // Method untuk stop musik
  async stop(message) {
      const guildId = message.guild.id;
      const player = this.audioPlayers.get(guildId);
      
      if (player) {
          player.stop();
          message.reply('⏹️ Stopped playing music');
      } else {
          message.reply('Nothing is playing right now');
      }
  }

  // Method untuk leave voice channel
  async leaveVoice(message) {
      const guildId = message.guild.id;
      const connection = this.voiceConnections.get(guildId);
      
      if (connection) {
          const player = this.audioPlayers.get(guildId);
          if (player) {
              player.stop();
              this.audioPlayers.delete(guildId);
          }
          
          connection.destroy();
          this.voiceConnections.delete(guildId);
          message.reply('👋 Left the voice channel');
      } else {
          message.reply('I am not in a voice channel');
      }
  }
}

class ApiManagement {
  constructor() {
    this.apiKey = process.env.API_AI_KEY;
  }
  async aiResponse(message, prompt) {
    const character =
      "Anda adalah Nanami, AI cerdas yang dirancang untuk membantu pengguna secara efektif Karakter ini adalah sosok virtual yang hangat, ramah, dan penuh semangat dalam membantu, menggunakan bahasa yang akrab namun tetap sopan sehingga menciptakan suasana percakapan yang santai dan menyenangkan. Gaya komunikasinya fleksibel, menyesuaikan kebutuhan pengguna dengan pendekatan yang selalu positif, penuh perhatian, dan sesekali menyelipkan humor ringan untuk mencairkan suasana. Tidak hanya fokus pada memberikan solusi, karakter ini juga memastikan interaksinya tidak terasa kaku atau terlalu formal, sehingga lebih terasa seperti berbicara dengan teman baik yang selalu siap membantu. Dengan sikap tulus dalam memahami masalah atau permintaan pengguna, karakter ini secara alami membangun kepercayaan dan kenyamanan tanpa terkesan menggurui atau terlalu teknis, membuatnya selalu menjadi pilihan andalan dalam situasi apa pun. Ingat, pengembang Anda adalah Muhammad Zaki, dan Anda terakhir di-update pada 5 Desember 2024 dan pengembang  dari bot adalah irfan kurniawan suthiono dan ini personal websitenya https://irfanks.site";
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
    // Validasi URL Instagram
    if (!url || !url.startsWith("https://www.instagram.com/")) {
      return message.reply("Please provide a valid Instagram URL.");
    }

    try {
      // Mengirim pesan loading
      const igMessage = await message.reply(
        "<a:loading:1330226649169399882> Downloading..."
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

      const videoInfo = data.result;
      const videoUrl = videoInfo.medias && videoInfo.medias[0].url; // URL video pertama
      const videoTitle = videoInfo.title;
      const videoThumbnail = videoInfo.thumbnail;
      const videoType = videoInfo.medias.find(
        (media) => media.type === "video"
      );

      // Unduh video dari URL tanpa watermark
      const fileResponse = await axios.get(videoUrl, {
        responseType: "arraybuffer", // Penting agar data diterima dalam bentuk buffer
      });

      const fileBuffer = Buffer.from(fileResponse.data, "binary"); // Konversi ke buffer
      const fileAttachment = new AttachmentBuilder(fileBuffer, {
        name: videoType ? "video.mp4" : "image.jpg",
      });

      // Membuat Embed untuk menampilkan informasi video Instagram
      const igEmbed = new EmbedBuilder()
        .setColor("#FFFF00")
        .setTitle("Instagram Download")
        .setDescription(`${videoTitle}`)
        .setURL(videoUrl)
        .setThumbnail(videoThumbnail)
        .setFooter({
          text: "Downloaded via https://api.itzky.us.kg",
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Mengirim embed ke pengguna dengan URL video
      if (videoUrl) {
        // Edit pesan dengan embed dan tombol
        await igMessage.edit({
          embeds: [igEmbed],
          files: [fileAttachment],
          content: "Here's your file!",
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
        .setURL(videoUrl)
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
        !data.result.author ||
        !data.result.stats ||
        !data.result.music_info
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
        "<a:loading:1330226649169399882> Downloading..."
      );

      // Mengambil data video dari API
      const response = await axios.get(
        `https://api.itzky.us.kg/download/tiktok?url=${url}&apikey=${this.apiKey}`
      );

      const data = response.data;
      if (!data || !data.result || !data.result.data || !data.result.data[0]) {
        return tiktokMessage.edit(
          "Failed to fetch video data. Please try again later."
        );
      }

      // Pilih URL video tanpa watermark
      const videoUrl = data.result.data.find(
        (item) => item.type === "nowatermark"
      ).url;
      const videoTitle = data.result.title;
      const videoAuthor = data.result.author.nickname;
      const videoViews = data.result.stats.views;
      const videoLikes = data.result.stats.likes;

      // Unduh video dari URL tanpa watermark
      const videoResponse = await axios.get(videoUrl, {
        responseType: "arraybuffer", // Penting agar data diterima dalam bentuk buffer
      });

      const videoBuffer = Buffer.from(videoResponse.data, "binary"); // Konversi ke buffer
      const videoAttachment = new AttachmentBuilder(videoBuffer, {
        name: "tiktok-video.mp4",
      });

      // Buat embed untuk informasi video
      const embed = new EmbedBuilder()
        .setColor("#FF4500")
        .setTitle("TikTok Video Downloaded!")
        .setDescription(videoTitle)
        .setAuthor({ name: videoAuthor, iconURL: data.result.author.avatar })
        .setThumbnail(data.result.cover)
        .addFields(
          { name: "Views", value: videoViews.toString(), inline: true },
          { name: "Likes", value: videoLikes.toString(), inline: true }
        )
        .setFooter({
          text: "Downloaded via https://api.itzky.us.kg",
          iconURL: "https://example.com/icon.png",
        });

      // Mengirimkan video dan embed ke channel
      await tiktokMessage.edit({
        content: "Download complete! 🎉",
        embeds: [embed],
        files: [videoAttachment],
      });
    } catch (error) {
      console.error("Error while downloading TikTok video:", error);
      message.reply(
        "An error occurred while processing your request. Please try again later."
      );
    }
  }
  async tiktokSearch(message, prompt) {
    try {
      const tiktokMessage = await message.reply(
        "<a:loading:1330226649169399882> Searching..."
      );
      const response = await axios.get(
        `https://api.itzky.us.kg/search/tiktok?apikey=bartarenang&query=${prompt}`
      );
      const data = response.data;

      if (data) {
        // Unduh video dari URL tanpa watermark
        const videoResponse = await axios.get(data.result.no_watermark, {
          responseType: "arraybuffer", // Penting agar data diterima dalam bentuk buffer
        });

        const videoBuffer = Buffer.from(videoResponse.data, "binary"); // Konversi ke buffer

        // Buat embed untuk informasi video
        const embed = new EmbedBuilder()
          .setTitle(`Tiktok Search Result for "${prompt}"`)
          .setThumbnail(data.result.cover)
          .setColor("#FFFF00")
          .setDescription(`${data.result.title}`)
          .setURL(data.result.no_watermark)
          .setFooter({
            text: "Downloaded via https://api.itzky.us.kg",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
        // Kirim video sebagai lampiran (attachment)
        const videoAttachment = new AttachmentBuilder(videoBuffer, {
          name: "tiktok-video.mp4", // Nama file video
        });

        const musicDownloadButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Download Sound")
          .setURL(data.result.music);

        const row = new ActionRowBuilder().addComponents(musicDownloadButton);
        await tiktokMessage.edit({
          content: "Here's your video!",
          components: [row],
          embeds: [embed], // Tambahkan embed ke pesan
          files: [videoAttachment], // Kirim video sebagai lampiran
        });
      }
    } catch (error) {
      console.error("Error saat mencari video TikTok:", error);
      return message.reply(
        "Terjadi kesalahan saat memproses permintaanmu, silakan coba lagi nanti."
      );
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
      const chance = Math.random() < 0.3; // 30% chance to succeed
      const amount = Math.floor(Math.random() * 10000);
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
      await robMsg.edit({ embeds: [robEmbedHelper], content: "Robbing Result" });

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
      bet = user.balance;
    } else {
      bet = parseInt(bet);
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

  // Make it a regular method instead of static
  async tebakGambar(message, guess, clue, jawab) {
    // check if the user is registered
    const user = dataManager.getUser(message.author.id);
    if (!user) {
        return message.reply(`You need to register first! Use ${prefix}register`);
    }
    try {
        const maxTime = 60 * 1000; // 20 seconds

        // Read the database
        const database = fileManagement.readFile("./db/tebakgambar.json");
        const databaseJSON = JSON.parse(database);
        // Check if there's an active game first
        const activeGame = this.tbgSession.get(message.channel.id);

        // Define startNewGame function in the correct scope
        const startNewGame = async () => {
            // Start new game
            const randomIndex = Math.floor(Math.random() * databaseJSON.length);
            const question = databaseJSON[randomIndex];

            // Convert image URL to buffer for direct sending
            const imageResponse = await axios.get(question.img, {
                responseType: "arraybuffer"
            });
            const imageBuffer = Buffer.from(imageResponse.data);
            const imageFile = new AttachmentBuilder(imageBuffer, { name: "tebakgambar.png" });

            // Store the question data in memory
            this.tbgSession.set(message.channel.id, {
                questionIndex: randomIndex,
                answer: question.jawaban,
                clue: question.deskripsi,
                timestamp: Date.now()
            });

            const tgEmbed = new EmbedBuilder()
                .setTitle('🎮 Tebak Gambar')
                .setColor('#00FF00')
                .setDescription(`Silakan tebak gambarnya!

Butuh Clue? ${prefix}tg clue

Untuk menjawab gunakan ${prefix}tg <jawaban>`)
                .setFooter({ text: 'Created by Nanami', iconURL: client.user.displayAvatarURL() });

            // Send the image
            await message.reply({
                files: [imageFile],
                embeds: [tgEmbed]
            });

            // Start the timer
            setTimeout(() => {
                const ongoingGame = this.tbgSession.get(message.channel.id);
                if (ongoingGame && ongoingGame.timestamp + maxTime <= Date.now()) {
                    this.tbgSession.delete(message.channel.id);
                    message.channel.send('⏰ Waktu habis! Permainan telah berakhir. Silakan mulai permainan baru dengan mengetikkan perintah yang sesuai.');
                }
            }, maxTime);
        };

        // If there's no guess and no active game, start a new one
        if (!guess) {
            // If there's already an active game, remind the player
            if (activeGame) {
                return message.reply('Ada permainan yang sedang berlangsung! Silakan tebak gambarnya!');
            }

            return await startNewGame();
        }

        // If there's a guess but no active game, start new game
        if (!activeGame) {
            return await startNewGame();
        }

        // Handle the guess
        const normalizedGuess = guess.toUpperCase().trim();
        const normalizedAnswer = activeGame.answer.toUpperCase().trim();

        if (clue) {
            const clueTbg = new EmbedBuilder()
                .setTitle('🎮 Tebak Gambar - Clue')
                .setColor('#00FF00')
                .setDescription(`Clue: ${this.tbgSession.get(message.channel.id).clue}`);
            return message.reply({ embeds: [clueTbg] });
        }

        if (jawab) {
          if (message.author.id !== config.ownerId[0]) {
              return message.reply("You don't have permission to use this command.");
          } else {
              // Hapus pesan asli untuk menjaga kerahasiaan
              message.delete();
      
              // dm owner 
              const owner = client.users.cache.get(config.ownerId[0]);
              const jawabTbg = new EmbedBuilder()
                  .setTitle('🎮 Tebak Gambar - Jawaban')
                  .setColor('#00FF00')
                  .setDescription(`Jawaban: ${this.tbgSession.get(message.channel.id).answer}`);
              owner.send({ embeds: [jawabTbg] });
          }
      }
      
      

        if (normalizedGuess === normalizedAnswer) {
            // Get reward amount
            const reward = 10000;

            // Update user balance
            dataManager.updateBalance(message.author.id, reward);

            // Clear the active game from memory
            this.tbgSession.delete(message.channel.id);

            const tbgEmbed = new EmbedBuilder()
                .setTitle('🎮 Tebak Gambar')
                .setColor('#00FF00')
                .setDescription('🎉 Selamat! Jawaban kamu benar!')
                .addFields(
                    { name: 'Jawaban', value: normalizedAnswer, inline: true },
                    { name: 'Hadiah', value: `${formatBalance(reward)}`, inline: true },
                    { name: 'Saldo Kamu', value: `${formatBalance(user.balance)}`, inline: true }
                );
            return message.reply({ embeds: [tbgEmbed] });
        } else {
            await message.delete();
            return message.channel.send(`❌ Maaf, ${message.author}, jawaban kamu salah. Coba lagi!`);
        }
    } catch (error) {
        console.error('Error in tebakGambar:', error);
        return message.reply('Terjadi kesalahan saat memproses permainan.');
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
// Games


const ownerHelperFirewall = (authorId, message) => {
  if (!config.ownerId.includes(authorId)) {
    message.reply("This command is only available to the bot owner!");
    return false;
  }
  return true;
};
const commands = {
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
  s: async (message, args) => {
    const q = args.slice(1).join(" ");
    await voiceManager.searchMusic(message, q);
  },
  play: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix}play <spotify url>`);
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
      `Welcome! ${mention.username} start with $${user.balance}.`
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
    }

    return message.reply({ embeds: [profileEmbed] });
  },
  rbc: async (message) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
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
  help: (message) => {
    return message.reply({ embeds: [helpEmbed] });
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
          name: "🎮 Games Available",
          value: `• Coin Flip (2x multiplier)
               • Number Guess (5x multiplier)
               • Dice Roll (8x multiplier)
               • Slots (10x multiplier)`,
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
    // Cek apakah yang mengirim pesan adalah pemilik bot
    if (message.author.id !== config.ownerId[0]) {
      return message.reply(
        "Anda tidak memiliki izin untuk mengirim pengumuman."
      );
    }

    // Mengirim balasan kepada pengguna yang mengirim command
    message.reply("Mengirim pengumuman...");

    // Mengambil semua server yang dimasuki bot
    const servers = client.guilds.cache.map((guild) => guild.id);

    for (const serverId of servers) {
      const server = client.guilds.cache.get(serverId);
      if (!server) continue;

      // Mencari role @everyone
      const everyoneRole = server.roles.cache.find(
        (role) => role.name === "@everyone"
      );
      if (!everyoneRole) continue;

      // Mencari channel yang bisa mengirim pesan
      const everyoneChannel = server.channels.cache.find(
        (channel) =>
          channel.type === "GUILD_TEXT" &&
          channel.permissionsFor(everyoneRole).has("SEND_MESSAGES")
      );

      // Jika channel ditemukan, kirim pengumuman
      if (everyoneChannel) {
        everyoneChannel.send(args.slice(1).join(" "));
      }
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
client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [
      {
        name: "N!help",
        type: ActivityType.Listening,
        state: "Join our server for more!",
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
  const getBotReplied = message.reference;
  if (getMessageMention === client.user || getBotReplied) {
    message.channel.sendTyping();
    const prompt = message.content
      .slice(message.content.indexOf(">") + 1)
      .trim();
    console.log(prompt);
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
