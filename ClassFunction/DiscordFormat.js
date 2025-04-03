import { EmbedBuilder, ChannelType, PermissionFlagsBits } from "discord.js";
import { client, formatDate } from "../index.js";
import { config, discordEmotes } from "../config.js";
import { DataManager } from "./DataManager.js";
import GuildManagement from "./GuildManagement.js";
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
    try {
      const guildId = message.guild.id;
      const channel = message.channel;
      guildManagement.unlockChannel(guildId, channel);
      const embedBuilder = new EmbedBuilder()
        .setColor("#00FF00")
        .setDescription(
          `Channel ${message.channel} has been unlocked by ${message.author}`
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
    try {
      const guildId = message.guild.id;
      const channel = message.channel;
      guildManagement.lockChannel(guildId, channel);
      const embedBuilder = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(
          `Channel ${message.channel} has been locked by ${message.author}`
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
  async setWelcome(guildId, channelId, message = "Welcome New Member!!") {
    try {
      // Cek validitas channel ID
      const channel = await message.guild.channels.fetch(channelId);
      if (!channel) {
        return message.reply(
          `${discordEmotes.error} Invalid channel ID. Please provide a valid channel.`
        );
      }

      // Atur welcome message di data
      await guildManagement.setWelcome(guildId, channelId);

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

  async deleteMessages(message, amount = 1000) {
    try {
      if (isNaN(amount) || amount < 1 || amount > 1000) {
        return message.channel.send(
          "Please provide a number between 1 and 1000."
        );
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
        `<a:success:1331856899070496819> Successfully deleted ${totalDeleted} messages!`
      );

      // Hapus pesan konfirmasi setelah 5 detik
      setTimeout(() => {
        confirmationMessage.delete().catch(console.error);
      }, 5000);
    } catch (error) {
      console.error("Error saat menghapus pesan:", error);
      message.channel.send(
        "An error occurred while trying to delete messages."
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
  async kickUser(message, mentionedUser) {
    try {
      // Validate user object and permissions
      const member = message.guild.members.resolve(mentionedUser);

      if (!member) {
        return message.channel.send(
          "Invalid user. Please mention a valid server member."
        );
      }

      if (!member.kickable) {
        return message.channel.send(
          "I cannot kick this user due to role hierarchy or permissions."
        );
      }

      // Kick the user
      await member.kick({ reason: `Kicked by ${message.author.tag}` });
      message.channel.send(
        `${discordEmotes.success} ${member.user.tag} has been kicked.`
      );
    } catch (error) {
      console.error("Error kicking user:", error);

      switch (error.code) {
        case 50013:
          message.channel.send("Insufficient permissions to kick this user.");
          break;
        default:
          message.channel.send(
            "An unexpected error occurred while trying to kick the user."
          );
      }
    }
  }

  async setNickname(message, mentionedUser, newNick) {
    try {
      // Ambil GuildMember dari user yang disebut
      const member = message.guild.members.cache.get(mentionedUser.id);

      if (!member) {
        return message.channel.send(`${discordEmotes.error} user not found.`);
      }

      // Ubah nickname
      // check if the bot can edit the nickname
      if (!member.manageable) {
        return message.channel.send(
          `${discordEmotes.error} I cannot change the nickname of this user due to role hierarchy or permissions.`
        );
      }
      await member.setNickname(newNick);
      message.channel.send(
        `Nickname for ${mentionedUser} success changed to ${newNick}!`
      );
    } catch (error) {
      console.error("Error saat mengubah nickname:", error);
      message.channel.send("There was an error while changing nickname");
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
  warnInfo(guildId, userId, message) {
    try {
      const res = guildManagement.warnInfo(guildId, userId, message);
      if (!res.status) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("⚠️ User Warnings Info")
          .setDescription(`No warnings for <@${userId}>`);
        return message.reply({ embeds: [embed] });
      }
      if (res.status) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("⚠️ User Warnings Info")
          .setDescription(`Warnings for <@${userId}>`)
          .setFooter({
            text: `total warnings: ${res.data.length}`,
            iconURL: message.author.displayAvatarURL(),
          });
        res.data.forEach((warning) => {
          const fetchWarningBy = message.guild.members.cache.get(warning.by);
          embed.addFields({
            name: `Warned by: ${fetchWarningBy.user.tag}`,
            value: `\nReason: ${warning.reason}\nDate: ${formatDate(
              warning.timestamp
            )}`,
          });
        });

        return message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error warning user:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while checking user warnings. Please try again later.`
      );
    }
  }
  warnUser(guildId, user, reason, message) {
    try {
      guildManagement.warnUser(guildId, user, reason, message);
      const embedReply = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("⚠️ User Warnings")
        .setDescription(`Warned ${user} for ${reason}`)
        .setFooter({
          text: `warned by: ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        });
      return message.reply({ embeds: [embedReply] });
    } catch (error) {
      console.error("Error warning user:", error);
      return message.reply(
        `${discordEmotes.error} An error occurred while warning the user. Please try again later.`
      );
    }
  }
  async bugReport(message, bug) {
    const replyMessage = await message.reply(
      `${discordEmotes.loading} Sending bug report.. (Thx for reporting!)\n\nYou can also participate in the development of this bot by contributing to the source code (${config.prefix}sc)`
    );
    try {
      const channel = await client.channels.fetch(config.bugReportChannelID);
      if (!channel) {
        return replyMessage.edit("Bug Report channel not found.");
      }

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🐛 Bug Report")
        .setDescription(bug)
        .setFooter({
          text: `Reported by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();
      // getBotOwner
      const botOwner = await client.users.fetch(config.ownerId[0]);
      const sentMessage = await channel.send({
        embeds: [embed],
        content: `${botOwner}`,
      });
      // Try to crosspost if it's an announcement channel
      if (channel.type === ChannelType.GuildAnnouncement) {
        await sentMessage.crosspost();
        await replyMessage.edit("🐛 Bug report has been sent!");
        dataManager.updateBugReport(message.author.id, new Date());
      } else {
        await replyMessage.edit("🐛 Bug report has been sent!");
      }
    } catch (error) {
      console.error("Error saat mengirim bug report:", error);
      message.channel.send(
        `${discordEmotes.error} There was an error while sending bug report.`
      );
    }
  }
}

export { DiscordFormat };
