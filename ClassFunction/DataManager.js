import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
} from "discord.js";
import { config, discordEmotes, newPlayerData } from "../config.js";
import fs from "fs";
import { formatBalance } from "../index.js";
const dataFile = config.dataFile
class DataManager {
  constructor() {
    if (!DataManager.instance) {
        this.users = {};
        this.loadData();
        DataManager.instance = this;
      }
      return DataManager.instance;
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
    this.users[fromUserId].balance = fromUser.balance - amount;
    // Add to receiver
    this.users[toUserId].balance = this.users[toUserId].balance + amount;

    this.saveData();
    return {
      fromUser: this.users[fromUserId],
      toUser: this.users[toUserId],
    };
  }

  async resetAllPlayer() {
    for (const userId in this.users) {
      this.users[userId] = newPlayerData;
    }
    this.saveData();
    return this.users;
  }
  async resetPlayer(userId) {
    this.users[userId] = newPlayerData;
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
      if (fs.existsSync(dataFile)) {
        const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
        
        // Update or create users dynamically
        for (const userId in data) {
          if (!this.users[userId]) {
            this.users[userId] = {};
          }
          
          // Update user data
          Object.assign(this.users[userId], data[userId]);
        }
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
      fs.writeFileSync(dataFile, JSON.stringify(this.users, null, 4));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }
  async giveawayAll(balance, message) {
    try {
      const replyGiveawayAll = await message.reply(`${discordEmotes.loading} Starting giveaway to all current registered users...`);
      let count = 0;
      for (const userId in this.users) {
        this.users[userId].balance = this.users[userId].balance + balance;
        count++;
      }
      this.saveData();
      const giveawayAllEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🎉 Giveaway All Succeed")
        .setDescription(
          `You have successfully given all users ${formatBalance(
            balance
          )}! You have given ${count} users!`
        )
        .setFooter({ text: "this balance giveaway is only given to current registered users" })
        .setTimestamp();

        return await replyGiveawayAll.edit({ embeds: [giveawayAllEmbed], message: `${discordEmotes.success} Giveaway All Succeed` });
    } catch (error) {
      console.error("Error in giveawayAll:", error.message);
    }
  }
  getAllUsers() {
    return this.users;
  }
  getUser(userId) {
    return this.users[userId];
  }
  updateUserBait (userId, bait) {
    this.users[userId].bait = bait;
    return this.saveData();
  }
  getInventoryData(userId, type) {
    return this.users[userId]?.inventory?.[type] || [];
  }
  updateInventory(userId, type, item) {
    this.users[userId].inventory[type] = item;
  }
  async getInventory(message, userId, user) {
    const rarityEmojis = {
        "common": "⚪",
        "uncommon": "🟢",
        "rare": "🔵",
        "epic": "🟣",
        "legendary": "🟠",
        "mythical": "🔴"
    };

    const userInventory = this.users[userId]?.inventory || { fishing: [] };
    const totalFish = userInventory.fishing.reduce((total, fish) => total + fish.amount, 0);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(userInventory.fishing.length / itemsPerPage);
    let currentPage = 0;

    function generateEmbed(page) {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const fishingItems = userInventory.fishing.slice(start, end).map(item => {
            const emoji = rarityEmojis[item.rarity] || "❓";
            return `${emoji} **${item.amount}x** ${item.name} - 💰 $${item.price.toLocaleString()}`;
        }).join("\n") || "*No fish caught yet!*";

        return new EmbedBuilder()
            .setColor(userInventory.fishing.length > 5 ? "#00FF00" : "#FF0000")
            .setTitle(`🎒 ${user.username} Inventory`)
            .setDescription(`Total Fish in Inventory: ${totalFish}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: `Page ${page + 1} of ${totalPages}`, iconURL: user.displayAvatarURL({ dynamic: true, size: 256 }) })
            .setTimestamp()
            .addFields({ name: "🎣 Fishing", value: fishingItems });
    }

    const previousButton = new ButtonBuilder()
        .setCustomId("prevPage")
        .setLabel("◀️")
        .setStyle(1)
        .setDisabled(currentPage === 0);

    const nextButton = new ButtonBuilder()
        .setCustomId("nextPage")
        .setLabel("▶️")
        .setStyle(1)
        .setDisabled(currentPage === totalPages - 1);

    const row = new ActionRowBuilder().addComponents(previousButton, nextButton);
    const reply = await message.reply({ embeds: [generateEmbed(currentPage)], components: [row] });

    const collector = reply.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
            return interaction.reply({ content: "You can't use this button!", ephemeral: true });
        }

        if (interaction.customId === "nextPage" && currentPage < totalPages - 1) {
            currentPage++;
        } else if (interaction.customId === "prevPage" && currentPage > 0) {
            currentPage--;
        }

        previousButton.setDisabled(currentPage === 0);
        nextButton.setDisabled(currentPage === totalPages - 1);

        await interaction.update({ embeds: [generateEmbed(currentPage)], components: [row] });
    });
    collector.on("end", () => {
        previousButton.setDisabled(true);
        nextButton.setDisabled(true);
        reply.edit({ components: [row] });
    })
}
getUserBait(userId) {
  return this.users[userId]?.fishingItems.bait || 0;
}
updateBait(userId, bait) {
  this.users[userId].fishingItems.bait += bait;
  this.saveData();
}

setbait(userId, bait) {
  this.users[userId].fishingItems.bait = bait;
  this.saveData();
}

  saveInventory(userId, item, type) {
    // cari agar tidak ada duplikat data di inventory
    const inventory = this.users[userId].inventory[type].find((i) => i.name === item.name);

    if (inventory) {
      inventory.amount += 1;
    } else {
      this.users[userId].inventory[type].push({ ...item, amount: 1 });
    }
    this.saveData();
  }
  resetInventory(userId) {
    this.users[userId].inventory = {
      fishing:[]
    };
    this.saveData();
  }
  createUser(userId) {
    this.users[userId] = JSON.parse(JSON.stringify(newPlayerData));;
    this.saveData();
    return this.users[userId];
  }

  updateBalance(userId, amount) {
    if (!this.users[userId]) return false;
    this.users[userId].balance += amount;
    this.users[userId].stats.totalEarnings += amount;
    this.saveData();
    return true;
    
  }
  updateBugReport(userId, date) {
    if (!this.users[userId]) return false;
    this.users[userId].lastBugReport = date;
    this.saveData();
    return true;
  }
  addFishCaught(userId) {
    if (!this.users[userId]) return false;
    this.users[userId].stats.fishCaught += 1;
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

export {DataManager};