import { ChannelType } from "discord.js";
import { discordEmotes } from "../config";
class AnonChat {
  constructor() {  
    this.sessions = new Map();
  }

  async joinSession(message) {
    if (message.channel.type !== ChannelType.DM) {
      return message.reply(`${discordEmotes.error} This command can only be used in DMs.`);
    }

    const userId = message.author.id;

    // Check if the user is already in a session
    if (this.sessions.has(userId)) {
      return message.channel.send(`${discordEmotes.error} You are already in an anonymous chat session.`);
    }

    // Look for a user waiting for a partner
    const waitingUser = Array.from(this.sessions.entries()).find(
      ([, partner]) => partner === null
    );

    if (waitingUser) {
      const [waitingUserId] = waitingUser;

      // Pair the users
      this.sessions.set(userId, waitingUserId);
      this.sessions.set(waitingUserId, userId);

      const waitingUserDM = await message.client.users.fetch(waitingUserId);
      await waitingUserDM.send(`${discordEmotes.success} You are now connected to an anonymous partner. Start messaging!`);
      await message.author.send(`${discordEmotes.success} You are now connected to an anonymous partner. Start messaging!`);
    } else {
      // Add the user to the waiting list
      this.sessions.set(userId, null);
      await message.channel.send(`${discordEmotes.loading} You are now waiting for an anonymous partner...`);
    }
  }

  async handleMessage(message) {
    if (message.channel.type !== ChannelType.DM) return;

    const userId = message.author.id;

    // Check if the user is in a session
    if (!this.sessions.has(userId)) return;

    const partnerId = this.sessions.get(userId);

    if (!partnerId) {
      return message.channel.send("You are not connected to an anonymous partner yet.");
    }

    try {
      // Forward the message to the partner
      const partnerDM = await message.client.users.fetch(partnerId);
      await partnerDM.send(`🗣️ Anonymous Partner: ${message.content}`);
    } catch (error) {
      console.error("Failed to forward message:", error);
      message.channel.send(`${discordEmotes.error} Failed to send the message to your partner. Please try again.`);
    }
  }
//   check user session for message create
  async checkSession (message) {
    const userId = message.author.id;
    if (!this.sessions.has(userId)) {
      return false;
    }else{
      return true;
    }
  }
  async leaveSession(message) {
    if (message.channel.type !== ChannelType.DM) {
      return message.reply("This command can only be used in DMs.");
    }

    const userId = message.author.id;

    // Check if the user is in a session
    if (!this.sessions.has(userId)) {
      return message.channel.send(`${discordEmotes.error} You are not currently in an anonymous chat session.`);
    }

    const partnerId = this.sessions.get(userId);

    // Remove both users from the session
    this.sessions.delete(userId);
    if (partnerId) this.sessions.delete(partnerId);

    await message.channel.send(`${discordEmotes.success} You have left the anonymous chat session.`);

    if (partnerId) {
      const partnerDM = await message.client.users.fetch(partnerId);
      await partnerDM.send(`😢 Your anonymous partner has left the chat.`);
    }
  }
}

export default AnonChat;
