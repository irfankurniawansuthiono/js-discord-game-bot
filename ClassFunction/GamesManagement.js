import axios from "axios";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  AttachmentBuilder,
} from "discord.js";
import { client } from "../index.js";
import { config, discordEmotes } from "../config.js";
import similarity from "similarity";
import { formatBalance } from "../index.js";
import { DataManager } from "./DataManager.js";
import { FileManagement } from "./FileManagement.js";
import sharp from "sharp";

const prefix = config.defaultPrefix;
const fileManagement = new FileManagement();
const dataManager = new DataManager();
const cooldowns = new Map();
const COOLDOWN_DURATION = 5 * 1000; // 5 seconds
class Games {
  constructor() {
    if (!Games.instance) {
      this.tbgSession = new Map();
      this.clSession = new Map();
      this.tbSession = new Map();
      Games.instance = this;
    }
    return Games.instance;
  }
  static async blackjack(message, bet) {
    // Check cooldown
    const lastUsed = cooldowns.get(message.author.id);
    const now = Date.now();

    if (lastUsed && now - lastUsed < COOLDOWN_DURATION) {
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before playing again!`
      );
    }
    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }

    // Handle "all-in" bet
    if (bet === "all") {
      if (user.balance <= 0) {
        return message.reply("You don't have any balance to bet!");
      }
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
        ":spades:": "Spades",
        ":clubs:": "Clubs",
        ":hearts:": "Hearts",
        ":diamonds:": "Diamonds",
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
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before playing again!`
      );
    }
    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (user.balance <= 0) {
      return message.reply("You don't have enough balance to play this game!");
    }

    // Handle "all-in" bet
    if (bet === "all") {
      if (user.balance <= 0) {
        return message.reply("You don't have any balance to bet!");
      }
      bet = user.balance;
    } else {
      bet = parseInt(bet);
      if (isNaN(bet)) return message.reply("Please enter a valid bet amount!");
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
        resultMessage = `\n${
          discordEmotes.error
        } You lost $${bet.toLocaleString()}`;
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
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before playing again!`
      );
    }
    if (choice !== "h" && choice !== "t") {
      return message.reply(
        "Invalid choice! Please choose 'h' for heads or 't' for tails."
      );
    }

    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (user.balance <= 0) {
      return message.reply("You don't have enough balance to play this game!");
    }

    // Handle "all-in" bet
    if (bet === "all") {
      if (user.balance <= 0) {
        return message.reply("You don't have any balance to bet!");
      }
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
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before playing again!`
      );
    }

    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

    let user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    if (bet === "all") {
      if (user.balance <= 0) {
        return message.reply("You don't have any balance to bet!");
      }
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
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (now - lastUsed)) / 1000
      );
      return message.reply(
        `Please wait ${remainingTime} seconds before slots again!`
      );
    }

    cooldowns.set(message.author.id, now); // Set waktu terakhir pemain melakukan tindakan

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
      if (user.balance <= 0) {
        return message.reply("You don't have any balance to bet!");
      }
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

  async cakLontong(message, guess, jawab) {
    const user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    try {
      const maxTime = 60 * 1000; // 60 seconds
      const database = JSON.parse(
        fileManagement.readFile("./db/caklontong.json")
      );
      const activeGame = this.clSession.get(message.channel.id);

      const startNewGame = async () => {
        const startMessage = await message.reply(
          `${discordEmotes.loading} loading...`
        );
        const randomIndex = Math.floor(Math.random() * database.length);
        const question = database[randomIndex];

        const gameSession = {
          questionIndex: randomIndex,
          answer: question.jawaban,
          timestamp: Date.now(),
          timerMessage: null,
        };

        this.clSession.set(message.channel.id, gameSession);

        const clEmbed = new EmbedBuilder()
          .setTitle("🎮 Cak Lontong")
          .setColor("#00FF00")
          .setDescription(
            `${question.soal}\n\nWaktu: ${
              maxTime / 1000
            } detik.\n\nUntuk menjawab gunakan \n${prefix}clt <jawaban>.`
          )
          .setFooter({
            text: "Created by Nanami",
            iconURL: client.user.displayAvatarURL(),
          });

        await startMessage.edit({ embeds: [clEmbed] });

        // Kirim pesan timer terpisah
        const timerMessage = await message.channel.send(
          `:hourglass_flowing_sand: Waktu tersisa: 60 detik`
        );
        gameSession.timerMessage = timerMessage;

        // Start countdown
        let remainingTime = maxTime / 1000;
        const interval = setInterval(async () => {
          remainingTime--;

          // Update timer message setiap 10 detik
          if (remainingTime % 10 === 0 && remainingTime > 0) {
            await timerMessage.edit(
              `:hourglass_flowing_sand: Waktu tersisa: ${remainingTime} detik`
            );
          }

          if (remainingTime <= 0) {
            clearInterval(interval);
            this.clSession.delete(message.channel.id);
            await timerMessage.edit("⏰ Waktu habis!");

            const embed = new EmbedBuilder()
              .setTitle("🎮 Cak Lontong")
              .setColor("#FF0000")
              .setDescription(
                `Waktu habis!\nJawaban: ${question.jawaban}\nDeskripsi: ${question.deskripsi}`
              );

            message.channel.send({ embeds: [embed] });
          }
        }, 1000);

        gameSession.interval = interval;
      };

      if (!guess) {
        if (activeGame) {
          return message.reply(
            "Ada permainan Cak Lontong yang sedang berlangsung!"
          );
        }
        return await startNewGame();
      }

      if (!activeGame) {
        return await startNewGame();
      }

      if (jawab) {
        if (message.author.id !== config.ownerId[0]) {
          return message.reply(
            "You don't have permission to use this command."
          );
        }
        const owner = await client.users.fetch(config.ownerId[0]);
        const answerEmbed = new EmbedBuilder()
          .setTitle("🎮 Cak Lontong - Jawaban")
          .setColor("#00FF00")
          .setDescription(
            `Jawaban: ${activeGame.answer}\nDeskripsi: ${question.deskripsi}`
          );
        return owner.send({ embeds: [answerEmbed] });
      }

      const normalizedGuess = guess.toUpperCase().trim();
      const normalizedAnswer = activeGame.answer.toUpperCase().trim();

      if (normalizedGuess === normalizedAnswer) {
        clearInterval(activeGame.interval);
        if (activeGame.timerMessage) {
          await activeGame.timerMessage.delete().catch(() => {});
        }

        const reward = 1000;
        dataManager.updateBalance(message.author.id, reward);
        this.clSession.delete(message.channel.id);

        const winEmbed = new EmbedBuilder()
          .setTitle("🎮 Cak Lontong")
          .setColor("#00FF00")
          .setDescription("🎉 Selamat! Jawaban kamu benar!")
          .addFields(
            { name: "Jawaban", value: normalizedAnswer, inline: true },
            { name: "Hadiah", value: `${formatBalance(reward)}`, inline: true },
            {
              name: "Saldo Kamu",
              value: `${formatBalance(user.balance)}`,
              inline: true,
            }
          );
        return message.reply({ embeds: [winEmbed] });
      } else if (similarity(normalizedGuess, normalizedAnswer)) {
        await message.delete();
        const reply = await message.channel.send(
          `${discordEmotes.error} Maaf, ${message.author}, jawaban kamu hampir benar. Coba lagi!`
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      } else {
        // Menangani jawaban yang salah total
        await message.delete();
        const reply = await message.channel.send(
          `${discordEmotes.error} Maaf, ${message.author}, jawaban kamu salah. Coba lagi!`
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      }
    } catch (error) {
      console.error("Error in cakLontong:", error);
      return message.reply("Terjadi kesalahan saat memproses permainan.");
    }
  }

  async tebakBendera(message, guess, jawab) {
    try {
      const user = dataManager.getUser(message.author.id);
      if (!user) {
        return message.reply(
          `You need to register first! Use ${prefix}register`
        );
      }

      const maxTime = 60 * 1000; // 60 seconds
      const database = JSON.parse(
        fileManagement.readFile("./db/tebakbendera.json")
      );
      const activeGame = this.tbSession.get(message.channel.id);

      const startNewGame = async () => {
        const startMessage = await message.reply(
          `${discordEmotes.loading} loading...`
        );
        const randomIndex = Math.floor(Math.random() * database.length);
        const question = database[randomIndex];

        const imageBuffer = await axios.get(question.img, {
          responseType: "arraybuffer",
        });

        // Gunakan Sharp untuk memperbesar gambar
        const resizedImageBuffer = await sharp(imageBuffer.data)
          .resize(1024, 1024, {
            // Ubah ukuran ke 1024x1024 piksel
            fit: "contain", // Gambar akan ditampilkan tanpa cropping
            background: { r: 255, g: 255, b: 255, alpha: 0 }, // Background transparan
          })
          .toBuffer();

        // Hasil buffer yang diperbesar
        const imageBuilderResult = new AttachmentBuilder(resizedImageBuffer, {
          name: "tebakbendera.png",
        });

        const gameSession = {
          questionIndex: randomIndex,
          answer: question.name,
          timestamp: Date.now(),
          timerMessage: null,
        };

        this.tbSession.set(message.channel.id, gameSession);

        const tgEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Bendera")
          .setColor("#00FF00")
          .setImage("attachment://tebakbendera.png")
          .setDescription(
            `Waktu: ${
              maxTime / 1000
            } detik.\nUntuk menjawab gunakan \n${prefix}tben <jawaban>.`
          )
          .setFooter({
            text: "Created by Nanami",
            iconURL: client.user.displayAvatarURL(),
          });

        await startMessage.edit({
          embeds: [tgEmbed],
          files: [imageBuilderResult],
        });

        // Kirim pesan timer terpisah
        const timerMessage = await message.channel.send(
          `:hourglass_flowing_sand: Waktu tersisa: 60 detik`
        );
        gameSession.timerMessage = timerMessage;

        // Start countdown
        let remainingTime = maxTime / 1000;
        const interval = setInterval(async () => {
          remainingTime--;

          // Update timer message setiap 10 detik
          if (remainingTime % 10 === 0 && remainingTime > 0) {
            await timerMessage.edit(
              `:hourglass_flowing_sand: Waktu tersisa: ${remainingTime} detik`
            );
          }

          if (remainingTime <= 0) {
            clearInterval(interval);
            this.tbSession.delete(message.channel.id);
            await timerMessage.edit("⏰ Waktu habis!");

            const embed = new EmbedBuilder()
              .setTitle("🎮 Tebak Bendera")
              .setColor("#FF0000")
              .setDescription(`Waktu habis!\nJawaban: ${question.name}`);

            return message.channel.send({ embeds: [embed] });
          }
        }, 1000);

        gameSession.interval = interval;
      };

      if (!guess) {
        if (activeGame) {
          return message.reply(
            "Ada permainan Tebak Bendera yang sedang berlangsung!"
          );
        }
        return await startNewGame();
      }

      if (!activeGame) {
        return await startNewGame();
      }

      if (jawab) {
        if (message.author.id !== config.ownerId[0]) {
          return message.reply(
            "You don't have permission to use this command."
          );
        }
        const owner = await client.users.fetch(config.ownerId[0]);
        const answerEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Bendera - Jawaban")
          .setColor("#00FF00")
          .setDescription(`Jawaban: ${activeGame.answer}`);
        return owner.send({ embeds: [answerEmbed] });
      }

      const normalizedGuess = guess.toUpperCase().trim();
      const normalizedAnswer = activeGame.answer.toUpperCase().trim();

      if (normalizedGuess === normalizedAnswer) {
        clearInterval(activeGame.interval);
        if (activeGame.timerMessage) {
          await activeGame.timerMessage.delete().catch(() => {});
        }
        this.tbSession.delete(message.channel.id);
        const reward = 1000;
        dataManager.updateBalance(message.author.id, reward);

        const winEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Bendera")
          .setColor("#00FF00")
          .setDescription("🎉 Selamat! Jawaban kamu benar!")
          .addFields(
            { name: "Jawaban", value: normalizedAnswer, inline: true },
            { name: "Hadiah", value: `${formatBalance(reward)}`, inline: true },
            {
              name: "Saldo Kamu",
              value: `${formatBalance(user.balance)}`,
              inline: true,
            }
          );
        return message.reply({ embeds: [winEmbed] });
      } else {
        // Jawaban salah
        await message.delete();
        const reply = await message.channel.send(
          `${discordEmotes.error} Maaf, ${message.author}, jawaban kamu salah. Coba lagi!`
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      }
    } catch (error) {
      console.error("Error in tebakBendera:", error);
      return message.reply("Terjadi kesalahan saat memproses permainan.");
    }
  }
  async tebakGambar(message, guess, clue, jawab) {
    const user = dataManager.getUser(message.author.id);
    if (!user) {
      return message.reply(`You need to register first! Use ${prefix}register`);
    }
    try {
      const maxTime = 60 * 1000; // 60 seconds
      const database = JSON.parse(
        fileManagement.readFile("./db/tebakgambar.json")
      );
      const activeGame = this.tbgSession.get(message.channel.id);

      const startNewGame = async () => {
        const startMessage = await message.reply(
          `${discordEmotes.loading} loading...`
        );
        const randomIndex = Math.floor(Math.random() * database.length);
        const question = database[randomIndex];

        const imageBuffer = await axios.get(question.img, {
          responseType: "arraybuffer",
        });

        const imageBuilderResult = new AttachmentBuilder(imageBuffer.data, {
          name: "tebakgambar.png",
        });

        const gameSession = {
          questionIndex: randomIndex,
          answer: question.jawaban,
          clue: question.deskripsi,
          timestamp: Date.now(),
          timerMessage: null,
        };

        this.tbgSession.set(message.channel.id, gameSession);

        const tgEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Gambar")
          .setColor("#00FF00")
          .setImage("attachment://tebakgambar.png")
          .setDescription(
            `Silakan tebak gambarnya!\n\nWaktu: ${
              maxTime / 1000
            } detik.\n\nButuh Clue? ${prefix}tg clue\nUntuk menjawab gunakan \n${prefix}tg <jawaban>.`
          )
          .setFooter({
            text: "Created by Nanami",
            iconURL: client.user.displayAvatarURL(),
          });

        await startMessage.edit({
          embeds: [tgEmbed],
          files: [imageBuilderResult],
        });

        // Kirim pesan timer terpisah
        const timerMessage = await message.channel.send(
          `:hourglass_flowing_sand: Waktu tersisa: 60 detik`
        );
        gameSession.timerMessage = timerMessage;

        // Start countdown
        let remainingTime = maxTime / 1000;
        const interval = setInterval(async () => {
          remainingTime--;

          // Update timer message setiap 10 detik
          if (remainingTime % 10 === 0 && remainingTime > 0) {
            await timerMessage.edit(
              `:hourglass_flowing_sand: Waktu tersisa: ${remainingTime} detik`
            );
          }

          if (remainingTime <= 0) {
            clearInterval(interval);
            this.tbgSession.delete(message.channel.id);
            await timerMessage.edit("⏰ Waktu habis!");

            const embed = new EmbedBuilder()
              .setTitle("🎮 Tebak Gambar")
              .setColor("#FF0000")
              .setDescription(`Waktu habis!\nJawaban: ${question.jawaban}`);

            message.channel.send({ embeds: [embed] });
          }
        }, 1000);

        gameSession.interval = interval;
      };

      if (!guess) {
        if (activeGame) {
          return message.reply(
            "Ada permainan Tebak Gambar yang sedang berlangsung!"
          );
        }
        return await startNewGame();
      }

      if (!activeGame) {
        return await startNewGame();
      }

      if (clue) {
        const clueEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Gambar - Clue")
          .setColor("#00FF00")
          .setDescription(`Clue: ${activeGame.clue}`);
        return message.reply({ embeds: [clueEmbed] });
      }

      if (jawab) {
        if (message.author.id !== config.ownerId[0]) {
          return message.reply(
            "You don't have permission to use this command."
          );
        }
        const owner = await client.users.fetch(config.ownerId[0]);
        const answerEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Gambar - Jawaban")
          .setColor("#00FF00")
          .setDescription(`Jawaban: ${activeGame.answer}`);
        return owner.send({ embeds: [answerEmbed] });
      }

      const normalizedGuess = guess.toUpperCase().trim();
      const normalizedAnswer = activeGame.answer.toUpperCase().trim();

      if (normalizedGuess === normalizedAnswer) {
        clearInterval(activeGame.interval);
        if (activeGame.timerMessage) {
          await activeGame.timerMessage.delete().catch(() => {});
        }
        this.tbgSession.delete(message.channel.id);
        const reward = 1000;
        dataManager.updateBalance(message.author.id, reward);
        this.clSession.delete(message.channel.id);

        const winEmbed = new EmbedBuilder()
          .setTitle("🎮 Tebak Gambar")
          .setColor("#00FF00")
          .setDescription("🎉 Selamat! Jawaban kamu benar!")
          .addFields(
            { name: "Jawaban", value: normalizedAnswer, inline: true },
            { name: "Hadiah", value: `${formatBalance(reward)}`, inline: true },
            {
              name: "Saldo Kamu",
              value: `${formatBalance(user.balance)}`,
              inline: true,
            }
          );
        return message.reply({ embeds: [winEmbed] });
      } else if (similarity(normalizedGuess, normalizedAnswer)) {
        await message.delete();
        const reply = await message.channel.send(
          `${discordEmotes.error} Maaf, ${message.author}, jawaban kamu hampir benar. Coba lagi!`
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      } else {
        // Menangani jawaban yang salah total
        await message.delete();
        const reply = await message.channel.send(
          `${discordEmotes.error} Maaf, ${message.author}, jawaban kamu salah. Coba lagi!`
        );
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      }
    } catch (error) {
      console.error("Error in tebakGambar:", error);
      return message.reply("Terjadi kesalahan saat memproses permainan.");
    }
  }
}

export { Games };
