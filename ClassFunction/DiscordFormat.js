import {
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import { client } from "../index.js";
import { config, discordEmotes } from "../config.js";
import { DataManager } from "./DataManager.js";
const dataManager = new DataManager();
class DiscordFormat {
    constructor() {
      if (!DiscordFormat.instance) {
        this.color = "#FFF000";
        this.title = "Nanami";
        DiscordFormat.instance = this;
      }
      return DiscordFormat.instance;
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