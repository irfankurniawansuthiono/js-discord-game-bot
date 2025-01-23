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
      this.color = "#FFF000";
      this.title = "Nanami";
    }
    // async deleteMessages(message, amount = 100) {
    //     try {
            
    //     } catch (error) {
    //         console.error("Error saat menghapus pesan:", error);
    //         message.channel.send("There was an error while deleting messages.");
    //     }
    // }
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