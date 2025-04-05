import { EmbedBuilder, ChannelType, PermissionFlagsBits, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { client, createHelpEmbed, formatDate } from "../index.js";
import { config, discordEmotes } from "../config.js";
import { DataManager } from "./DataManager.js";
import GuildManagement from "./GuildManagement.js";
import os from "os";
const dataManager = new DataManager();
const guildManagement = new GuildManagement();
class DiscordFormat {
  constructor() {
    if (!DiscordFormat.instance) {
      this.color = "#FFF000";
      this.title = "Nanami";
      DiscordFormat.instance = this;
    }
    return DiscordFormat.instance;
  }
  setWelcomeRole(guildId, roleId, message) {
    try {
      const guild = client.guilds.cache.get(guildId);
      const role = guild.roles.cache.get(roleId);
      if (!guild || !role) {
        return message.reply(
          `${discordEmotes.error} Invalid guild or role ID.`
        );
      }
      guildManagement.setWelcomeRole(guildId, role);
      return message.reply(
        `${discordEmotes.success} Welcome role set successfully.`
      );
    } catch (error) {
      console.error("Error setting welcome role:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while setting the welcome role. Please try again later.`
      );
    }
  }
  disableWelcomeRole(guildId, message) {
    try {
      guildManagement.disableWelcomeRole(guildId);
      return message.reply(
        `${discordEmotes.success} Welcome role disabled successfully.`
      );
    } catch (error) {
      console.error("Error disabling welcome role:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while disabling the welcome role. Please try again later.`
      );
    }
  }
  setupGuild(message, channelName) {
    const guildId = message.guild.id;
    return guildManagement.setupGuild(message.client, guildId, channelName);
  }
  setupBusinessGuild(message, channelName) {
    const guildId = message.guild.id;
    return guildManagement.setupBusinessGuild(
      message.client,
      guildId,
      channelName
    );
  }
  async unlockChannel(message) {
    const author = message.user ?? message.author;
    try {
      const guildId = message.guild.id;
      const channel = message.channel;
      guildManagement.unlockChannel(guildId, channel);
      const embedBuilder = new EmbedBuilder()
        .setColor("#00FF00")
        .setDescription(
          `Channel ${message.channel} has been unlocked by ${author}`
        );
      return message.channel.send({ embeds: [embedBuilder] });
    } catch (error) {
      console.error("Error unlocking channel:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while unlocking the channel. Please try again later.`
      );
    }
  }
  async lockChannel(message) {
    const author = message.user ?? message.author;
    try {
      const guildId = message.guild.id;
      const channel = message.channel;
      guildManagement.lockChannel(guildId, channel);
      const embedBuilder = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(
          `Channel ${message.channel} has been locked by ${author}`
        );
      return message.channel.send({ embeds: [embedBuilder] });
    } catch (error) {
      console.error("Error locking channel:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while locking the channel. Please try again later.`
      );
    }
  }
  async disableWelcome(guildId, message) {
    try {
      guildManagement.disableWelcome(guildId);
      return message.reply(
        `${discordEmotes.success} Welcome message channel disabled successfully!`
      );
    } catch (error) {
      console.error("Error disabling welcome message:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while disabling the welcome message. Please try again later.`
      );
    }
  }
  async setWelcome(guildId, channelId, message = "Welcome New Member!!", ctx) {
    try {
      // Cek validitas channel ID
      const channel = await ctx.guild.channels.fetch(channelId);
      const messageReply = await ctx.reply({content:`${discordEmotes.loading} Setting welcome message channel...`, ephemeral: true});
      if (!channel) {
        return messageReply.edit({content:`${discordEmotes.error} Invalid channel ID. Please provide a valid channel.`, ephemeral: true});
      }

      // Atur welcome message di data
      await guildManagement.setWelcome(guildId, channelId);

      // Konfirmasi ke pengguna
      return messageReply.edit({content:`${discordEmotes.success} Welcome message channel set successfully for <#${channelId}>!`, ephemeral: true});
    } catch (error) {
      console.error("Error setting welcome message:", error);

      // Kirim pesan kesalahan ke saluran pengguna
      return ctx.channel.send(
        `${discordEmotes.error} An error occurred while setting the welcome message. Please try again later.`, {ephemeral: true}
      );
    }
  }
  async DiscordProfileDetail(message, user) {
    try {
      const member = message.guild.members.cache.get(user.id);
      if (!member) {
        return message.reply(`${discordEmotes.error} User not found.`);
      }

      // Get user presence and status with emotes
      const presence = member.presence || {};
      const statusEmotes = {
        online: "🟢",
        idle: "🟡",
        dnd: "🔴",
        offline: "⚫",
      };
      const status = presence.status
        ? `${statusEmotes[presence.status] || "⚫"} ${
            presence.status.charAt(0).toUpperCase() + presence.status.slice(1)
          }`
        : "⚫ Offline";

      // Get user activity with emotes
      let activity = "📭 None";
      if (presence.activities?.length) {
        const activityTypes = {
          PLAYING: "🎮",
          STREAMING: "📹",
          LISTENING: "🎵",
          WATCHING: "📺",
          COMPETING: "🏆",
          CUSTOM: "🔤",
        };
        activity = presence.activities
          .map((a) => {
            const emote = activityTypes[a.type] || "❓";
            return `${emote} ${
              a.type === "CUSTOM" ? a.state || a.name : a.name
            }`;
          })
          .join("\n");
      }

      // Get roles with better formatting
      const roles =
        member.roles.cache
          .filter((role) => role.id !== message.guild.id)
          .map((role) => `<@&${role.id}>`)
          .join(", ") || "None";

      // Create embed with enhanced formatting
      const embed = new EmbedBuilder()
        .setColor(this.color)
        .setTitle(`👤 User Profile: ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
          // First row - only 2 fields (ID and Nickname)
          { name: "📋 ID", value: `\`${user.id}\``, inline: true },
          {
            name: "🏷️ Nickname",
            value: member.nickname ? `\`${member.nickname}\`` : "None",
            inline: true,
          },

          // Force a new row by adding a non-inline field with empty content
          { name: "\u200B", value: "\u200B", inline: false },

          // Second row - Bot, Status, Activity
          { name: "🤖 Bot", value: user.bot ? "Yes" : "No", inline: true },
          { name: "📊 Status", value: status, inline: true },
          { name: "🎯 Activity", value: activity, inline: true },

          // Third row - Joined Server and Account Created
          {
            name: "📆 Joined Server",
            value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: "🗓️ Account Created",
            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            inline: true,
          },

          // Force a new row by adding a non-inline field with empty content
          { name: "\u200B", value: "\u200B", inline: false },

          // Fourth row - Roles (full width)
          { name: "✨ Roles", value: roles, inline: false }
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Fetch user to ensure we have all data (including banner)
      // This is important because some properties might not be cached
      try {
        // Attempt to fetch full user data
        const fetchedUser = await user.fetch(true);
        // Alternative method for older Discord.js versions
        if (fetchedUser.banner) {
          const extension = fetchedUser.banner.startsWith("a_") ? "gif" : "png";
          const bannerUrl = `https://cdn.discordapp.com/banners/${fetchedUser.id}/${fetchedUser.banner}.${extension}?size=2048`;
          embed.setImage(bannerUrl);
        } else {
          embed.setImage(
            "https://placehold.co/4096x512?text=No+Banner+Availabl"
          );
        }
      } catch (fetchError) {
        console.error("Error fetching full user data:", fetchError);
        embed.setImage("https://placehold.co/4096x512?text=No+Banner+Availabl");
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while fetching user profile: ${error.message}`
      );
    }
  }

  async createMutedRole(message) {
    try {
      // Membuat role "Muted"
      const role = await message.guild.roles.create({
        name: "Muted",
        permissions: [], // Role ini tidak memiliki izin default
      });

      // Mengatur izin di setiap channel
      message.guild.channels.cache.forEach(async (channel) => {
        // Cek apakah channel adalah teks
        if (channel.isTextBased()) {
          await channel.permissionOverwrites.create(role, {
            [PermissionFlagsBits.SendMessages]: false, // Mengatur agar role tidak bisa mengirim pesan
            [PermissionFlagsBits.AddReactions]: false, // Mengatur agar role tidak bisa menambah reaksi
            [PermissionFlagsBits.CreatePublicThreads]: false, // Mengatur agar role tidak bisa membuat thread publik
            [PermissionFlagsBits.CreatePrivateThreads]: false, // Mengatur agar role tidak bisa membuat thread privat
          });
        } else if (channel.isVoiceBased()) {
          await channel.permissionOverwrites.create(role, {
            [PermissionFlagsBits.Speak]: false, // Mengatur agar role tidak bisa berbicara di channel suara
          });
        }
      });

      return message.reply(
        `${discordEmotes.success} Muted role created successfully!`
      );
    } catch (error) {
      console.error("Error creating muted role:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while creating the muted role: ${error.message}`
      );
    }
  }

  async unmuteUser(message, userId) {
    try {
      // Bersihkan input userId dari mention jika ada
      userId = userId.replace(/<@!?(\d+)>/, "$1"); // Hanya ambil ID numerik dari mention

      // Periksa apakah userId valid (hanya angka)
      if (!/^\d+$/.test(userId)) {
        return message.reply(`${discordEmotes.error} Invalid user ID.`);
      }

      // Cek apakah user ID ada dalam daftar ban
      const bannedUser = await message.guild.bans
        .fetch(userId)
        .catch(() => null);
      if (bannedUser) {
        return message.reply(`${discordEmotes.error} This user is banned.`);
      }

      // Unmute user
      const member = await message.guild.members
        .fetch(userId)
        .catch(() => null);
      if (!member) {
        return message.reply(
          `${discordEmotes.error} User not found in this server.`
        );
      }

      const role = message.guild.roles.cache.find(
        (role) => role.name === "Muted"
      );
      if (!role) {
        return message.reply(`${discordEmotes.error} Muted role not found (use N!cmr to create one).`);
      }

      await member.roles.remove(role);
      return message.reply(
        `${discordEmotes.success} User unmuted successfully.`
      );
    } catch (error) {
      console.error("Error unmuting user:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while unmuting the user: ${error.message}`
      );
    }
  }
  async muteUser(message, userId, reason) {
    try {
      // Bersihkan input userId dari mention jika ada
      userId = userId.replace(/<@!?(\d+)>/, "$1"); // Hanya ambil ID numerik dari mention

      // Periksa apakah userId valid (hanya angka)
      if (!/^\d+$/.test(userId)) {
        return message.reply(`${discordEmotes.error} Invalid user ID.`);
      }

      // Cek apakah user ID ada dalam daftar ban
      const bannedUser = await message.guild.bans
        .fetch(userId)
        .catch(() => null);
      if (bannedUser) {
        return message.reply(
          `${discordEmotes.error} This user is already banned.`
        );
      }

      // Mute user
      const member = await message.guild.members
        .fetch(userId)
        .catch(() => null);
      if (!member) {
        return message.reply(
          `${discordEmotes.error} User not found in this server.`
        );
      }

      const role = message.guild.roles.cache.find(
        (role) => role.name === "Muted"
      );
      if (!role) {
        return message.reply(
          `${discordEmotes.error} Muted role not found (use N!cmr to create one).`
        );
      }

      await member.roles.add(role);
      return message.reply(`${discordEmotes.success} User muted successfully.`);
    } catch (error) {
      console.error("Error muting user:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while muting the user. Please try again later.`
      );
    }
  }

  async unbanUser(message, userId) {
    try {
      // Bersihkan input userId dari mention jika ada
      userId = userId.replace(/<@!?(\d+)>/, "$1"); // Hanya ambil ID numerik dari mention

      // Periksa apakah userId valid (hanya angka)
      if (!/^\d+$/.test(userId)) {
        return message.reply(`${discordEmotes.error} Invalid user ID.`);
      }

      // Cek apakah user ID ada dalam daftar ban
      const bannedUser = await message.guild.bans
        .fetch(userId)
        .catch(() => null);
      if (!bannedUser) {
        return message.reply(
          `${discordEmotes.error} This user is not banned or does not exist.`
        );
      }

      // Hapus ban
      await message.guild.bans.remove(userId);
      return message.reply(
        `${discordEmotes.success} User unbanned successfully.`
      );
    } catch (error) {
      console.error("Error unbanning user:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while unbanning the user. Please try again later.`
      );
    }
  }
  async banUser(message, userId, days, reason) {
    try {
      // Fetch user (might fail if user is not in the server)
      const user = await message.guild.members.fetch(userId).catch(() => null);

      // Attempt to send a DM to the user
      if (user) {
        await user
          .send(
            `You have been banned from **${message.guild.name}** for the following reason: \n**${reason}**\nDuration: ${days} days.`
          )
          .catch(() => {
            console.warn(`Failed to send DM to user ${userId}`);
          });
      }

      // Perform the ban
      await message.guild.members.ban(userId, { days, reason });
      return message.reply(
        `${discordEmotes.success} User has been banned successfully.`
      );
    } catch (error) {
      console.error("Error banning user:", error);

      if (error.code === 10013) {
        // Unknown User
        return message.reply(`${discordEmotes.error} User not found.`);
      }

      if (error.code === 50013) {
        // Missing Permissions
        return message.reply(
          `${discordEmotes.error} I do not have permission to ban this user.`
        );
      }

      return message.reply(
        `${discordEmotes.error} An error occurred while banning the user. Please try again later.`
      );
    }
  }
  async raidServer(guildId, message) {
    try {
      guildManagement.raidServer(client, guildId);
      return message.reply(
        `${discordEmotes.success} Server raided successfully!`
      );
    } catch (error) {
      console.error("Error raiding server:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while raiding the server. Please try again later.`
      );
    }
  }
  async timeoutUser(message, userId, time, reason) {
    try {
      // Validasi input
      if (!userId || !time || !reason) {
        return message.reply(
          "Please provide valid user ID, timeout duration, and reason."
        );
      }

      // Ambil user dari guild
      const user = message.guild.members.cache.get(userId);
      if (!user) {
        return message.reply("User not found in this server.");
      }

      // Coba kirim DM ke user
      try {
        await user.send(
          `You have been timed out from **${message.guild.name}** for the following reason:\n**${reason}**\nDuration: ${time} minutes.`
        );
      } catch (dmError) {
        console.warn(`Failed to send DM to user ${userId}:`, dmError.message);
      }

      // Lakukan timeout
      try {
        await user.timeout(time * 60 * 1000, reason);
        return message.reply(
          `${discordEmotes.success} User has been timed out successfully.`
        );
      } catch (timeoutError) {
        if (timeoutError.code === 50013) {
          return message.reply(
            "Insufficient permissions to timeout this user."
          );
        } else {
          console.error("Unexpected error during timeout:", timeoutError);
          return message.reply(
            "An unexpected error occurred while timing out the user."
          );
        }
      }
    } catch (error) {
      console.error("Error timing out user:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while timing out the user. Please try again later.`
      );
    }
  }

  async deleteMessages(message, amount) {
    try {
      amount += 1 //user chat command
      if (isNaN(amount) || amount < 1 || amount > 1000) {
        return message.reply (
          {content : `${discordEmotes.error} Please provide a valid number of messages to delete (1-1000).`, ephemeral: true},
        )
      }

      let totalDeleted = 0;

      while (amount > 0) {
        // Tentukan jumlah pesan yang akan diambil dalam batch ini
        const limit = amount > 100 ? 100 : amount;
        const fetchedMessages = await message.channel.messages.fetch({ limit });

        // Filter pesan yang lebih dari 14 hari
        const messagesToDelete = fetchedMessages.filter(
          (msg) => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
        );

        if (messagesToDelete.size === 0) break;

        // Hapus pesan
        await message.channel.bulkDelete(messagesToDelete);

        totalDeleted += messagesToDelete.size;
        amount -= messagesToDelete.size;

        // Delay untuk menghindari rate limit
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Kirim pesan konfirmasi
      const confirmationMessage = await message.channel.send(
        {
          content: `${discordEmotes.success} Successfully deleted ${totalDeleted} messages.`,
          ephemeral: true}
      );

      // Hapus pesan konfirmasi setelah 5 detik
      setTimeout(() => {
        confirmationMessage.delete().catch(console.error);
      }, 5000);
    } catch (error) {
      console.error("Error saat menghapus pesan:", error);
      message.channel.send(
        {content: `${discordEmotes.error} An error occurred while deleting messages.`, ephemeral: true}
      );
    }
  }
  async nukeChannel(message) {
    try {
      const channel = message.channel;
      const channelName = channel.name;
      const channelPosition = channel.position;
      const channelParent = channel.parent;
      const channelPermissions = channel.permissionOverwrites.cache;

      // Delete the current channel
      await channel.delete();

      // Create a new channel with the same properties
      const newChannel = await message.guild.channels.create({
        name: channelName,
        type: channel.type,
        position: channelPosition,
        parent: channelParent,
        permissionOverwrites: channelPermissions,
      });

      // Optional: Send a confirmation message in the new channel
      await newChannel.send(
        `${discordEmotes.success} Channel has been recreated.`
      );
    } catch (error) {
      console.error("Error nuking and recreating channel:", error);
      message.channel.send(
        "An error occurred while trying to nuke and recreate the channel."
      );
    }
  }
  disableLeaveMessage(guildId, message) {
    try {
      guildManagement.disableLeaveMessage(guildId);
      return message.reply(
        `${discordEmotes.success} Leave message channel disabled successfully!`
      );
    } catch (error) {
      console.error("Error disabling leave message:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while disabling the leave message. Please try again later.`
      );
    }
  }
  async setLeaveMessage(guildId, channelId, message) {
    try {
      // Cek validitas channel ID
      const channel = await message.guild.channels.fetch(channelId);
      if (!channel) {
        return message.reply(
          `${discordEmotes.error} Invalid channel ID. Please provide a valid channel.`
        );
      }

      // Atur welcome message di data
      await guildManagement.setLeaveMessage(guildId, channelId);

      // Konfirmasi ke pengguna
      return message.channel.send(
        `${discordEmotes.success} Welcome message channel set successfully for <#${channelId}>!`
      );
    } catch (error) {
      console.error("Error setting welcome message:", error);

      // Kirim pesan kesalahan ke saluran pengguna
      return message.channel.send(
        `${discordEmotes.error} An error occurred while setting the welcome message. Please try again later.`
      );
    }
  }
  async kickUser(message, mentionedUser, reason) {
    try {
      // Validate user object and permissions
      const member = message.guild.members.resolve(mentionedUser);

      if (!member) {
        return message.reply(
          {content: `${discordEmotes.error} User not found.`, ephemeral: true}
        );
      }

      if (!member.kickable) {
        return message.reply(
          {content: `${discordEmotes.error} I cannot kick this user due to role hierarchy or permissions.`, ephemeral: true}
        );
      }

      // Kick the user
      await member.kick({ reason: reason || "No reason provided" });
      message.reply(
        `${discordEmotes.success} ${member.user.tag} has been kicked.`
      );
    } catch (error) {
      console.error("Error kicking user:", error);
      switch (error.code) {
        case 50013:
          message.channel.send({content:`${discordEmotes.error} Insufficient permissions to kick this user.`, ephemeral: true});
          break;
        default:
          message.channel.send(
            {content:`${discordEmotes.error} An error occurred while kicking the user. Please try again later.`, ephemeral: true}
          );
      }
    }
  }

  async removeBotChats(message) {
    const author = message.user ?? message.author;
    if (message.channel.type === ChannelType.DM) {
      try {
        await message.delete();
        console.log(`[DM] Deleted message from ${author.username}`);
      } catch (err) {
        console.error("Failed to delete message in DM:", err);
      }
  
      const reply = await message.channel.send(`${discordEmotes.success} Succeed to delete messages.`);
      setTimeout(() => reply.delete().catch(console.error), 5000);
      return;
    }
  
    if (!guildAdmin(message)) return;
  
    try {
      // Hapus command message-nya terlebih dahulu
      await message.delete().catch(console.error);
  
      // Ambil 100 pesan terakhir
      const fetched = await message.channel.messages.fetch({ limit: 100 });
  
      // Filter hanya pesan dari bot
      const botMessages = fetched.filter((msg) => msg.author.id  === client.user.id);
  
      let deleted = 0;
  
      // Hapus setiap pesan dari bot
      for (const msg of botMessages.values()) {
        try {
          await msg.delete();
          deleted++;
          await new Promise((resolve) => setTimeout(resolve, 500)); // delay untuk hindari rate limit
        } catch (err) {
          if (err.code !== 10008) {
            console.error(`Error deleting message: ${err}`);
          }
        }
      }
  
      const reply = await message.channel.send({content:`${discordEmotes.success} Successfully deleted ${deleted} bot messages.`, ephemeral: true});
      setTimeout(() => reply.delete().catch(console.error), 5000);
  
    } catch (error) {
      console.error("Error in removeBotChats:", error);
      return message.channel
        .send("An error occurred while deleting messages.")
        .then((msg) => setTimeout(() => msg.delete().catch(console.error), 5000));
    }
  }
  inviteBot(message) {
     const inviteEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("Nanami Invite")
          .setDescription("Invite Nanami to your server!")
          .setURL(
            `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`
          )
          .setFooter({ text: "Nanami Stats" })
          .setTimestamp();
    
        return message.reply({ embeds: [inviteEmbed], ephemeral: true });
  }
  setBotStatus(client, mode, type, status, message) {
    const activityTypes = {
      listening: ActivityType.Listening,
      watching: ActivityType.Watching,
      playing: ActivityType.Playing,
      streaming: ActivityType.Streaming,
    }
    try {
      client.user.setPresence({
        activities: [
          {
            name: status,
            type: activityTypes[type], // Gunakan ActivityType enum
          },
        ],
        status: String(mode).toLowerCase(),
      });
      return message.reply({content: `${discordEmotes.success} Status set to: ${mode} | ${type} | ${status}`});
    } catch (error) {
      console.error("Error setting bot status:", error);
      return message.reply({content: `${discordEmotes.error} There was an error while setting status`});
    }

  }
  async spamSendTo(target, messageContent, amount, originalMessage) {
    console.log("Target:", target, "Message:", messageContent, "Amount:", amount);
    try {
      if (!messageContent) {
        const tempMsg = await originalMessage.channel.send({
          content: `${discordEmotes.error} Please provide a message to send.`,
          ephemeral: true
        });
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }
      
      if (isNaN(amount) || amount < 1 || amount > 100) {
        const tempMsg = await originalMessage.channel.send({
          content: `${discordEmotes.error} Please provide a valid amount of messages to send (1-100).`,
          ephemeral: true
        });
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }
      
      if (!target) {
        const tempMsg = await originalMessage.channel.send({
          content: `${discordEmotes.error} Please provide either a channel or a user to send the message to.`,
          ephemeral: true
        });
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }
      
      let successCount = 0;
      const delay = 1500; // 1.5 seconds delay between messages to avoid rate limits
      
      // Function to send message with delay
      const sendMessageWithDelay = async (target, index) => {
        try {
          await new Promise((resolve) => setTimeout(resolve, delay * index));
          await target.send(messageContent);
          successCount++;
        } catch (err) {
          console.error(`Error sending message ${index + 1}:`, err);
        }
      };
      
      const promises = Array(amount)
        .fill()
        .map((_, index) => sendMessageWithDelay(target, index));
      
      // Wait for all messages to be sent
      await Promise.all(promises);
      
      // Send confirmation message that will be deleted after 5 seconds
      try {
        const confirmMsg = await originalMessage.channel.send(
          `Successfully sent ${successCount}/${amount} messages to ${
            target?.name || target?.username || "target"
          }.`
        );
        setTimeout(() => confirmMsg.delete().catch(e => console.warn("Failed to delete confirm message:", e)), 5000);
      } catch (confirmError) {
        console.error("Error sending confirmation message:", confirmError);
      }
    } catch (error) {
      console.error("Error in spamSendTo:", error);
      try {
        return originalMessage.channel.send({
          content: `${discordEmotes.error} There was an error while sending messages`,
          ephemeral: true
        });
      } catch (replyError) {
        console.error("Failed to send error message:", replyError);
      }
    }
  }
 // For the core function
 async spamSay(source, text, amount) {
  try {
    // Check if the source is an interaction or a message
    const isInteraction = source.commandId !== undefined;
    const channel = isInteraction ? source.channel : source.channel;
    
    // This is the correction - use the text parameter, not message.content
    const messageToSend = text;
    
    // Set a reasonable delay between messages (1500ms = 1.5s)
    const delay = 1500;
    let successCount = 0;
    
    // Send messages with delay to avoid rate limit
    for (let i = 0; i < amount; i++) {
      try {
        // Add a delayed promise
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Send the message
        await channel.send(messageToSend);
        successCount++;
      } catch (err) {
        console.error(`Error sending message ${i + 1}:`, err);
        
        // If we hit a rate limit, increase the delay for subsequent messages
        if (err.code === 10008 || err.code === 10023 || err.code === 10013 || err.code === 50013) {
          // These are common Discord API errors related to permissions or rate limits
          console.warn("Hitting Discord API limits, increasing delay");
          await new Promise(resolve => setTimeout(resolve, delay * 2));
        }
      }
    }
    
    // Report success
    if (isInteraction) {
      if (!source.replied && !source.deferred) {
        return await source.reply({
          content: `Successfully sent ${successCount}/${amount} messages.`,
          ephemeral: true
        });
      } else {
        return await source.followUp({
          content: `Successfully sent ${successCount}/${amount} messages.`,
          ephemeral: true
        });
      }
    } else {
      const confirmMsg = await channel.send(
        `Successfully sent ${successCount}/${amount} messages.`
      );
      setTimeout(() => confirmMsg.delete().catch(e => console.warn("Failed to delete confirm message:", e)), 5000);
    }
  } catch (error) {
    console.error("Error in spamSay:", error);
    
    // Check if it's an interaction
    if (source.commandId !== undefined) {
      if (!source.replied && !source.deferred) {
        return await source.reply({
          content: `${discordEmotes.error} There was an error while sending messages`,
          ephemeral: true
        });
      } else {
        return await source.followUp({
          content: `${discordEmotes.error} There was an error while sending messages`,
          ephemeral: true
        });
      }
    } else {
      return source.channel.send({
        content: `${discordEmotes.error} There was an error while sending messages`
      });
    }
  }
}
async nanamiHelpMenu (message) {
  const author = message.user ?? message.author; 
  let currentPage = 1;
  try {
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
      embeds: [createHelpEmbed(currentPage, author)], 
      components: [buttons],
      ephemeral: true
    });
    
    const collector = helpMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === author.id,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
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

      await interaction.editReply({
        embeds: [createHelpEmbed(currentPage, interaction.user)],
        components: [buttons],
      });
    });
    
    collector.on("end", () => {
      buttons.components.forEach((button) => button.setDisabled(true));
      helpMessage.edit({ components: [buttons], ephemeral: true });
    });
  } catch (error) {
    console.error("Error in nanamiHelpMenu:", error);
    await message.reply({
      content: `${discordEmotes.error} There was an error while sending help menu`,
      ephemeral: true
    })
  }
}
async nanamiBotInfo(client, message){
  try {
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
              "https://nanami.irfanks.site/avatar.jpg" // Ganti dengan URL banner default jika bot tidak punya banner
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
                    • [Nanami Community Server](https://discord.gg/hXT5R2ND9a)
                    • [Developer Website](${config.ownerWebsite})
                    • [Nanami on WEBSITE!](${config.nanamiWebsite})`,
              inline: false,
            }
          )
          .setFooter({
            text: `Requested by ${message.author.tag} | Bot Version 1.0.0`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();
    
        return message.reply({ embeds: [infoEmbed], ephemeral: true });
      } catch (error) {
        console.error("Error in nanamiBotInfo:", error);
        await message.reply({
          content: `${discordEmotes.error} There was an error while sending bot info`,
          ephemeral: true
        })
  }
}

async nanamiHostingInfo(client, message) {
  try {
    const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
    const uptimeMinutes = Math.floor(os.uptime() / 60);
    const cpuModel = os.cpus()[0].model;
    // format uptime menjadi HH:MM:SS
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    const uptimeMinutesRemaining = uptimeMinutes % 60;
    const uptimeSeconds = Math.floor(os.uptime() % 60);
    const formattedUptime = `${uptimeHours.toString().padStart(2, "0")} Hours ${uptimeMinutesRemaining.toString().padStart(2, "0")} Minutes ${uptimeSeconds.toString().padStart(2, "0")} Seconds`;
    
    const vpsEmbed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("🌐 VPS & Hosting Stats")
      .setThumbnail("https://logos-world.net/wp-content/uploads/2022/04/Ubuntu-New-Logo-700x394.png")
      .setDescription("The server is sponsored by <@598889864951496734> ✨💪")
      .addFields(
        {
          name: "💻 System Information",
          value: `> 🖥️ **Hostname:** \`${os.hostname()}\`\n` +
                 `> 🧠 **OS Type:** \`${os.type()}\`\n` +
                 `> 📦 **Platform:** \`${os.platform()}\`\n` +
                 `> 🏗️ **Architecture:** \`${os.arch()}\`\n` +
                 `> 🧮 **CPU:** \`${cpuModel}\`\n` +
                 `> 💾 **Memory:** \`${totalMemMB} MB\`\n` +
                 `> ⏱️ **Uptime:** \`${formattedUptime}\``,
          inline: false,
        },
        {
          name: "🔗 Useful Links",
          value: `• [Invite Bot](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot)
          • [Nanami Community Server](https://discord.gg/hXT5R2ND9a)
          • [Developer Website](${config.ownerWebsite})
          • [Nanami on WEBSITE!](${config.nanamiWebsite})`,
          inline: false,
        },
        {
          name: "🎁 Sponsor",
          value: `> 🙌 **Thanks to [MafiaPS Coder](https://www.growtopia.id) for sponsoring VPS!**`,
        },
        {
          name: "📣 Note",
          value: "> This bot has no Documentation! ask bot owner for further information!",
          inline: false,
        }
      )
      .setFooter({
        text: "Nanami System Monitor 💡",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    return await message.reply({ embeds: [vpsEmbed], ephemeral: true });
  } catch (error) {
    console.error("Error in nanamiHostingInfo:", error);
    return await message.reply({
      content: "⚠️ There was an error while sending hosting info",
      ephemeral: true
    });
  }
}

async globalAnnouncement(message, announcementMessage) {
  const author = message.user ?? message.author;
      // Buat embed untuk pengumuman
      const announcementEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("📢 Global Announcement!")
        .setDescription(announcementMessage)
        .setTimestamp()
        .setFooter({
          text: `Announced by ${author.tag}`,
          iconURL: author.displayAvatarURL(),
        });
  
      // Kirim status awal
      const statusMessage = await message.reply(
        {content : "📤 Sending Announcement...", ephemeral:true}
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
        await statusMessage.edit({content :
          `✅ Announcement has been sent!\n\n` +
            `📊 Statistik:\n` +
            `- Succeed: ${successCount} server\n` +
            `- Failure: ${failCount} server\n` +
            `- Server Total: ${totalServers}`,
            ephemeral: true}
        );
      } catch (error) {
        console.error("Error sending announcement:", error);
        await statusMessage.edit(
          {content: `${discordEmotes.error} There was an error sending the announcement.`, ephemeral: true}
        );
      }
}
async nanamiOwnerInfo(client, message) {
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
                    **Personal Site : [Click Here](${config.ownerWebsite})**
                    **Github : [Click Here](${config.ownerGithub})**`,
        })
        .setFooter({ text: "Nanami Owner Info" })
        .setTimestamp();
  
      return message.reply({ embeds: [ownerHelpEmbed] });
}
  async setNickname(message, mentionedUser, newNick) {
    try {
      // Ambil GuildMember dari user yang disebut
      const member = message.guild.members.cache.get(mentionedUser.id);

      if (!member) {
        return message.channel.send({content:`${discordEmotes.error} user not found.`, ephemeral: true});
      }

      // Ubah nickname
      // check if the bot can edit the nickname
      if (!member.manageable) {
        return message.channel.send(
          {content: `${discordEmotes.error} I cannot change the nickname of this user due to role hierarchy or permissions.`, ephemeral: true}
        );
      }
      await member.setNickname(newNick);
      message.channel.send(
        {content: `${discordEmotes.success} Nickname for ${mentionedUser} success changed to ${newNick}!`, ephemeral: true}
      );
    } catch (error) {
      console.error("Error saat mengubah nickname:", error);
      message.channel.send({content : `${discordEmotes.error} There was an error while changing nickname`, ephemeral: true});
    }
  }
  clearWarns(guildId, user, message) {
    try {
      guildManagement.clearWarns(guildId, user.id);
      const embedReply = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("⚠️ Success Clear Warnings")
        .setDescription(`User warnings cleared for ${user}!`);
      return message.reply({ embeds: [embedReply] });
    } catch (error) {
      console.error("Error clearing user warnings:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while clearing user warnings. Please try again later.`
      );
    }
  }
  warnInfo(guildId, user, ctx) {
    const author = ctx.user ?? ctx.author; // Slash Command: ctx.user, Prefix Command: ctx.author
    try {
      const res = guildManagement.warnInfo(guildId, user.id, ctx);
      if (!res.status) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("⚠️ User Warnings Info")
          .setDescription(`No warnings for ${user}`);
        return ctx.reply({ embeds: [embed], ephemeral: true });
      }
      if (res.status) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("⚠️ User Warnings Info")
          .setDescription(`Warnings for ${user}`)
          .setFooter({
            text: `Total Warnings: ${res.data.length}`,
            iconURL: author.displayAvatarURL(),
          });
          res.data.forEach((warning, index) => {
            const fetchWarningBy = ctx.guild.members.cache.get(warning.by);
            const warnedByTag = fetchWarningBy ? `<@${fetchWarningBy.id}>` : "Unknown User"; // Menampilkan tag atau fallback jika user tidak ditemukan
        
            embed.addFields({
                name: `Warned by:`,
                value: warnedByTag
            });
            embed.addFields({
                name: `Reason:`,
                value: warning.reason
            });
            embed.addFields({
                name: `Date:`,
                value: formatDate(warning.timestamp)
            });
            // add line kosong 
            if(index !== res.data.length - 1) {
                embed.addFields({
                    name: "\u200B",
                    value: "\u200B",
                    inline: false,
                });
            }
        });
      

        return ctx.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      console.error("Error warning user:", error);
      return ctx.reply(
        `${discordEmotes.error} An error occurred while checking user warnings. Please try again later.`, {ephemeral: true}
      );
    }
  }
  warnUser(guildId, user, reason, ctx) {
    try {
        guildManagement.warnUser(guildId, user, reason, ctx);

        // Menentukan siapa yang memberi peringatan
        const warner = ctx.user ?? ctx.author;  // Slash Command: ctx.user, Prefix Command: ctx.author

        const embedReply = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("⚠️ User Warning")
            .setDescription(`Warned ${user} for: **${reason}**`)
            .setFooter({
                text: `Warned by: ${warner.tag}`,
                iconURL: warner.displayAvatarURL(),
            });

        return ctx.reply?.({ embeds: [embedReply], content: `${user} got a warning from <@${warner.id}>` }) ?? ctx.channel.send({ embeds: [embedReply], content: `${user} got a warning from <@${warner.id}>` });
    } catch (error) {
        console.error("Error warning user:", error);
        return ctx.reply?.(`${discordEmotes.error} An error occurred while warning the user. Please try again later.`)
            ?? ctx.channel.send(`${discordEmotes.error} An error occurred while warning the user. Please try again later.`);
    }
}

  async bugReport(message, bug) {
    const replyMessage = await message.reply(
      {content: `${discordEmotes.loading} Sending bug report.. (Thx for reporting!)\n\nYou can also participate in the development of this bot by contributing to the source code (${config.prefix}sc)`, ephemeral: true}
    );
    try {
      const channel = await client.channels.fetch(config.bugReportChannelID);
      if (!channel) {
        return replyMessage.edit("Bug Report channel not found.");
      }
      const author = message.user ?? message.author; // Slash Command: ctx.user, Prefix Command: ctx.author
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🐛 Bug Report")
        .setDescription(bug)
        .setFooter({
          text: `Reported by ${author.tag}`,
          iconURL: author.displayAvatarURL(),
        })
        .setTimestamp();
      // getBotOwner
      const botOwner = await client.users.fetch(config.ownerId[0]);
      const sentMessage = await channel.send({
        embeds: [embed],
        content: `${botOwner}`
      });
      // Try to crosspost if it's an announcement channel
      if (channel.type === ChannelType.GuildAnnouncement) {
        await sentMessage.crosspost();
        await replyMessage.edit({content:"🐛 Bug report has been sent!", ephemeral: true});
        dataManager.updateBugReport(author.id, new Date());
      } else {
        await replyMessage.edit({content:"🐛 Bug report has been sent!", ephemeral: true});
      }
    } catch (error) {
      console.error("Error saat mengirim bug report:", error);
      message.channel.send(
        {content:`${discordEmotes.error} There was an error while sending bug report.`, ephemeral: true}
      );
    }
  }
  async guildAnnouncement(message, announcement) {
    const author = message.user ?? message.author; // Slash Command: ctx.user, Prefix Command: ctx.author
    try {
      if(!announcement){
        return message.reply({content:"Please provide an announcement.", ephemeral: true});
      }
      const channel = await client.channels.fetch(config.announcementChannelID);
      if (!channel) {
        return message.reply({content:"Announcement channel not found.", ephemeral: true});
      }
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("📢 Guild Announcement")
        .setDescription(announcement)
        .setFooter({
          text: `Announced by ${author.tag}`,
          iconURL: author.displayAvatarURL(),
        })
        .setTimestamp();
      // getBotOwner
      const sentMessage = await channel.send({
        embeds: [embed],
        ephemeral: true
      });
      // Try to crosspost if it's an announcement channel
      if (channel.type === ChannelType.GuildAnnouncement) {
        await sentMessage.crosspost();
      }
      await message.reply({content: "📢 Announcement has been sent!", ephemeral: true});
    } catch (error) {
      console.error("Error sending guild announcement:", error);
      message.reply(
        {content: `${discordEmotes.error} There was an error while sending the announcement.`, ephemeral: true}
      );
    }
  }
}

export { DiscordFormat };
