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
} from "discord.js";
import {
  Player,
} from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";
import { DefaultExtractors } from "@discord-player/extractor";
import { ApiManagement } from "./ClassFunction/ApiManagement.js";
import { Games } from "./ClassFunction/GamesManagement.js";
import { DataManager } from "./ClassFunction/DataManager.js";
import { DiscordFormat } from "./ClassFunction/DiscordFormat.js";
import { FileManagement } from "./ClassFunction/FileManagement.js";
import { VoiceManager } from "./ClassFunction/VoiceManager.js";
import GuildManagement from "./ClassFunction/GuildManagement.js";
import { pages, config, discordEmotes } from "./config.js";

export const formatClockHHMMSS = (milliseconds) => {
  if (typeof milliseconds !== "number" || milliseconds < 0) {
    throw new Error("Input must be a non-negative number.");
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const formatDate = (timestamp) => new Date(timestamp).toLocaleString();


export const formatBalance = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

// Initialize bot with required intents
export const client = new Client({
  intents: [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
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

// set new class instance
const discordFormat = new DiscordFormat();
const dataManager = new DataManager();
const apiManagement = new ApiManagement();
const voiceManager = new VoiceManager();
const fileManagement = new FileManagement();
const guildManagement = new GuildManagement(client);
const gamesManagement = new Games();
const ownerHelperFirewall = (authorId, message) => {
  if (!config.ownerId.includes(authorId)) {
    message.reply("This command is only available to the bot owner!");
    return false;
  }
  return true;
};

const guildAdmin = (message) => {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    message.reply("You do not have permission to use this command.");
    return false;
  }
  return true;
};


const commands = {
  warninfo: async(message, args) => {
    if(!guildAdmin(message)) return;
    const guildId = message.guild.id;
    const user = message.mentions.users.first();
    if(!user) return message.reply("Please mention a valid user.");
    const userId = user.id;
    await discordFormat.warnInfo(guildId, userId, message);
  },
  warn: async(message, args) => {
    if(!guildAdmin(message)) return;
    const guildId = message.guild.id;
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply("Please mention a valid user.");
    }
    const reason = args.slice(2).join(" ");
    if (!reason) {
      return message.reply("Please provide a reason for the warning.");
    }
    await discordFormat.warnUser(guildId, user, reason, message);
  },
  setwelcome: async (message, args) => {
    try {
        // Cek apakah pengguna memiliki izin admin
        if (!guildAdmin(message)) return;

        // Cek apakah channel disebutkan
        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply("Please mention a valid channel.");
        }
        discordFormat.setWelcome(message.guild.id, channel.id, message);
    } catch (error) {
        console.error("Error setting welcome message channel:", error);
        return message.reply("An error occurred while setting the welcome message channel. Please try again later.");
    }
  },
  volume: (message, args) => {
    const volume = parseInt(args[1]);
    if (isNaN(volume) || volume < 0 || volume > 100) {
      return message.reply("Volume must be a number between 0 and 100.");
    }
    voiceManager.setVolume(message, volume);
  },
  snick:(message, args) => {
    const q = args.slice(1).join(" ");
    apiManagement.stylizeText(message, q);
  },
  vol:async (message, args) => {
      const volume = parseInt(args[1]);
      if (isNaN(volume) || volume < 0 || volume > 100) {
        return message.reply("Volume must be a number between 0 and 100.");
      }
      await voiceManager.setVolume(message, volume);
  },
  bugreport: async (message, args) => {
    if (message.author.id === config.ownerId[0]) {
      return await discordFormat.bugReport(message, args.slice(1).join(" "));
    }
  
    // Set cooldown 1 hour
    const cooldown = 60 * 60 * 1000;
    const userData = dataManager.users[message.author.id] || {};
    const lastUsed = userData.lastBugReport;
  
    if (lastUsed && Date.now() - lastUsed < cooldown) {
      const timeRemaining = cooldown - (Date.now() - lastUsed);
      return message.reply(
        `Please wait ${formatClockHHMMSS(timeRemaining)} before using this command again.`
      );
    }
  
    // Update user data
    if (!dataManager.users[message.author.id]) {
      dataManager.users[message.author.id] = {};
    }
    dataManager.users[message.author.id].lastBugReport = Date.now();
  
    const bug = args.slice(1).join(" ");
    if (!bug) {
      return message.reply(`${discordEmotes.error} Please provide a bug report.`);
    }
  
    await discordFormat.bugReport(message, bug);
  },
  loop: async (message, args) => {
    const option = args[1];
    if (!option) {
      return message.reply(
        `Usage: ${prefix} loop <off | track | queue | autoplay>`
      );
    }
    await voiceManager.loopMusic(message, option);
  },
  q: async (message) => {
    await voiceManager.queueMusic(message);
  },
  karaoke: async (message, args) => {
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
      if (message.author.id !== config.ownerId[0]) {
        return message.reply(
          `${discordEmotes.error} You are not authorized to use this command.`
        );
      }

      // Get the announcement message
      const announcement = args.slice(1).join(" ");
      if (!announcement) {
        return message.reply(
          `${discordEmotes.error} Please provide an announcement message.`
        );
      }

      // Fetch the announcement channel using the correct config property
      const channelId = config.announcementChannelID; // Fixed: Using correct config property

      // Validate channel ID
      if (!channelId) {
        return message.reply(
          `${discordEmotes.error} Configuration error: Missing announcement channel ID.`
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
            `${discordEmotes.error} The specified channel does not exist or is not a text channel.`
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
          `${discordEmotes.error} Failed to access the announcement channel. Please check channel permissions.`
        );
      }
    } catch (error) {
      console.error("Error in 'ga' command:", error);
      await message.reply(
        `${discordEmotes.error} An error occurred while sending the announcement. Please check the console for details.`
      );
    }
  },
  remini: async (message, args) => {
    if (message.attachments.size === 0) {
      return message.reply(
        `${discordEmotes.error} Please upload the image you want to process!`
      );
    }

    // Coba cari attachment tanpa memperhatikan description dulu
    const attachment = message.attachments.find((att) =>
      att.contentType?.startsWith("image/")
    );

    if (!attachment) {
      return message.reply(
        `${discordEmotes.error} Image not found! Make sure:\n` +
          "1. The uploaded file is an image\n" +
          "2. The image format is supported (JPG, PNG, WEBP)"
      );
    }

    // Validate image size (maximum 2MB)
    if (attachment.size > 2 * 1024 * 1024) {
      return message.reply(
        `${discordEmotes.error} Image size is too large! Maximum size is 2MB.`
      );
    }

    // Validate image format
    const validFormats = ["image/jpeg", "image/png", "image/webp"];
    if (!validFormats.includes(attachment.contentType)) {
      return message.reply(
        `${discordEmotes.error} Unsupported image format! Use JPG, PNG, or WEBP.`
      );
    }

    // Jika semua validasi berhasil, proses gambar
    try {
      await apiManagement.remini(message, attachment.url);
    } catch (error) {
      console.error("Remini processing error:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while processing the image. Please try again.`
      );
    }
  },
  tg: async (message, args) => {
    const guess = args.slice(1).join(" ");
    const clue = args[1] === "clue" ? true : false;
    const jawab = args[1] === "jawab" ? true : false;
    await gamesManagement.tebakGambar(message, guess, clue, jawab);
  },
  tben: async (message, args) => {
    const guess = args.slice(1).join(" ");
    const jawab = args[1] === "jawab" ? true : false;
    await gamesManagement.tebakBendera(message, guess, jawab);
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
    if (args.length < 2 || !q)
      return message.reply(`Usage: ${prefix}s <search query>`);
    await voiceManager.searchMusic(message, q);
  },
  sf: async (message, args) => {
    await voiceManager.shuffleMusic(message);
  },
  clearwarns: async (message, args) => {
    if (!guildAdmin(message)) return;
    const userId = message.mentions.users.first();
    const guildId = message.guild.id;
    if (!userId) return message.reply("Please mention a valid user.");
    await discordFormat.clearWarns(guildId,userId,message);
  },
  p: async (message, args) => {
    const q = args.slice(1).join(" ");
    if (args.length < 2 || !q)
      return message.reply(`Usage: ${prefix}p <search query>`);
    await voiceManager.playMusic(message, q);
  },
  play: async (message, args) => {
    if (args.length < 2) {
      return message.reply(`Usage: ${prefix}play <search query or url>`);
    }
    const query = args.slice(1).join(" ");
    await voiceManager.playMusic(message, query);
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
    const getUser = dataManager.getUser(user.id);
    if(!getUser) {
      return message.reply(`${discordEmotes.error} User not found. please register them first!`);
    }
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
    return message.reply(`Welcome! ${mention} start with $${user.balance}.`);
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
    } else if (config.ownerId.includes(isUserMentioned.id)) {
      profileEmbed.setDescription("🎭 **BOT OWNER**").setColor("#FFD700"); // Gold color for owner
    }

    return message.reply({ embeds: [profileEmbed] });
  },
  kick: async (message, args) => {

    // cek permission
    if (!guildAdmin(message)) return
    ;
    if (args.length < 2) { 
      return message.reply(`Usage: ${prefix}kick <@user>`);
    }
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
      return message.reply("Please mention a user to kick.");
    }
    try {
      await discordFormat.kickUser(message, mentionedUser);
    } catch (error) {
      console.error("Error in kick command:", error);
      return message.reply("An error occurred while kicking the user.");
    }
  },
  purge: async (message, args) => {
    if(!guildAdmin(message)) return;
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0 ) {
      return message.reply(`Usage: ${prefix}purge <amount>`);
    }
    if(amount > 1000) {
      return message.reply(`You can't purge that much messages! Max 1000 messages.`);
    }
    try {
      await discordFormat.deleteMessages(message, amount);
    } catch (error) {
      console.error("Error in purge command:", error);
      return message.reply("An error occurred while deleting messages.");
    }
  },
  rbc: async (message) => {
    if (!guildAdmin(message)) return;
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
    if(!guildAdmin(message)) return;
    if(args.length < 3) return message.reply(`Usage: ${prefix}nick <@user> <new nickname>`);
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
    const amount = parseInt(args[2]); 

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
    if (message.author.id !== config.ownerId[0])
      return message.reply(`${discordEmotes.error} You don't have permission to use this command!`);
    // Cek jika tidak ada pesan yang akan diumumkan
    if (!args.length) {
      return message.reply(
        `${discordEmotes.error} Please provide an announcement message!`
      );
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
      "📤 Sending Announcement..."
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
              channel.type === 0 && 
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
        `✅ Announcement has been sent!\n\n` +
          `📊 Statistik:\n` +
          `- Berhasil: ${successCount} server\n` +
          `- Gagal: ${failCount} server\n` +
          `- Total server: ${totalServers}`
      );
    } catch (error) {
      console.error("Error sending announcement:", error);
      await statusMessage.edit(
        `${discordEmotes.error} Terjadi kesalahan saat mengirim pengumuman.`
      );
    }
  },
  nuke: async (message) => {
    if(!guildAdmin(message)) return;
    try {
      await discordFormat.nukeChannel(message);
    } catch (error) {
      console.error("Error in nuke command:", error);
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
  lock: async (message) => {
    if(!guildAdmin(message)) return;
    try {
      await discordFormat.lockChannel(message);
    } catch (error) {
      console.error("Error in lock command:", error);
    }
  },
  unlock: async (message) => {
    if(!guildAdmin(message)) return;
    try {
      await discordFormat.unlockChannel(message);
    } catch (error) {
      console.error("Error in unlock command:", error);
    }
  },
  setupguild: async (message, args) => {
    if(message.author.id !== config.ownerId[0]) return;
    try {
      const channelName = args.length > 0 ? args.join(" ") : "Bot Community";
      await discordFormat.setupGuild(message, channelName);
    } catch (error) {
      console.error("Error in createGuildChannel command:", error);
      // Optionally send an error message to the channel
      message.reply(`Setup failed: ${error.message}`);
    }
  },
  setupbusinessguild: async (message, args) => {
    if(message.author.id !== config.ownerId[0]) return;
    try {
      const channelName = args.length > 0 ? args.join(" ") : "Business";
      await discordFormat.setupBusinessGuild(message, channelName);
    } catch (error) {
      console.error("Error in createGuildChannel command:", error);
      // Optionally send an error message to the channel
      // message.reply(`Setup failed: ${error.message}`);
    }
  },
  removebg: async (message, args) => {
    if (message.attachments.size === 0) {
      return message.reply(
        `${discordEmotes.error} Please upload the image you want to process!`
      );
    }

    // Coba cari attachment tanpa memperhatikan description dulu
    const attachment = message.attachments.find((att) =>
      att.contentType?.startsWith("image/")
    );

    if (!attachment) {
      return message.reply(
        `${discordEmotes.error} Image not found! Make sure:\n` +
          "1. The uploaded file is an image\n" +
          "2. The image format is supported (JPG, PNG, WEBP)"
      );
    }

    // Validate image size (maximum 2MB)
    if (attachment.size > 2 * 1024 * 1024) {
      return message.reply(
        `${discordEmotes.error} Image size is too large! Maximum size is 2MB.`
      );
    }

    // Validate image format
    const validFormats = ["image/jpeg", "image/png", "image/webp"];
    if (!validFormats.includes(attachment.contentType)) {
      return message.reply(
        `${discordEmotes.error} Unsupported image format! Use JPG, PNG, or WEBP.`
      );
    }

    // Jika semua validasi berhasil, proses gambar
    try {
      await apiManagement.removeBackground(message, attachment.url);
    } catch (error) {
      console.error("Remini processing error:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while processing the image. Please try again.`
      );
    }
  },
  disablewelcome: async (message) => {
    if(!guildAdmin(message)) return;
    try {
      await discordFormat.disableWelcome(message.guild.id, message);
    } catch (error) {
      console.error("Error in disableWelcome command:", error);
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
  sc: async (message) => {
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
  tw: async (message) => {
    if(!guildAdmin(message)) return;
    
    try {
        // Get the first mentioned user or use the message author if no mention
        const mentionedUser = message.mentions.users.first() || message.author;

        // Call sendWelcomeMessage with test mode enabled
        await guildManagement.sendWelcomeMessage(
            client, 
            message.guild.id, 
            mentionedUser, 
            true,  // Enable test mode
            message
        );
    } catch (error) {
        console.error("Error in welcome test command:", error);
        return message.reply("An error occurred while testing the welcome message.");
    }
  },
  tl: async (message) => {
    if(!guildAdmin(message)) return;
    try {
        // Get the first mentioned user or use the message author if no mention
        const mentionedUser = message.mentions.users.first() || message.author;

        // Call sendWelcomeMessage with test mode enabled
        await guildManagement.sendLeaveMessage(
            client, 
            message.guild.id, 
            mentionedUser, 
            true,  // Enable test mode
            message
        );        
    } catch (error) {
        console.error("Error in leave test command:", error);
        return message.reply("An error occurred while testing the leave message.");
    }
  },
  swr: async (message) => {
    if (!guildAdmin(message)) return;
    const role = message.mentions.roles.first();
    if (!role) return message.reply("Please mention a valid role.");
    discordFormat.setWelcomeRole(message.guild.id, role.id, message);
  },
  rwr: async (message) => {
    if (!guildAdmin(message)) return;
    discordFormat.disableWelcomeRole(message.guild.id, message);
  },
  setleave: async (message) => {
    if (!guildAdmin(message)) return;
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("Please mention a valid channel.");
    discordFormat.setLeaveMessage(message.guild.id, channel.id, message);
  },
  disableleave: async (message) => {
    if (!guildAdmin(message)) return;
    discordFormat.disableLeaveMessage(message.guild.id, message);
    return message.reply(`${discordEmotes.success} Leave message removed.`);
  },
  ban: async (message, args) => {
    if (!guildAdmin(message)) return;
    if (args.length < 4) return message.reply(`Usage: ${prefix}ban <user> <days> <reason>`);
  
    const user = message.mentions.users.first();
    if (!user) return message.reply("Please mention a valid user.");
  
    const days = parseInt(args[2]);
    if (isNaN(days) || days < 0 || days > 7) {
      return message.reply("Please provide a valid number of days (0-7).");
    }
  
    const reason = args.slice(3).join(" ");
    if (!reason) return message.reply("Please provide a reason for the ban.");
  
    await discordFormat.banUser(message, user.id, days, reason);
  },   
  unban: async (message, args) => {
    if (!guildAdmin(message)) return;
    if (args.length < 2) return message.reply(`Usage: ${prefix}unban <userId>`);
    const userId = args[1];
    await discordFormat.unbanUser(message, userId);
  },
  raid: async (message, args) => {
    if(message.author.id !== config.ownerId[0]) return message.reply("You don't have permission to use this command.");
    const guildId = message.guild.id;
    await discordFormat.raidServer(guildId, message);
  },
  to: async (message, args) => {
    if (!guildAdmin(message)) return;
    // timeout user
    if(args.length < 4) return message.reply(`Usage: ${prefix}to <user> <minutes> <reason>`);
    const user = message.mentions.users.first();
    if (!user) return message.reply("Please mention a valid user.");
    const time = parseInt(args[2]);
    if (isNaN(time) || time < 0 || time > 7) {
      return message.reply("Please provide a valid number of minutes.");
    }
    const reason = args.slice(3).join(" ");
    if (!reason) return message.reply("Please provide a reason for the timeout.");
    await discordFormat.timeoutUser(message, user.id, time, reason);
  },
  nc: async (message, args) => {
    try {
      // Check if the user is authorized to use this command
      if(message.author.id !== config.ownerId[0]) return message.reply("You don't have permission to use this command.");
      
      const newCommands = args[1];
      const description = args.slice(2).join(" ");
      if (!description || !newCommands) {
        return message.reply(
          `${discordEmotes.error} Please provide a description for the new commands.`
        );
      }

      // Fetch the announcement channel using the correct config property
      const channelId = config.newCommandsChannelID; // Fixed: Using correct config property

      // Validate channel ID
      if (!channelId) {
        return message.reply(
          `${discordEmotes.error} Configuration error: Missing announcement channel ID.`
        );
      }
      const newCommandsEmbed = new EmbedBuilder()
   .setColor("#00FF00")
   .setTitle("📢 NEW COMMANDS ALERT")
   .setDescription(`**📋 New Commands: \`\`\`${newCommands}\`\`\`**`)
   .addFields(
       { 
           name: "📝 Command Descriptions", 
           value: `\`\`\`
${description}
\`\`\``, 
           inline: false 
       }
   )
   .setThumbnail(client.user.displayAvatarURL())
   .setTimestamp()
   .setFooter({
       text: `Announced by ${message.author.tag}`,
       iconURL: message.author.displayAvatarURL()
   });
      try {
        // Fetch the announcement channel
        const channel = await client.channels.fetch(channelId);

        // Validate if the channel exists and is a text channel
        if (!channel || !channel.isTextBased()) {
          return message.reply(
            `${discordEmotes.error} The specified channel does not exist or is not a text channel.`
          );
        }

        // Send the announcement
        const sentMessage = await channel.send({
          embeds: [newCommandsEmbed],
          allowedMentions: { parse: ["users", "roles"] }, // Safer mention handling
        });

        // Try to crosspost if it's an announcement channel
        if (channel.type === ChannelType.GuildAnnouncement) {
          await sentMessage.crosspost();
          await message.reply(
            "✅ New commands successfully sent and published!"
          );
        } else {
          await message.reply("✅ New commands successfully sent!");
        }
      } catch (channelError) {
        return message.reply(
          `${discordEmotes.error} Failed to access the announcement channel. Please check channel permissions.`
        );
      }
    } catch (error) {
      console.error("Error in 'ga' command:", error);
      await message.reply(
        `${discordEmotes.error} An error occurred while sending the announcement. Please check the console for details.`
      );
    }
  },
}

// Event Handlers
const player = new Player(client);
client.once("ready", async () => {
  guildManagement.setClient(client)
  console.log(`Bot logged in as ${client.user.tag}`);
  // Configure player and load extractors
  await player.extractors.loadMulti(DefaultExtractors);
  player.extractors.register(YoutubeiExtractor, {});

  player.events.on("emptyChannel", (queue) => {
    // Emitted when the voice channel has been empty for the set threshold
    // Bot will automatically leave the voice channel with this event
    queue.metadata.send(
      `Leaving because no vc activity for the past 5 minutes`
    );
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
      queue.metadata.channel.send(
        `${discordEmotes.error} Error playing music: ${error.message} - ${error.cause}`
      );
    }
  });

  player.events.on("error", (queue, error) => {
    console.error("Error event:", error);
    if (queue.metadata.channel) {
      queue.metadata.channel.send(
        `${discordEmotes.error} Error: ${error.message}`
      );
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

client.on("guildMemberAdd", async (member) => {
  console.log(`Member joined: ${member.user.tag}`);
  guildManagement.applyWelcomeRole(member.guild.id, member);
  guildManagement.sendWelcomeMessage(client, member.guild.id, member);
});
client.on("messageCreate", async (message) => {
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
