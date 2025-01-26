import {
  EmbedBuilder,
  ChannelType,
} from "discord.js";
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
          return message.reply(`${discordEmotes.error} Invalid guild or role ID.`);
        }
        guildManagement.setWelcomeRole(guildId, role);
        return message.reply(`${discordEmotes.success} Welcome role set successfully.`);
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
        return message.reply(`${discordEmotes.success} Welcome role disabled successfully.`);
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
    return guildManagement.setupBusinessGuild(message.client, guildId, channelName);
  }
    async unlockChannel(message) {
      try {
        const guildId = message.guild.id;
        const channel = message.channel;
        guildManagement.unlockChannel(guildId, channel);
        const embedBuilder = new EmbedBuilder()
            .setColor("#00FF00")
            .setDescription(`Channel ${message.channel} has been unlocked by ${message.author}`);
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
            .setDescription(`Channel ${message.channel} has been locked by ${message.author}`);
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
  async unbanUser(message, userId) {
    try {
      // Bersihkan input userId dari mention jika ada
      userId = userId.replace(/<@!?(\d+)>/, "$1"); // Hanya ambil ID numerik dari mention
  
      // Periksa apakah userId valid (hanya angka)
      if (!/^\d+$/.test(userId)) {
        return message.reply(`${discordEmotes.error} Invalid user ID.`);
      }
  
      // Cek apakah user ID ada dalam daftar ban
      const bannedUser = await message.guild.bans.fetch(userId).catch(() => null);
      if (!bannedUser) {
        return message.reply(`${discordEmotes.error} This user is not banned or does not exist.`);
      }
  
      // Hapus ban
      await message.guild.bans.remove(userId);
      return message.reply(`${discordEmotes.success} User unbanned successfully.`);
    } catch (error) {
      console.error("Error unbanning user:", error);
      return message.reply(`${discordEmotes.error} An error occurred while unbanning the user. Please try again later.`);
    }
  }
  async banUser(message, userId, days, reason) {
    try {
      // Fetch user (might fail if user is not in the server)
      const user = await message.guild.members.fetch(userId).catch(() => null);
  
      // Attempt to send a DM to the user
      if (user) {
        await user.send(`You have been banned from **${message.guild.name}** for the following reason: \n**${reason}**\nDuration: ${days} days.`).catch(() => {
          console.warn(`Failed to send DM to user ${userId}`);
        });
      }
  
      // Perform the ban
      await message.guild.members.ban(userId, { days, reason });
      return message.reply(`${discordEmotes.success} User has been banned successfully.`);
    } catch (error) {
      console.error("Error banning user:", error);
  
      if (error.code === 10013) { // Unknown User
        return message.reply(`${discordEmotes.error} User not found.`);
      }
  
      if (error.code === 50013) { // Missing Permissions
        return message.reply(`${discordEmotes.error} I do not have permission to ban this user.`);
      }
  
      return message.reply(`${discordEmotes.error} An error occurred while banning the user. Please try again later.`);
    }
  }
  timeoutUser(message, userId, time, reason) {
    try {
      // Fetch user (might fail if user is not in the server)
      const user = message.guild.members.cache.get(userId);
  
      // Attempt to send a DM to the user
      if (user) {
        user.send(`You have been timed out from **${message.guild.name}** for the following reason: \n**${reason}**\nDuration: ${time} minutes.`).catch(() => {
          console.warn(`Failed to send DM to user ${userId}`);
        });
      }
  
      // Perform the timeout
      user.timeout(time * 60 * 1000, reason);
      return message.reply(`${discordEmotes.success} User has been timed out successfully.`);
    } catch (error) {
      console.error("Error timing out user:", error);
      return message.reply(`${discordEmotes.error} An error occurred while timing out the user. Please try again later.`);
    }
  }
    async deleteMessages(message, amount = 1000) {
      try {
          if (isNaN(amount) || amount < 1 || amount > 1000) {
              return message.channel.send("Please provide a number between 1 and 1000.");
          }
  
          let totalDeleted = 0;
  
          while (amount > 0) {
              // Tentukan jumlah pesan yang akan diambil dalam batch ini
              const limit = amount > 100 ? 100 : amount;
              const fetchedMessages = await message.channel.messages.fetch({ limit });
  
              // Filter pesan yang lebih dari 14 hari
              const messagesToDelete = fetchedMessages.filter(
                  msg => (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000
              );
  
              if (messagesToDelete.size === 0) break;
  
              // Hapus pesan
              await message.channel.bulkDelete(messagesToDelete);
  
              totalDeleted += messagesToDelete.size;
              amount -= messagesToDelete.size;
  
              // Delay untuk menghindari rate limit
              await new Promise(resolve => setTimeout(resolve, 1000));
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
          message.channel.send("An error occurred while trying to delete messages.");
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
            permissionOverwrites: channelPermissions
        });
 
        // Optional: Send a confirmation message in the new channel
        await newChannel.send(`${discordEmotes.success} Channel has been recreated.`);
 
    } catch (error) {
        console.error("Error nuking and recreating channel:", error);
        message.channel.send("An error occurred while trying to nuke and recreate the channel.");
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
            return message.channel.send("Invalid user. Please mention a valid server member.");
        }

        if (!member.kickable) {
            return message.channel.send("I cannot kick this user due to role hierarchy or permissions.");
        }

        // Kick the user
        await member.kick({ reason: `Kicked by ${message.author.tag}` });
        message.channel.send(`${discordEmotes.success} ${member.user.tag} has been kicked.`);

    } catch (error) {
        console.error("Error kicking user:", error);

        switch (error.code) {
            case 50013:
                message.channel.send("Insufficient permissions to kick this user.");
                break;
            default:
                message.channel.send("An unexpected error occurred while trying to kick the user.");
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
        await member.setNickname(newNick);
        message.channel.send(
          `Nickname for ${mentionedUser} success changed to ${newNick}!`
        );
      } catch (error) {
        console.error("Error saat mengubah nickname:", error);
        message.channel.send("There was an error while changing nickname.");
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
        return message.reply(`${discordEmotes.error} An error occurred while clearing user warnings. Please try again later.`);
      }
    }
    warnInfo(guildId,userId, message) {
      try {
        const res = guildManagement.warnInfo(guildId, userId, message);
        if (!res.status) {
          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("⚠️ User Warnings Info")
            .setDescription(`No warnings for <@${userId}>`);
          return message.reply({ embeds: [embed] });
        };
        if(res.status){
          const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("⚠️ User Warnings Info")
          .setDescription(`Warnings for <@${userId}>`)
          .setFooter({text: `total warnings: ${res.data.length}`, iconURL: message.author.displayAvatarURL()});
          res.data.forEach((warning) => {
            const fetchWarningBy = message.guild.members.cache.get(warning.by);
            embed.addFields({name: `Warned by: ${fetchWarningBy.user.tag}`, value: `\nReason: ${warning.reason}\nDate: ${formatDate(warning.timestamp)}` });
          });
          
          return message.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error("Error warning user:", error);
        return message.reply(`${discordEmotes.error} An error occurred while checking user warnings. Please try again later.`);
      }
    }
    warnUser(guildId, user, reason, message) {
      try {
        guildManagement.warnUser(guildId, user, reason, message);
        const embedReply = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("⚠️ User Warnings")
          .setDescription(`Warned ${user} for ${reason}`)
          .setFooter({text: `warned by: ${message.author.tag}`, iconURL: message.author.displayAvatarURL()});
        return message.reply({ embeds: [embedReply] });
      } catch (error) {
        console.error("Error warning user:", error);
        return message.reply(`${discordEmotes.error} An error occurred while warning the user. Please try again later.`);
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