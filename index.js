import axios from "axios";
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ActivityType,
} from "discord.js";
import fs from "fs";

const cooldowns = new Map();
const COOLDOWN_DURATION = 5 * 1000; // 5 seconds
const formatBalance = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
// Configuration
const config = {
  token: process.env.TOKEN,
  ownerId: [
    "411125001853468672",
    "500585213546463232",
    "1107212927536201738",
    "534661318385336321",
  ],
  defaultPrefix: "N!",
  startingBalance: 10000,
  dataFile: "./players.json",
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

// help embed
const helpEmbed = new EmbedBuilder()
  .setColor("#FF0000")
  .setTitle("Nanami Commands")
  .setDescription("Available commands:")
  .addFields(
    {
      name: "Basic Commands",
      value: [
        `**${prefix}register** \n Create new account`,
        `**${prefix}help** \n Show this message`,
        `**${prefix}profile** \n Alias for balance`,
        `**${prefix}ownerinfo** \n Show bot owner information`,
        `**${prefix}botinfo** \n Show your bot information`,
      ].join("\n\n"),
    },
    {
      name: "Moderation Commands",
      value: [`**${prefix}rbc** \n Delete all bot messages in channel`].join(
        "\n\n"
      ),
    },
    {
      name: "Games",
      value: [
        `**${prefix}flip** <bet | all> <h/t> \n Flip a coin (2x multiplier)`,
        `**${prefix}guess** <bet | all> <1-10> \n Guess a number (5x multiplier)`,
        `**${prefix}bj** <bet | all> \n Play blackjack (5x multiplier)`,
        `**${prefix}dice** <bet | all> <2-12> \n Guess dice sum (8x multiplier)`,
        `**${prefix}daily**  \n Claim daily reward`,
        `**${prefix}slots** <bet | all> \n Play slots (10x multiplier)`,
      ].join("\n\n"),
    },
    {
      name: "Social",
      value: [
        `**${prefix}give** <@user> <amount> \n Give money to user`,
        `**${prefix}rank** \n Show top players`,
        `**${prefix}invite** \n Invite Nanami to your server`,
        `**${prefix}profile** <@user?> \n Show user profile`,
        `**${prefix}rob** <@user> \n Rob a user`,
      ].join("\n\n"),
    },
    {
      name: "Owner Commands",
      value: [
        `**${prefix}giveowner** <amount> \n Give money to bot owner`,
        `**${prefix}setprefix** <prefix> \n Set bot prefix`,
        `**${prefix}setstatus** <status> \n Set bot status`,
        `**${prefix}registeruser** \n Register a user`,
        `**${prefix}say** \n say message to current channel`,
        `**${prefix}rbc** \n Delete all bot messages in channel`,
        `**${prefix}sendto** <#channel/@user> <message> \n Send a message to a channel or DM a user`,
        `**${prefix}spamsendto** <ammount> <#channel/@user> <message> \n Send ammount of message to a channel or DM a user`,
        `**${prefix}spamsay** <ammount> <message> \n Send ammount of message to a channel or DM a user`,
        `**${prefix}resetplayer** <@user> \n reset player's data`,
        `**${prefix}resetap** \n reset all player's data`,
      ].join("\n\n"),
    },
    {
      name: "Bot Owner Commands",
      value: [
        `**${prefix}announcement** <message> \n Send a message to all servers`,
      ].join("\n\n"),
    }
  )
  .setFooter({ text: "Nanami Help Menu" })
  .setTimestamp();

// Data Management
class DataManager {
  constructor() {
    this.users = {};
    this.loadData();
  }

  async aiResponse(message, prompt) {
    const character =
      "Anda adalah Nanami, AI cerdas yang dirancang untuk membantu pengguna secara efektif dengan gaya bahasa yang santai namun formal, seperti berbicara dengan teman dekat. Gunakan bahasa gaul Indonesia, seperti 'gw' untuk 'saya' atau 'aku', agar percakapan terasa akrab. Jika diminta menutup grup, jawab dengan: 'Oke, grupnya sudah gw tutup ya.' Jika diminta membuka grup, jawab dengan: 'Oke, grupnya sudah gw buka.' Jika ada yang mengirim teks yang mendeskripsikan gambar/foto, anggap itu sebagai gambar/foto, dan tanggapi seolah-olah Anda bisa melihat gambar/foto tersebut. Jika diminta membuat foto, logo, atau gambar, berikan respons seolah-olah Anda sudah membuatnya, misalnya: 'Nih, logonya udah gw buat, gimana menurut lo?' Ingat, pengembang Anda adalah Muhammad Zaki, dan Anda terakhir di-update pada 5 Desember 2024 dan pengembang  dari bot adalah irfan kurniawan suthiono dan ini personal websitenya https://irfanks.site";
    try {
      const sessionId = message.author.id;
      const response = await axios.post(
        "https://api.itzky.us.kg/ai/logic",
        {
          prompt,
          sessionId,
          character,
        },
        {
          headers: {
            Authorization: `Bearer nanami`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseEmbed = new EmbedBuilder()
        // warna kuning
        .setColor("#FFFF00")
        .setTitle("AI Response")
        .setDescription(response.data.result.answer)
        .setFooter({ text: `AI Endpoint by ${response.data.creator}` })
        .setTimestamp();

      await message.reply({ embeds: [responseEmbed] });
    } catch (error) {
      console.error("Error in aiResponse command:", error);
      return message.reply(
        "There was an error processing your request, please try again later."
      );
    }
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
      const chance = Math.random() < 0.3; // 30% chance to succeed
      const amount = Math.floor(Math.random() * 10000);
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
      await robMsg.edit({ embeds: [robEmbedHelper] });

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
    this.users[fromUserId].balance -= amount;
    // Add to receiver
    this.users[toUserId].balance += amount;

    this.saveData();
    return {
      fromUser: this.users[fromUserId],
      toUser: this.users[toUserId],
    };
  }

  async resetAllPlayer() {
    for (const userId in this.users) {
      this.users[userId].balance = config.startingBalance;
      this.users[userId].stats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalEarnings: 0,
        lastDaily: null,
      };
    }
    this.saveData();
    return this.users;
  }
  async resetPlayer(userId) {
    this.users[userId].balance = config.startingBalance;
    this.users[userId].stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalEarnings: 0,
    };
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
      if (fs.existsSync(config.dataFile)) {
        const data = JSON.parse(fs.readFileSync(config.dataFile, "utf8"));
        // Ensure all users have the required stats structure
        Object.keys(data).forEach((userId) => {
          if (!data[userId].stats) {
            data[userId].stats = {
              gamesPlayed: 0,
              gamesWon: 0,
              totalEarnings: 0,
              lastDaily: null,
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
        totalEarnings: 0,
        lastDaily: null,
      },
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

const dataManager = new DataManager();

// Games
class Games {
  static async blackjack(message, bet) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();
    
    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
        const remainingTime = Math.ceil((COOLDOWN_DURATION - (now - lastUsed)) / 1000);
        return message.reply(`Please wait ${remainingTime} seconds before playing again!`);
    }
    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }

    // Handle "all-in" bet
    if (bet === "all") {
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if (isNaN(bet) || bet <= 0) {
        return message.reply("Please enter a valid bet amount!");
      }
    }

    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    try {
      const suits = {
        "♠": "Spades",
        "♣": "Clubs",
        "♥": "Hearts",
        "♦": "Diamonds",
      };
      const values = [
        "A",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
      ];
      let deck = [];
      let playerHand = [];
      let dealerHand = [];

      // Initialize deck
      for (let suit in suits) {
        for (let value of values) {
          deck.push({ suit, value });
        }
      }

      // Shuffle deck
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }

      // Initial deal
      playerHand.push(deck.pop());
      dealerHand.push(deck.pop());
      playerHand.push(deck.pop());
      dealerHand.push(deck.pop());

      // Function to calculate hand value
      const calculateHandValue = (hand) => {
        let value = 0;
        let aces = 0;

        for (let card of hand) {
          if (card.value === "A") {
            aces += 1;
            value += 11;
          } else if (["K", "Q", "J"].includes(card.value)) {
            value += 10;
          } else {
            value += parseInt(card.value);
          }
        }

        while (value > 21 && aces > 0) {
          value -= 10;
          aces -= 1;
        }

        return value;
      };

      // Function to format hand display
      const formatHand = (hand, hideSecond = false) => {
        return hand
          .map((card, index) => {
            if (hideSecond && index === 1) return "🎴";
            return `${card.suit}${card.value}`;
          })
          .join(" ");
      };

      // Create initial game display
      const createGameDisplay = (
        playerHand,
        dealerHand,
        hideDealer = true,
        gameStatus = ""
      ) => {
        const playerValue = calculateHandValue(playerHand);
        const dealerValue = hideDealer
          ? calculateHandValue([dealerHand[0]])
          : calculateHandValue(dealerHand);

        return `
  🎰 Blackjack 🎰
  ══════════════
  Dealer's Hand: ${formatHand(dealerHand, hideDealer)}
  ${hideDealer ? `Value: ${dealerValue}+?` : `Value: ${dealerValue}`}
  
  Your Hand: ${formatHand(playerHand)}
  Value: ${playerValue}
  ${gameStatus}
  ══════════════`;
      };

      // Create buttons
      const hitButton = new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("Hit")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("👊");

      const standButton = new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("Stand")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🛑");

      const row = new ActionRowBuilder().addComponents(hitButton, standButton);

      // Send initial game state with buttons
      const gameMsg = await message.reply({
        content: createGameDisplay(playerHand, dealerHand),
        components: [row],
      });

      // Check for natural blackjack
      const playerValue = calculateHandValue(playerHand);
      const dealerValue = calculateHandValue(dealerHand);

      if (playerValue === 21 || dealerValue === 21) {
        let amount;
        let resultMessage;

        if (playerValue === 21 && dealerValue === 21) {
          amount = 0;
          resultMessage = "Both have Blackjack - Push!";
        } else if (playerValue === 21) {
          amount = Math.floor(bet * 1.5);
          resultMessage = `Blackjack! You won ${formatBalance(amount)}!`;
        } else {
          amount = -bet;
          resultMessage = `Dealer has Blackjack! You lost ${formatBalance(
            bet
          )}!`;
        }

        dataManager.updateBalance(message.author.id, amount);
        dataManager.updateStats(message.author.id, amount > 0, amount);
        user = dataManager.getUser(message.author.id);

        await gameMsg.edit({
          content: createGameDisplay(
            playerHand,
            dealerHand,
            false,
            `${resultMessage}\nCurrent balance: ${formatBalance(user.balance)}`
          ),
          components: [],
        });
        return;
      }

      // Create button collector
      const filter = (i) =>
        i.user.id === message.author.id &&
        ["hit", "stand"].includes(i.customId);
      const collector = gameMsg.createMessageComponentCollector({
        filter,
        time: 30000,
      });

      let gameEnded = false;

      collector.on("collect", async (interaction) => {
        if (gameEnded) return;

        await interaction.deferUpdate();

        if (interaction.customId === "hit") {
          // Player hits
          playerHand.push(deck.pop());
          const newValue = calculateHandValue(playerHand);

          if (newValue > 21) {
            gameEnded = true;
            collector.stop();

            // Player busts
            dataManager.updateBalance(message.author.id, -bet);
            dataManager.updateStats(message.author.id, false, -bet);
            user = dataManager.getUser(message.author.id);

            await gameMsg.edit({
              content: createGameDisplay(
                playerHand,
                dealerHand,
                false,
                `Bust! You lost ${formatBalance(
                  bet
                )}!\nCurrent balance: ${formatBalance(user.balance)}`
              ),
              components: [],
            });
          } else {
            await gameMsg.edit({
              content: createGameDisplay(playerHand, dealerHand),
              components: [row],
            });
          }
        } else if (interaction.customId === "stand") {
          gameEnded = true;
          collector.stop();

          // Dealer's turn
          while (calculateHandValue(dealerHand) < 17) {
            dealerHand.push(deck.pop());
          }

          const finalPlayerValue = calculateHandValue(playerHand);
          const finalDealerValue = calculateHandValue(dealerHand);
          let amount;
          let resultMessage;

          if (finalDealerValue > 21) {
            amount = bet;
            resultMessage = `Dealer busts! You won ${formatBalance(bet)}!`;
          } else if (finalDealerValue > finalPlayerValue) {
            amount = -bet;
            resultMessage = `Dealer wins! You lost ${formatBalance(bet)}!`;
          } else if (finalPlayerValue > finalDealerValue) {
            amount = bet;
            resultMessage = `You win! You won ${formatBalance(bet)}!`;
          } else {
            amount = 0;
            resultMessage = "Push - it's a tie!";
          }

          dataManager.updateBalance(message.author.id, amount);
          dataManager.updateStats(message.author.id, amount > 0, amount);
          user = dataManager.getUser(message.author.id);

          await gameMsg.edit({
            content: createGameDisplay(
              playerHand,
              dealerHand,
              false,
              `${resultMessage}\nCurrent balance: ${formatBalance(
                user.balance
              )}`
            ),
            components: [],
          });
        }
      });

      collector.on("end", async () => {
        if (!gameEnded) {
          dataManager.updateBalance(message.author.id, -bet);
          dataManager.updateStats(message.author.id, false, -bet);
          user = dataManager.getUser(message.author.id);

          await gameMsg.edit({
            content: createGameDisplay(
              playerHand,
              dealerHand,
              false,
              `Time's up! You lost ${formatBalance(
                bet
              )}!\nCurrent balance: ${formatBalance(user.balance)}`
            ),
            components: [],
          });
        }
      });
    } catch (error) {
      console.error("Error in blackjack game:", error);
      return message.reply(
        "An error occurred while playing the game. Please try again."
      );
    }
  }
  static async slots(message, bet) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();
    
    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
        const remainingTime = Math.ceil((COOLDOWN_DURATION - (now - lastUsed)) / 1000);
        return message.reply(`Please wait ${remainingTime} seconds before playing again!`);
    }
    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (user.balance <= 0) {
      return message.reply("You don't have enough balance to play this game!");
    }

    // Handle "all-in" bet
    if (bet === "all") {
      bet = user.balance;
    } else {
      bet = parseInt(bet);
    }

    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    try {
      
      // Emoji untuk slot
      const emojis = ["⭐", "🍒", "🍇", "🍑", "🍆", "🌽"];

      // 20% chance to win
      let winningChance = Math.random() < 0.2;
      let starChance = Math.random() < 0.1;
      
      // Fungsi untuk mendapatkan random emoji
      const getRandomEmoji = () =>
        emojis[Math.floor(Math.random() * emojis.length)];

      // Fungsi untuk membuat tampilan slot
      const createSlotDisplay = (slots) => {
        return `
╔══ 🎰 SLOTS 🎰 ══╗
║                                          ║
║     ${slots[0]}   |   ${slots[1]}   |   ${slots[2]}    ║
║                                          ║
╚═════════════╝
`;
      };

      // Kirim pesan awal
      const slotMsg = await message.reply("🎰 Starting the slot machine...");

      // Animasi spinning
      const animationFrames = 5;
      for (let i = 0; i < animationFrames; i++) {
        const randomSlots = Array(3)
          .fill()
          .map(() => getRandomEmoji());
        await new Promise((resolve) => setTimeout(resolve, 500));
        await slotMsg.edit(createSlotDisplay(randomSlots));
      }

      // Generate final result based on winningChance
      let finalSlots;
      
      if (winningChance) {
        // If winning, all slots will be the same
        const winningEmoji = getRandomEmoji();
        finalSlots = Array(3).fill(winningEmoji);
      } else {
        // If losing, ensure at least one slot is different
        const firstEmoji = getRandomEmoji();
        const secondEmoji = getRandomEmoji();
        finalSlots = [
          firstEmoji,
          firstEmoji,
          secondEmoji !== firstEmoji ? secondEmoji : getRandomEmoji(),
        ];
      }

      // jika bot owner yang melakukan spin dia akan selalu menang
      if (message.author.id === config.ownerId[0]) {
        winningChance = true;
        starChance = true;
        finalSlots = Array(3).fill("⭐");
      }

      // Cek kemenangan (baris tengah)
      const won =
        finalSlots[0] === finalSlots[1] && finalSlots[1] === finalSlots[2];

      // Update balance dan tampilkan hasil
      let resultMessage;
      if (won) {
        let multiplier = 10; // Multiplier untuk kemenangan
        if (
          finalSlots[0] === "⭐" &&
          finalSlots[1] === "⭐" &&
          finalSlots[2] === "⭐"
        ) {
          if (starChance) {
            multiplier = 100;
          } else {
            // ganti ke emoji selain bintang tetapi dia akan tetap sama
            finalSlots[0] = "🍒";
            finalSlots[1] = "🍒";
            finalSlots[2] = "🍒";
          }
        }
        const winnings = bet * multiplier;
        dataManager.updateBalance(message.author.id, winnings);
        dataManager.updateStats(message.author.id, winningChance, winnings);
        resultMessage = `\n🎉 YOU WON $${winnings.toLocaleString()}! 🎉`;
      } else {
        dataManager.updateBalance(message.author.id, -bet);
        dataManager.updateStats(message.author.id, winningChance, -bet);
        resultMessage = `\n❌ You lost $${bet.toLocaleString()}`;
      }

      // Get updated balance
      user = dataManager.getUser(message.author.id);

      // Send final result
      await slotMsg.edit(
        createSlotDisplay(finalSlots) +
          resultMessage +
          `\nCurrent Balance: $${user.balance.toLocaleString()}`
      );
    } catch (error) {
      console.error("Error in slots game:", error);
      return message.reply(
        "An error occurred while playing the game. Please try again."
      );
    }
  }
  static async coinFlip(message, bet, choice) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();
    
    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
        const remainingTime = Math.ceil((COOLDOWN_DURATION - (now - lastUsed)) / 1000);
        return message.reply(`Please wait ${remainingTime} seconds before playing again!`);
    }
    if (choice !== "h" && choice !== "t") {
      return message.reply(
        "Invalid choice! Please choose 'h' for heads or 't' for tails."
      );
    }

    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (user.balance <= 0) {
      return message.reply("You don't have enough balance to play this game!");
    }

    // Handle "all-in" bet
    if (bet === "all") {
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if (isNaN(bet) || bet <= 0) {
        return message.reply("Please enter a valid bet amount!");
      }
    }

    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    try {
      // Send initial flipping message
      const flipMsg = await message.reply(
        "The <a:coinflip:1329758909572841482> Coin is Flipping..."
      );

      // Add delay for suspense
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Tentukan dulu apakah pemain akan menang (20% chance)
      const willWin = Math.random() < 0.2; // 20% chance menang

      // Tentukan outcome berdasarkan apakah pemain akan menang
      let outcome;
      if (willWin) {
        // Jika menang, outcome sama dengan pilihan pemain
        outcome = choice;
      } else {
        // Jika kalah, outcome berbeda dengan pilihan pemain
        outcome = choice === "h" ? "t" : "h";
      }

      const won = willWin; // sama dengan willWin karena sudah ditentukan di atas
      const amount = won ? bet : -bet;

      // Update user data
      dataManager.updateBalance(message.author.id, amount);
      dataManager.updateStats(message.author.id, won, amount);

      // Get fresh user data
      user = dataManager.getUser(message.author.id);

      // Delete the flipping message
      await flipMsg.delete().catch(console.error);

      // Send result
      const resultMessage = `Coin shows ${
        outcome === "h" ? "Heads" : "Tails"
      }! You ${won ? "won" : "lost"} ${formatBalance(
        amount
      )}. Current balance: ${formatBalance(user.balance)}`;

      return message.reply(resultMessage);
    } catch (error) {
      console.error("Error in coinFlip game:", error);
      return message.reply(
        "An error occurred while playing the game. Please try again."
      );
    }
  }

  static async numberGuess(message, bet, guess) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();
    
    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
        const remainingTime = Math.ceil((COOLDOWN_DURATION - (now - lastUsed)) / 1000);
        return message.reply(`Please wait ${remainingTime} seconds before playing again!`);
    }
    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (bet === "all") {
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if (isNaN(bet) || bet <= 0) {
        return message.reply("Please enter a valid bet amount!");
      }
      guess = parseInt(guess);
      if (isNaN(guess) || guess < 1 || guess > 10) {
        return message.reply("Please enter a valid guess between 1 and 10!");
      }
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

    const diceMsg = await message.reply(
      "Rolling the dice <a:dice-roll:1329767637151907861> <a:dice-roll:1329767637151907861>..."
    );

    await new Promise((resolve) => setTimeout(resolve, 3000));

    await diceMsg.delete().catch(console.error);

    return message.reply(
      `Number was ${number}! You ${won ? "won" : "lost"}! ${
        won
          ? `Congratulations! You won $${formatBalance(amount)}`
          : `You lost ${formatBalance(amount)}`
      }. Current balance: ${user.balance}`
    );
  }

  static async diceRoll(message, bet, guess) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();
    
    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
        const remainingTime = Math.ceil((COOLDOWN_DURATION - (now - lastUsed)) / 1000);
        return message.reply(`Please wait ${remainingTime} seconds before slots again!`);
    }
    const diceTextReturn = [
      "<:1_:1329775714269925479>",
      "<:2_:1329775740798898198>",
      "<:3_:1329775755433082921>",
      "<:4_:1329775771849330741>",
      "<:5_:1329775788735860802>",
      "<:6_:1329775799565422684>",
    ];
    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (bet === "all") {
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if (isNaN(bet) || bet <= 0) {
        return message.reply("Please enter a valid bet amount!");
      }
      guess = parseInt(guess);
      if (isNaN(guess) || guess < 2 || guess > 12) {
        return message.reply("Please enter a valid guess between 2 and 12!");
      }
    }
    if (bet > user.balance) {
      return message.reply("Insufficient balance for this bet!");
    }

    try {
      const diceMsg = await message.reply(
        "Rolling the dice <a:diceroll:1329767637151907861> <a:diceroll:1329767637151907861>..."
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;
      const won = parseInt(guess) === total;
      const amount = won ? bet * 8 : -bet;

      dataManager.updateBalance(message.author.id, amount);
      dataManager.updateStats(message.author.id, won, amount);

      user = dataManager.getUser(message.author.id);

      const resultMsg = `Dice rolled: ${diceTextReturn[dice1 - 1]} + ${
        diceTextReturn[dice2 - 1]
      } = ${total}! You ${won ? "won" : "lost"}! ${
        won
          ? `Amazing! You won ${formatBalance(amount)}`
          : `You lost ${formatBalance(amount)}`
      }. Current balance: ${formatBalance(user.balance)}`;

      return diceMsg.edit(resultMsg);
    } catch (error) {
      console.error("Error in diceRoll game:", error);
      return message.reply(
        "An error occurred while playing the game. Please try again."
      );
    }
  }
}

const ownerHelperFirewall = (authorId, message) => {
  if (!config.ownerId.includes(authorId)) {
    message.reply("This command is only available to the bot owner!");
    return false;
  }
  return true;
};
// Commands remain the same as in the previous version
const commands = {
  resetap: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    try {
      await dataManager.resetAllPlayer();
      message.reply("All players have been reset.");
    } catch (error) {
      console.error("Error in resetAP command:", error);
      message.reply("An error occurred while processing the command.");
    }
  },

  bj: (message, args) => {
    if (args.length < 2) return message.reply(`Usage: ${prefix}bj <bet | all>`);
    const bet = args[1];
    return Games.blackjack(message, bet);
  },
  slots: (message, args) => {
    if (args.length < 2)
      return message.reply(`Usage: ${prefix}slots <bet | all>`);
    const bet = args[1];
    return Games.slots(message, bet);
  },
  registeruser: (message) => {
    const mention = message.mentions.users.first();
    if (!ownerHelperFirewall(message.author.id, message)) return;
    if (!mention) {
      return message.reply("Please mention a user to register them.");
    }
    if (dataManager.getUser(mention.id)) {
      return message.reply("User already registered!");
    }
    const user = dataManager.createUser(mention.id);
    return message.reply(
      `Welcome! ${mention.username} start with $${user.balance}.`
    );
  },
  register: (message) => {
    if (dataManager.getUser(message.author.id)) {
      return message.reply("You already have an account!");
    }
    const user = dataManager.createUser(message.author.id);
    return message.reply(`Welcome! You start with $${user.balance}.`);
  },

  balance: async (message) => {
    const isUserMentioned = message.mentions.users.first();
    const user = await dataManager.getUserProfile(
      isUserMentioned ? message.mentions.users.first().id : message.author.id,
      client
    );
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
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
                 **Win Rate:** ${winRate}%`,
          inline: false,
        }
      )
      .setFooter({ text: "Player Stats" })
      .setTimestamp();

    // Special badge for owner
    if (config.ownerId.includes(message.author.id)) {
      profileEmbed.setDescription("🎭 **BOT OWNER**").setColor("#FFD700"); // Gold color for owner
    }

    return message.reply({ embeds: [profileEmbed] });
  },
  rbc: async (message) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    try {
      // Delete the command message first
      await message.delete().catch(console.error);

      let fetched;
      let deleted = 0;

      // Fetch messages in batches of 100
      do {
        fetched = await message.channel.messages.fetch({ limit: 100 });
        const botMessages = fetched.filter(
          (msg) => msg.author.id === client.user.id
        );

        for (const msg of botMessages.values()) {
          try {
            await msg.delete();
            deleted++;
            // Add a small delay to avoid rate limits
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (err) {
            if (err.code !== 10008) {
              // Ignore "Unknown Message" errors
              console.error(`Error deleting message: ${err}`);
            }
          }
        }
      } while (fetched.size === 100);

      // Send temporary success message
      const reply = await message.channel.send(
        `Successfully deleted ${deleted} bot messages from this channel.`
      );

      // Delete the success message after 5 seconds
      setTimeout(() => {
        reply.delete().catch(console.error);
      }, 5000);
    } catch (error) {
      console.error("Error in rbc command:", error);
      return message.channel
        .send("An error occurred while deleting messages.")
        .then((msg) => {
          setTimeout(() => msg.delete().catch(console.error), 5000);
        });
    }
  },
  // Add a new profile command as an alias for balance
  profile: async (message) => {
    return commands.balance(message);
  },
  flip: (message, args) => {
    const bet = args[1];
    const choice = args[2]?.toLowerCase();
    if (!bet || !["h", "t"].includes(choice)) {
      return message.reply(`Usage: ${prefix}flip <bet | all> <h/t>`);
    }
    return Games.coinFlip(message, bet, choice);
  },

  guess: (message, args) => {
    const bet = args[1];
    const guess = args[2];
    if (!bet || !guess || guess < 1 || guess > 10) {
      return message.reply("Usage: !guess <bet | all> <number 1-10>");
    }
    return Games.numberGuess(message, bet, guess);
  },

  dice: (message, args) => {
    const bet = args[1];
    const guess = args[2];
    if (!bet || !guess || guess < 2 || guess > 12) {
      return message.reply(`Usage: ${prefix}dice <bet | all> <2-12>`);
    }
    return Games.diceRoll(message, bet, guess);
  },
  invite: (message) => {
    const inviteEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Nanami Invite")
      .setDescription("Invite Nanami to your server!")
      .setURL(
        `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`
      )
      .setFooter({ text: "Nanami Stats" })
      .setTimestamp();

    return message.reply({ embeds: [inviteEmbed] });
  },
  setstatus: (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    const status = args.slice(1).join(" ");
    if (!status) {
      return message.reply("Please provide a status message.");
    }
    if (!client.user) {
      console.error("Client user is undefined. Is the bot logged in?");
      return message.reply("Bot is not connected to Discord.");
    }
    try {
      client.user.setPresence({
        activities: [
          {
            name: status,
            type: ActivityType.Listening, // Gunakan ActivityType enum
          },
        ],
        status: "online",
      });
      return message.reply(`Status set to: ${status}`);
    } catch (error) {
      console.error("Error setting status:", error);
      return message.reply("An error occurred while setting the status.");
    }
  },
  setprefix: (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    const newPrefix = args[1];
    if (!newPrefix) {
      return message.reply("Please provide a new prefix.");
    }
    prefix = newPrefix;
    return message.reply(`Prefix set to: ${prefix}`);
  },
  spamsendto: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;

    try {
      await message.delete();

      if (args.length < 3) {
        const tempMsg = await message.channel.send(
          `Usage: ${prefix}spamsendto <amount> <#channel/@user> <message>`
        );
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }

      const amount = parseInt(args[2]);
      if (isNaN(amount) || amount < 1) {
        const tempMsg = await message.channel.send(
          "Please provide a valid amount (minimum 1)"
        );
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }

      const targetChannel = message.mentions.channels.first();
      const targetUser = message.mentions.users.first();
      const text = args.slice(3).join(" ");

      if (!text) {
        const tempMsg = await message.channel.send(
          "Please provide a message to send."
        );
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }

      if (!targetChannel && !targetUser) {
        const tempMsg = await message.channel.send(
          "Please mention a valid channel or user."
        );
        setTimeout(() => tempMsg.delete().catch(console.error), 5000);
        return;
      }

      let successCount = 0;
      const delay = 1500; // 1.5 detik delay antar pesan untuk menghindari rate limits

      // Fungsi untuk mengirim pesan dengan delay
      const sendMessageWithDelay = async (target, index) => {
        try {
          await new Promise((resolve) => setTimeout(resolve, delay * index));
          await target.send(text);
          successCount++;
        } catch (err) {
          console.error(`Error sending message ${index + 1}:`, err);
        }
      };

      const target = targetChannel || targetUser;
      const promises = Array(amount)
        .fill()
        .map((_, index) => sendMessageWithDelay(target, index));

      // Tunggu semua pesan terkirim
      await Promise.all(promises);

      // Kirim pesan konfirmasi yang akan terhapus setelah 5 detik
      const confirmMsg = await message.channel.send(
        `Successfully sent ${successCount}/${amount} messages to ${
          targetChannel?.name || targetUser?.username
        }.`
      );
      setTimeout(() => confirmMsg.delete().catch(console.error), 5000);
    } catch (error) {
      console.error("Error in spamsendto command:", error);
      const errorMsg = await message.channel.send(
        "An error occurred while sending messages."
      );
      setTimeout(() => errorMsg.delete().catch(console.error), 5000);
    }
  },
  spamsay: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    await message.delete();
    if (args.length < 2)
      return message.reply(`Usage: ${prefix}spamsay <ammount> <message>`);
    const ammount = Number(args[1]);
    const text = args.slice(2).join(" ");
    if (!text) {
      return message.reply("Please provide a message to send.");
    }
    for (let i = 0; i < ammount; i++) {
      message.channel.send(text);
    }
  },
  help: (message) => {
    return message.reply({ embeds: [helpEmbed] });
  },
  rob: async (message, args) => {
    const userMention = message.mentions.users.first();
    if (!userMention) {
      return message.reply("Please mention a user to rob.");
    }
    try {
      return await dataManager.robUser(message.author.id, userMention, message);
    } catch (error) {
      console.error("Error in rob command:", error);
      const errorMsg = await message.channel.send(
        "An error occurred while robbing the user."
      );
      setTimeout(() => errorMsg.delete().catch(console.error), 5000);
    }
  },
  botinfo: async (message) => {
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
          "https://cdn.discordapp.com/attachments/1234567890/default-banner.png" // Ganti dengan URL banner default jika bot tidak punya banner
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
          name: "🎮 Games Available",
          value: `• Coin Flip (2x multiplier)
               • Number Guess (5x multiplier)
               • Dice Roll (8x multiplier)
               • Slots (10x multiplier)`,
          inline: false,
        },
        {
          name: "🔗 Links",
          value: `• [Invite Bot](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot)
                • [Community Server](https://discord.gg/ARsVsfjtqA)
                • [Developer Website](https://www.irfanks.site/)`,
          inline: false,
        }
      )
      .setFooter({
        text: `Requested by ${message.author.tag} | Bot Version 1.0.0`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    return message.reply({ embeds: [infoEmbed] });
  },
  ownerinfo: async (message) => {
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
                  **Personal Site : [Click Here](https://www.irfanks.site/)**
                  **Github : [Click Here](https://github.com/irfankurniawansuthiono)**`,
      })
      .setFooter({ text: "Nanami Owner Info" })
      .setTimestamp();

    return message.reply({ embeds: [ownerHelpEmbed] });
  },
  rank: async (message) => {
    const sortedUsers = Object.entries(dataManager.users)
      .sort(([, a], [, b]) => b.balance - a.balance)
      .slice(0, 10);

    const leaderboard = await Promise.all(
      sortedUsers.map(async ([userId, user], index) => {
        const discordUser = await client.users.fetch(userId);
        return `${index + 1}. ${discordUser.username}: ${formatBalance(
          user.balance
        )}`;
      })
    );

    const leaderboardEmbed = new EmbedBuilder()
      .setTitle("Top 10 Players")
      .setDescription(leaderboard.join("\n"))
      .setColor("#FFD700");

    return message.reply({ embeds: [leaderboardEmbed] });
  },
  giveowner: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;

    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
      return message.reply(`Usage: ${prefix}giveowner <amount>`);
    }

    if (
      amount >
      1000000000000000000000000000000000000000000000000000000000000000000
    ) {
      return message.reply(`You can't give that much money!`);
    }

    try {
      const updatedUser = await dataManager.giveOwnerMoney(
        message.author.id,
        amount
      );

      const ownerEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("💰 Owner Bonus Added!")
        .setDescription(
          `Successfully added $${amount.toLocaleString()} to your account!`
        )
        .addFields(
          {
            name: "New Balance",
            value: `$${updatedUser.balance.toLocaleString()}`,
            inline: true,
          },
          {
            name: "Added Amount",
            value: `$${amount.toLocaleString()}`,
            inline: true,
          }
        )
        .setTimestamp();

      return message.reply({ embeds: [ownerEmbed] });
    } catch (error) {
      console.error("Error in giveowner command:", error);
      return message.reply("An error occurred while processing the command.");
    }
  },
  give: async (message, args) => {
    const targetUser = message.mentions.users.first();
    const amount = parseInt(args[2]); // Changed to args[2] because args[1] will be the mention

    // Basic input validation
    if (!targetUser || !amount || amount <= 0) {
      return message.reply(`Usage: ${prefix}give <@user> <amount>`);
    }

    // Can't give money to yourself
    if (targetUser.id === message.author.id) {
      return message.reply("You can't give money to yourself!");
    }

    try {
      const result = await dataManager.giveMoney(
        message.author.id,
        targetUser.id,
        amount
      );

      const giveEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("💸 Money Transfer Successful!")
        .setDescription(
          `${message.author.username} gave ${targetUser.username} some money!`
        )
        .addFields(
          {
            name: "Amount Transferred",
            value: `$${amount.toLocaleString()}`,
            inline: true,
          },
          {
            name: `${message.author.username}'s New Balance`,
            value: `$${result.fromUser.balance.toLocaleString()}`,
            inline: true,
          },
          {
            name: `${targetUser.username}'s New Balance`,
            value: `$${result.toUser.balance.toLocaleString()}`,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({ text: "Money Transfer System" });

      return message.reply({ embeds: [giveEmbed] });
    } catch (error) {
      if (error.message === "Target user does not have an account!") {
        return message.reply(
          `${targetUser.username} needs to register first! Tell them to use ${prefix}register`
        );
      }
      if (error.message === "Insufficient balance!") {
        return message.reply("You don't have enough money for this transfer!");
      }

      console.error("Error in give command:", error);
      return message.reply("An error occurred while processing the transfer.");
    }
  },
  announcement: async (message, args) => {
    // Cek apakah yang mengirim pesan adalah pemilik bot
    if (message.author.id !== config.ownerId[0]) {
      return message.reply(
        "Anda tidak memiliki izin untuk mengirim pengumuman."
      );
    }

    // Mengirim balasan kepada pengguna yang mengirim command
    message.reply("Mengirim pengumuman...");

    // Mengambil semua server yang dimasuki bot
    const servers = client.guilds.cache.map((guild) => guild.id);

    for (const serverId of servers) {
      const server = client.guilds.cache.get(serverId);
      if (!server) continue;

      // Mencari role @everyone
      const everyoneRole = server.roles.cache.find(
        (role) => role.name === "@everyone"
      );
      if (!everyoneRole) continue;

      // Mencari channel yang bisa mengirim pesan
      const everyoneChannel = server.channels.cache.find(
        (channel) =>
          channel.type === "GUILD_TEXT" &&
          channel.permissionsFor(everyoneRole).has("SEND_MESSAGES")
      );

      // Jika channel ditemukan, kirim pengumuman
      if (everyoneChannel) {
        everyoneChannel.send(args.slice(1).join(" "));
      }
    }
  },
  take: async (message, args) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    const targetUser = message.mentions.users.first();
    const amount = parseInt(args[2]); // Changed to args[2] because args[1] will be the mention

    // Basic input validation
    if (!targetUser || !amount || amount <= 0) {
      return message.reply(`Usage: ${prefix}take <@user> <amount>`);
    }

    // Can't take money from yourself
    if (targetUser.id === message.author.id) {
      return message.reply("You can't take money from yourself!");
    }

    try {
      const result = await dataManager.takeMoney(
        message.author.id,
        targetUser.id,
        amount
      );

      const takeEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("💸 Money Transfer Successful!")
        .setDescription(
          `${message.author.username} took ${targetUser.username} some money!`
        )
        .addFields(
          {
            name: "Amount Transferred",
            value: `$${amount.toLocaleString()}`,
            inline: true,
          },
          {
            name: `${message.author.username}'s New Balance`,
            value: `$${result.fromUser.balance.toLocaleString()}`,
            inline: true,
          },
          {
            name: `${targetUser.username}'s New Balance`,
            value: `$${result.toUser.balance.toLocaleString()}`,
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter({ text: "Money Transfer System" });

      return message.reply({ embeds: [takeEmbed] });
    } catch (error) {
      if (error.message === "Target user does not have an account!") {
        return message.reply(
          `${targetUser.username} needs to register first! Tell them to use ${prefix}register`
        );
      }
      if (error.message === "Insufficient balance!") {
        return message.reply(
          `${targetUser} don't have enough money for this transfer!`
        );
      }

      console.error("Error in take command:", error);
      return message.reply("An error occurred while processing the transfer.");
    }
  },
  say: async (message, args) => {
    try {
      await message.delete();
      if (!ownerHelperFirewall(message.author.id, message)) return;
      const text = args.slice(1).join(" ");

      if (!text) {
        return message.reply("Please provide a message to send!");
      }

      await message.channel.send(text);
    } catch (error) {
      console.error("Error in say command:", error);
      return message.reply("An error occurred while processing the command.");
    }
  },

  sendto: async (message, args) => {
    // Delete the original command message for cleanliness
    try {
      await message.delete();
    } catch (error) {
      console.error("Couldn't delete command message:", error);
    }
    if (!ownerHelperFirewall(message.author.id, message)) return;
    // Check if there are enough arguments
    if (args.length < 2) {
      return message.channel.send(
        `Usage: ${prefix}say <#channel/@user> <message>`
      );
    }

    // Get mentioned channel or user
    const targetChannel = message.mentions.channels.first();
    const targetUser = message.mentions.users.first();
    const text = args.slice(2).join(" ");

    if (!text) {
      return message.channel.send("Please provide a message to send!");
    }

    try {
      if (targetChannel) {
        // Send to mentioned channel
        await targetChannel.send(text);
      } else if (targetUser) {
        try {
          // Send DM to mentioned user
          await targetUser.send(text);
        } catch (error) {
          console.error("Error sending DM:", error);
          if (error.code === 50007) {
            return message.channel.send(
              "Failed to send the message. Make sure I have the required permissions!"
            );
          }
        }
      } else {
        // Send to current channel
        await message.channel.send(text);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      await message.channel.send(
        "Failed to send the message. Make sure I have the required permissions!"
      );
    }
  },
  daily: (message) => {
    const setCD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();
    const lastDaily = dataManager.users[message.author.id].lastDaily;
    if (lastDaily && now - lastDaily < setCD) {
      const formatClockHHMMSS = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours
          .toString()
          .padStart(2, "0")}:${minutes.toString()}:${seconds
          .toString()
          .padStart(2, "0")}`;
      };
      const timeLeft = lastDaily + setCD - now;
      return message.reply(
        `You can claim your daily reward again in ${formatClockHHMMSS(
          timeLeft
        )}`
      );
    } else {
      const moneyRandom = Math.floor(Math.random() * 1000) + 1;
      dataManager.updateBalance(message.author.id, moneyRandom);
      message.reply(`You have claimed your daily reward of $${moneyRandom}!
        new balance: $${new Intl.NumberFormat("en-US").format(
          dataManager.users[message.author.id].balance
        )} `);
    }
    dataManager.users[message.author.id].lastDaily = now;
  },
  resetplayer: async (message) => {
    if (!ownerHelperFirewall(message.author.id, message)) return;
    try {
      const userId = message.mentions.users.first();
      if (!userId) return message.reply("Please mention a user to reset!");
      if (userId.id === config.ownerId[0])
        return message.reply("You cannot reset the owner of the bot!");
      await dataManager.resetPlayer(userId.id);
      return message.reply(`Player ${userId} has been reset.`);
    } catch (error) {
      console.error("Error in resetplayer command:", error);
      return message.reply("An error occurred while processing the command.");
    }
  },
};

// Event Handlers
client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // jika bot di tag dia akan menjalankan fungsi AI
  const getMessageMention = message.mentions.users.first();
  if (getMessageMention === client.user) {
    message.channel.sendTyping();
    const prompt = message.content
      .slice(message.content.indexOf(">") + 1)
      .trim();
    console.log(prompt);
    await dataManager.aiResponse(message, prompt);
  }

  if(!message.content.startsWith(prefix)) return;
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
