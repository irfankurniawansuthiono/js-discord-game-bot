import { ChannelType } from "discord.js";
import { config, discordEmotes } from "../config.js";

class AnonChat {
    constructor(client) {
      this.sessions = new Map(); // Map of userId -> partnerId
      this.client = client;
    }
  
    async setClient(client) {
      this.client = client;
    }
    /**
     * Helper method to send a message to a user via DM.
     */
    async sendDM(userId, content, files = [], options = {}) {
        try {
          const user = await this.client.users.fetch(userId);
          
          // Mengirim DM dengan file atau tanpa file
          const messageOptions = { content, files, ...options };
      
          await user.send(messageOptions);
        } catch (error) {
          console.error(`Failed to send DM to user ${userId}:`, error);
        }
      }
      
  
    /**
     * Handles joining a session.
     */
    async joinSession(message) {
      const author = message.user ?? message.author;
      if (message.channel.type !== ChannelType.DM) {
        return message.reply({ content: `${discordEmotes.error} This command can only be used in DMs.`, ephemeral: true });
      }
  
      const userId = author.id;
  
      // Check if the user is already in a session
      if (this.sessions.has(userId)) {
        return this.sendDM(userId, `${discordEmotes.error} You are already in an anonymous chat session.`);
      }
  
      // Look for a user waiting for a partner
      const waitingUserId = [...this.sessions.keys()].find((id) => this.sessions.get(id) === null);
  
      if (waitingUserId) {
        // Pair the users
        this.sessions.set(userId, waitingUserId);
        this.sessions.set(waitingUserId, userId);
  
        await this.sendDM(waitingUserId,`${discordEmotes.success} You are now connected to an anonymous partner. Start messaging!`);
        await this.sendDM(userId, `${discordEmotes.success} You are now connected to an anonymous partner. Start messaging!`);
      } else {
        // Add the user to the waiting list
        this.sessions.set(userId, null);
        await this.sendDM(userId, `${discordEmotes.loading} You are now waiting for an anonymous partner...`);
      }
    }
  
    /**
     * Handles messages in an anonymous session.
     */
    async handleMessage(message) {
      if (message.channel.type !== ChannelType.DM) return;
  
      const userId = message.author.id;
  
      // Check if the user is in a session
      if (!this.sessions.has(userId)) return;
  
      const partnerId = this.sessions.get(userId);
      if (!partnerId) {
        return this.sendDM(userId, `${discordEmotes.error} You are not connected to an anonymous partner yet.`);
      }
  
      try {
        // Send all attachments to the partner
        if (message.attachments.size > 0) {
            for (const attachment of message.attachments.values()) {
              await this.sendDM(partnerId, "📎 Attachment received", [attachment.url]);
            }
          }
  
        // Send the text message to the partner
        if (message.content.trim()) {
          await this.sendDM(partnerId, `🗣️ : ${message.content}`);
        }
  
        // Log the message to the specified server channel
        const logChannel = await this.client.channels.fetch(config.anonimLogsChannelID);
  
        if (logChannel && logChannel.isTextBased()) {
            if (message.attachments.size > 0) {
                for (const attachment of message.attachments.values()) {
                  const partnerId = this.sessions.get(message.author.id);
                  const partner = await this.client.users.fetch(partnerId);
                  await logChannel.send({
                    content: `${partner} | ${message.author} : 📎 Attachment received:`,
                    files: [attachment.url]
                  });
                }
              }
              
              if (message.content.trim()) {
                const partnerId = this.sessions.get(message.author.id);
                const partner = await this.client.users.fetch(partnerId);
                await logChannel.send(`${partner} | ${message.author}: ${message.content}`);
              }
              
        }
      } catch (error) {
        console.error("Failed to forward message:", error);
        await this.sendDM(userId, `${discordEmotes.error} Failed to send the message to your partner. Please try again.`);
      }
    }
  
    /**
     * Handles leaving a session.
     */
    async leaveSession(message) {
      const author = message.user ?? message.author;
      if (message.channel.type !== ChannelType.DM) {
        return message.reply(`${discordEmotes.error} This command can only be used in DMs.`);
      }
  
      const userId = author.id;
  
      // Check if the user is in a session
      if (!this.sessions.has(userId)) {
        return this.sendDM(userId, `${discordEmotes.error} You are not currently in an anonymous chat session.`);
      }
  
      const partnerId = this.sessions.get(userId);
  
      // Remove both users from the session
      this.sessions.delete(userId);
      if (partnerId) this.sessions.delete(partnerId);
  
      await this.sendDM(userId, `${discordEmotes.success} You have left the anonymous chat session.`);
  
      if (partnerId) {
        await this.sendDM(partnerId, "😢 Your anonymous partner has left the chat. To join again, use the join command.");
      }
    }
  async checkSession (message) {
    const userId = message.author.id;
    if (!this.sessions.has(userId)) {
      return false;
    }else{
      return true;
    }
  }
}
  

export default AnonChat;
