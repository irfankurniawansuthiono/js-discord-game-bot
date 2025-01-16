import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";
const fs = require("fs");

// Configuration
const config = {
  token: process.env.TOKEN,
  ownerId: "411125001853468672",
  defaultPrefix: "N!",
  startingBalance: 100,
  dataFile: "./players.json"
};

// Initialize bot with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let prefix = config.defaultPrefix;

// Data Management
class DataManager {
  constructor() {
    this.users = {};
    this.loadData();
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
      createdAt: discordUser.createdAt
    };
  }
  loadData() {
    try {
      if (fs.existsSync(config.dataFile)) {
        const data = JSON.parse(fs.readFileSync(config.dataFile, "utf8"));
        // Ensure all users have the required stats structure
        Object.keys(data).forEach(userId => {
          if (!data[userId].stats) {
            data[userId].stats = {
              gamesPlayed: 0,
              gamesWon: 0,
              totalEarnings: 0
            };
          }
        });
        this.users = data;
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
      fs.writeFileSync(config.dataFile, JSON.stringify(this.users, null, 4));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  getUser(userId) {
    return this.users[userId];
  }

  createUser(userId) {
    this.users[userId] = {
      balance: config.startingBalance,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0
      }
    };
    this.saveData();
    return this.users[userId];
  }

  updateBalance(userId, amount) {
    if (!this.users[userId]) return false;
    this.users[userId].balance += amount;
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
        totalEarnings: 0
      };
    }

    user.stats.gamesPlayed++;
    if (won) user.stats.gamesWon++;
    user.stats.totalEarnings += amount;
    this.saveData();
    return true;
  }
}

const dataManager = new DataManager();

// Games
class Games {
  static async coinFlip(message, bet, choice) {
    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    const outcome = Math.random() < 0.5 ? "h" : "t";
    const won = choice === outcome;
    const amount = won ? bet : -bet;
    
    dataManager.updateBalance(message.author.id, amount);
    dataManager.updateStats(message.author.id, won, amount);
    
    // Get fresh user data after updates
    user = dataManager.getUser(message.author.id);

    return message.reply(
      `Coin shows ${outcome === 'h' ? 'Heads' : 'Tails'}! You ${won ? 'won' : 'lost'} $${Math.abs(amount)}. Current balance: $${user.balance}`
    );
  }

  static async numberGuess(message, bet, guess) {
    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    const number = Math.floor(Math.random() * 10) + 1;
    const won = parseInt(guess) === number;
    const amount = won ? bet * 5 : -bet;
    
    dataManager.updateBalance(message.author.id, amount);
    dataManager.updateStats(message.author.id, won, amount);
    
    user = dataManager.getUser(message.author.id);

    return message.reply(
      `Number was ${number}! You ${won ? 'won' : 'lost'}! ${won ? `Congratulations! You won $${amount}` : `You lost $${Math.abs(amount)}`}. Current balance: $${user.balance}`
    );
  }

  static async diceRoll(message, bet, guess) {
    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    const won = parseInt(guess) === total;
    const amount = won ? bet * 8 : -bet;
    
    dataManager.updateBalance(message.author.id, amount);
    dataManager.updateStats(message.author.id, won, amount);
    
    user = dataManager.getUser(message.author.id);

    return message.reply(
      `Dice rolled: ${dice1} + ${dice2} = ${total}! You ${won ? 'won' : 'lost'}! ${won ? `Amazing! You won $${amount}` : `You lost $${Math.abs(amount)}`}. Current balance: $${user.balance}`
    );
  }
}

// Commands remain the same as in the previous version
const commands = {
  register: (message) => {
    if (dataManager.getUser(message.author.id)) {
      return message.reply("You already have an account!");
    }
    const user = dataManager.createUser(message.author.id);
    return message.reply(`Welcome! You start with $${user.balance}.`);
  },

  balance: async (message) => {
    const user = await dataManager.getUserProfile(message.author.id, client);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }

    const winRate = ((user.stats.gamesWon / user.stats.gamesPlayed) * 100 || 0).toFixed(1);
    
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
          inline: false
        },
        // Financial Information
        {
          name: "💰 Financial Status",
          value: `**Current Balance:** $${user.balance.toLocaleString()}
                 **Total Earnings:** $${user.stats.totalEarnings.toLocaleString()}`,
          inline: false
        },
        // Gaming Statistics
        {
          name: "🎮 Gaming Statistics",
          value: `**Games Played:** ${user.stats.gamesPlayed}
                 **Games Won:** ${user.stats.gamesWon}
                 **Win Rate:** ${winRate}%`,
          inline: false
        }
      )
      .setFooter({ text: "Game Bot Stats" })
      .setTimestamp();

    // Special badge for owner
    if (message.author.id === config.ownerId) {
      profileEmbed.setDescription("🎭 **BOT OWNER**")
        .setColor("#FFD700"); // Gold color for owner
    }

    return message.reply({ embeds: [profileEmbed] });
  },

  // Add a new profile command as an alias for balance
  profile: async (message) => {
    return commands.balance(message);
  },

  flip: (message, args) => {
    const bet = parseInt(args[1]);
    const choice = args[2]?.toLowerCase();
    if (!bet || !["h", "t"].includes(choice)) {
      return message.reply("Usage: !flip <bet> <h/t>");
    }
    return Games.coinFlip(message, bet, choice);
  },

  guess: (message, args) => {
    const bet = parseInt(args[1]);
    const guess = args[2];
    if (!bet || !guess || guess < 1 || guess > 10) {
      return message.reply("Usage: !guess <bet> <number 1-10>");
    }
    return Games.numberGuess(message, bet, guess);
  },

  dice: (message, args) => {
    const bet = parseInt(args[1]);
    const guess = args[2];
    if (!bet || !guess || guess < 2 || guess > 12) {
      return message.reply("Usage: !dice <bet> <sum 2-12>");
    }
    return Games.diceRoll(message, bet, guess);
  },

  help: (message) => {
    const helpEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Game Bot Commands")
      .setDescription("Available commands:")
      .addFields(
        { 
          name: "Basic Commands", 
          value: [
            `**${prefix}register** \n Create new account`,
            `**${prefix}balance** \n Check balance and stats`,
            `**${prefix}help** \n Show this message`,
            `**${prefix}profile** \n Alias for balance`,
            `**${prefix}ownerinfo** \n Show bot owner information`,
  `**${prefix}say** <#channel/@user> <message> \n Send a message to a channel or DM a user`

          ].join('\n\n')
        },
        { 
          name: "Games", 
          value: [
            `**${prefix}flip** <bet> <h/t> \n Flip a coin (2x multiplier)`,
            `**${prefix}guess** <bet> <1-10> \n Guess a number (5x multiplier)`,
            `**${prefix}dice** <bet> <2-12> \n Guess dice sum (8x multiplier)`
          ].join('\n\n')
        },
        { 
          name: "Social", 
          value: [
            `**${prefix}give** <@user> <amount> \n Give money to user`,
            `**${prefix}leaderboard** \n Show top players`
          ].join('\n\n')
        },
        {
          name: "Owner Commands", 
          value: `**${prefix}giveowner** <amount> \n Give money to bot owner`
        }
      )
      .setFooter({ text: "Game Bot Help Menu" })
      .setTimestamp();
    
    return message.reply({ embeds: [helpEmbed] });
  },
  ownerinfo: async (message) => {
    const owner = await dataManager.getUserProfile(config.ownerId, client);
    if (!owner) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    const ownerHelpEmbed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("👤 BOT Owner Information")
      .setThumbnail(owner.avatar)
      .addFields(
        { name: "Discord Information :", 
          value: `**Username:** ${owner.username},
                  **ID:** ${owner.id},
                  **Account Created:** ${owner.createdAt.toLocaleDateString()}
                  **Personal Site : [Click Here](https://www.irfanks.site/)**` 
        }

      )
      .setFooter({ text: "Game Bot Owner Info" })
      .setTimestamp();

    return message.reply({ embeds: [ownerHelpEmbed] });
  },
  leaderboard: async (message) => {
    const sortedUsers = Object.entries(dataManager.users)
      .sort(([, a], [, b]) => b.balance - a.balance)
      .slice(0, 10);

    const leaderboard = await Promise.all(
      sortedUsers.map(async ([userId, user], index) => {
        const discordUser = await client.users.fetch(userId);
        return `${index + 1}. ${discordUser.username}: $${user.balance}`;
      })
    );

    const leaderboardEmbed = new EmbedBuilder()
      .setTitle("Top 10 Players")
      .setDescription(leaderboard.join("\n"))
      .setColor("#FFD700");

    return message.reply({ embeds: [leaderboardEmbed] });
  },
  giveowner: async (message, args) => {
    if (message.author.id !== config.ownerId) {
      return message.reply("This command is only available to the bot owner!");
    }

    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
      return message.reply("Usage: N!giveowner <amount>");
    }

    try {
      const updatedUser = await dataManager.giveOwnerMoney(message.author.id, amount);
      
      const ownerEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("💰 Owner Bonus Added!")
        .setDescription(`Successfully added $${amount.toLocaleString()} to your account!`)
        .addFields(
          { name: "New Balance", value: `$${updatedUser.balance.toLocaleString()}`, inline: true },
          { name: "Added Amount", value: `$${amount.toLocaleString()}`, inline: true }
        )
        .setTimestamp();

      return message.reply({ embeds: [ownerEmbed] });
    } catch (error) {
      console.error("Error in giveowner command:", error);
      return message.reply("An error occurred while processing the command.");
    }
  },
  say: async (message, args) => {
    // Delete the original command message for cleanliness
    try {
      await message.delete();
    } catch (error) {
      console.error("Couldn't delete command message:", error);
    }
    if(config.ownerId !== message.author.id) {
      return message.reply("This command is only available to the bot owner!");
    }
    // Check if there are enough arguments
    if (args.length < 2) {
      return message.channel.send(`Usage: ${prefix}say <#channel/@user> <message>`);
    }

    // Get mentioned channel or user
    const targetChannel = message.mentions.channels.first();
    const targetUser = message.mentions.users.first();
    const text = args.slice(1).join(" ");

    if (!text) {
      return message.channel.send("Please provide a message to send!");
    }

    try {
      if (targetChannel) {
        // Send to mentioned channel
        await targetChannel.send(text);
      } else if (targetUser) {
        // Send DM to mentioned user
        await targetUser.send(text);
      } else {
        // Send to current channel
        await message.channel.send(text);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      await message.channel.send("Failed to send the message. Make sure I have the required permissions!");
    }
  }

  // Add this to your help command under Basic Commands
};

// Event Handlers
client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

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