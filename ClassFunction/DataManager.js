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
    console.log(`Balance for ${user} has been set to ${balance}.`);
    return this.saveData();
  }

  async showLeaderBoard(message, client) {
    const users = this.getAllUsers();
    // get balance terbesar
    const sortedUsers = Object.entries(users).sort(([, a], [, b]) => b.balance - a.balance);
    console.log(sortedUsers);
    const medalEmojis = ["🥇", "🥈", "🥉"]; // Untuk Top 3
    const defaultEmoji = "🏅"; // Untuk posisi 4 sampai 10
  
    const leaderboard = await Promise.all(
      sortedUsers.map(async ([userId, user], index) => {
        const discordUser = await client.users.fetch(userId);
        const rankEmoji = medalEmojis[index] || `${defaultEmoji} #${index + 1}`;
        const balance = formatBalance(user.balance);
        return `${rankEmoji} **${discordUser.username}** — 💰 \`${balance}\``;
      })
    );
  
    const leaderboardEmbed = new EmbedBuilder()
      .setTitle("🏆 Nanami's Top 10 Players")
      .setDescription(leaderboard.join("\n"))
      .setColor("#FFD700")
      .setThumbnail("https://i.ibb.co/DMrjGVR/Trophy.png")
      .setFooter({
        text: "Siapa yang akan jadi Sultan berikutnya? 👑",
        iconURL: message.client.user.displayAvatarURL(),
      })
      .setTimestamp();
      
    return message.reply({ embeds: [leaderboardEmbed], ephemeral: true });
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
      let amount = Math.floor(Math.random() * 1000);
      if (authorId === config.ownerId[0]) {
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
          amount = this.users[userId].balance;
        }

        // Transfer money
        this.users[userId].balance -= amount;
        this.users[authorId].balance += amount;
        robEmbedHelper.setColor("#00FF00");
        robEmbedHelper.setDescription(
          `You successfully robbed ${user} for ${formatBalance(amount)}!\n
          Your balance has been increased by ${formatBalance(amount)}!\n
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
  async takeMoney(author, user, amount, message) {
    const authorId = author.id;
    const userId = user.id;
    if (!this.users[userId]) {
      return message.reply({content:"Target user does not have an account!", ephemeral: true});
    }

    // Deduct from sender
    if (this.users[userId].balance < amount) {
      return message.reply({content:"Target user does not have enough money!", ephemeral: true});
    } else {
      this.users[userId].balance -= amount;
      // Add to receiver
      this.users[authorId].balance += amount;
    }

    this.saveData();
    const takeEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("💸 Money Transfer Successful!")
            .setDescription(
              `${author.username} took ${user.username} some money!`
            )
            .addFields(
              {
                name: "Amount Transferred",
                value: `$${amount.toLocaleString()}`,
                inline: true,
              },
              {
                name: `${author.username}'s New Balance`,
                value: `$${this.users[authorId].balance.toLocaleString()}`,
                inline: true,
              },
              {
                name: `${user.username}'s New Balance`,
                value: `$${this.users[userId].balance.toLocaleString()}`,
                inline: true,
              }
            )
            .setTimestamp()
            .setFooter({ text: "Money Transfer System" });
    
          return message.reply({ embeds: [takeEmbed] });
  }
  async giveMoney(fromUser, toUser, amount, message) {
    const fromUserId = fromUser.id;
    const toUserId = toUser.id;
    try {
      const fromUserData = this.users[fromUserId];
    if (!this.users[toUserId]) {
      throw new Error("Target user does not have an account!");
    }
    if (fromUserData.balance < amount) {
      throw new Error("Insufficient balance!");
    }

    // Deduct from sender
    this.users[fromUserId].balance = fromUserData.balance - amount;
    // Add to receiver
    this.users[toUserId].balance = this.users[toUserId].balance + amount;

    this.saveData();
    const giveEmbed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("💸 Money Transfer Successful!")
            .setDescription(
              `${fromUser.username} gave ${toUser.username} some money!`
            )
            .addFields(
              {
                name: "Amount Transferred",
                value: `$${amount.toLocaleString()}`,
                inline: true,
              },
              {
                name: `${fromUser.username}'s New Balance`,
                value: `$${fromUserData.balance.toLocaleString()}`,
                inline: true,
              },
              {
                name: `${toUser.username}'s New Balance`,
                value: `$${this.users[toUserId].balance.toLocaleString()}`,
                inline: true,
              }
            )
            .setTimestamp()
            .setFooter({ text: "Money Transfer System" });
    
          return message.reply({ embeds: [giveEmbed], ephemeral: true });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(":anger: Error")
        .setDescription(error.message)
        .setFooter({ text: "Nanami" })
        .setTimestamp();

      await message.reply({ embeds: [errorEmbed], ephemeral: true });
    }
    
  }

  async resetAllPlayer() {
    for (const userId in this.users) {
        // Gunakan deep clone agar tiap user dapat data yang unik
        this.users[userId] = JSON.parse(JSON.stringify(newPlayerData));
    }
    this.saveData();
    return this.users;
  }
  async resetPlayer(userId) {
    this.users[userId] = JSON.parse(JSON.stringify(newPlayerData));
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
      const replyGiveawayAll = await message.reply({content: `${discordEmotes.loading} Starting giveaway to all current registered users...`, ephemeral: true});
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
        .setFooter({ text: "this giveaway is only given to current registered users" })
        .setTimestamp();

        return await replyGiveawayAll.edit({content: `${discordEmotes.success} Giveaway All Succeed`, embeds: [giveawayAllEmbed], ephemeral: true});
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
  async userProfile(userId, message, client){
    try {
      const user = await this.getUserProfile(
        userId, client
      );
      if (!user) {
        return message.reply({content :`You need to register first! Use ${config.defaultPrefix}register`, ephemeral: true});
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
                   **Games Lost:** ${user.stats.gamesPlayed - user.stats.gamesWon}
                   **Win Rate:** ${winRate}%`,
            inline: false,
          },
          // fishing information 
          {
            name: "🎣 Fishing Information",
            value: `**Fish Baits:** ${user.fishingItems["bait"]}
                   **Fish Nets:** ${user.fishingItems["net"]}
                   **Fish Rods:** ${user.fishingItems["rod"]}
                   **Fish Caught:** ${user.stats.fishCaught}`,
            inline: false,
          }
        )
        .setFooter({ text: "Player Stats" })
        .setTimestamp();
  
      // Special badge for owner
      if (config.ownerId.includes(userId)) {
        profileEmbed.setDescription("🎭 **BOT OWNER**").setColor("#FFD700"); // Gold color for owner
      }
  
      return message.reply({ embeds: [profileEmbed], ephemeral: true });
    } catch (error) {
      console.error("Error in userProfile:", error);
      return message.reply({content :`Error in userProfile: ${error.message}`, ephemeral: true});
    }
        
        
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
  async getInventory(context, userId, user) {
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
            .setFooter({ text: `Page ${page + 1} of ${totalPages === 0 ? 1 : totalPages}`, iconURL: user.displayAvatarURL({ dynamic: true, size: 256 }) })
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
        .setDisabled(currentPage === totalPages - 1 || totalPages === 0);

    const row = new ActionRowBuilder().addComponents(previousButton, nextButton);

    // ✅ Cek apakah ini slash command atau prefix command
    const isSlashCommand = context.isChatInputCommand?.() ?? false;
    const userIdCheck = isSlashCommand ? context.user.id : context.author.id;

    // ✅ Gunakan metode reply yang benar
    let reply;
    if (isSlashCommand) {
        reply = await context.reply({ embeds: [generateEmbed(currentPage)], components: [row], fetchReply: true, ephemeral: true });
    } else {
        reply = await context.reply({ embeds: [generateEmbed(currentPage)], components: [row], ephemeral: true });
    }

    // ✅ Perbaikan collector agar bekerja di semua tipe command
    const collector = reply.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (btnInteraction) => {
        if (btnInteraction.user.id !== userIdCheck) {
            return btnInteraction.reply({ content: "You can't use this button!", ephemeral: true });
        }

        if (btnInteraction.customId === "nextPage" && currentPage < totalPages - 1) {
            currentPage++;
        } else if (btnInteraction.customId === "prevPage" && currentPage > 0) {
            currentPage--;
        }

        previousButton.setDisabled(currentPage === 0);
        nextButton.setDisabled(currentPage === totalPages - 1);

        await btnInteraction.update({ embeds: [generateEmbed(currentPage)], components: [row], ephemeral:true });
    });

    collector.on("end", () => {
        previousButton.setDisabled(true);
        nextButton.setDisabled(true);
        reply.edit({ components: [row], ephemeral:true }).catch(console.error);
    });
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
    const checkUser = this.users[userId];
    if (!checkUser) return false;
    // Reset inventory to default state 
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
  async resetAllBalance(message) {
    try {
      for (const userId in this.users) {
        this.users[userId].balance = config.startingBalance;
      }
      this.saveData();
      await message.reply({content:`${discordEmotes.success} All player's balance have been reset.`, ephemeral: true});
    } catch (error) {
      console.error('Error resetting all balances:', error);
      await message.reply({content:`${discordEmotes.error} An error occurred while resetting all player's balance. Please try again later.`, ephemeral: true});
    }
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