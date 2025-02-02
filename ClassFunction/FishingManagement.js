import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import { DataManager } from './DataManager.js';
import { config } from '../config.js';
class FishingManagement {
    constructor() {
        this.dataManager = new DataManager;
        this.config = config;
        this.fishingData = {};
        this.rarityColors = {
            common: "#A0A0A0",
            uncommon: "#1ABC9C",
            rare: "#3498DB",
            epic: "#9B59B6",
            legendary: "#E67E22",
            mythical: "#E74C3C"
        };
        this.rarityEmojis = {
            common: "⚪",
            uncommon: "🟢",
            rare: "🔵",
            epic: "🟣",
            legendary: "🟠",
            mythical: "🔴"
        };
        this.rarityChances = {
            common: 50,
            uncommon: 25,
            rare: 15,
            epic: 7,
            legendary: 2,
            mythical: 1
        };
        this.loadData();
    }

    async startFishing(interaction) {
        try {
            // Check if user is registered
            const user = await this.dataManager.getUser(interaction.author.id);
            if (!user) {
                return interaction.reply({ 
                    content: `You need to register first! Use ${this.config.defaultPrefix}register`, 
                    ephemeral: true 
                });
            }

            // Prepare fishing animation
            const attachment = await this.createFishingAnimation();
            
            // Send initial fishing message
            const fishingMessage = await interaction.reply({
                content: 'You are fishing... 🎣',
                files: [attachment],
                fetchReply: true
            });

            // Catch fish and create embed
            const fish = this.catchFish(interaction.author.id);
            const embed = this.createFishEmbed(fish, interaction.author.username);
            const actionRow = this.createActionRow();

            // Save to inventory
            this.dataManager.saveInventory(interaction.author.id, fish, "fishing");

            // Update message after delay
            setTimeout(async () => {
                await fishingMessage.edit({
                    embeds: [embed],
                    components: [actionRow],
                    files: [],
                    content: ""
                });
            }, 7000);

            // Set up button collector
            this.setupButtonCollector(fishingMessage, interaction, attachment);
        } catch (error) {
            console.error("Error in startFishing:", error);
            return interaction.reply({
                content: "Sorry, something went wrong while fishing!",
                ephemeral: true
            });
        }
    }

    async sellFish(interaction) {
        try {
            const inventory = this.dataManager.getInventoryData(interaction.user.id, "fishing");

            if (!inventory || inventory.length === 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("💰 Fish Not Sold!")
                            .setDescription("You have no fish to sell!")
                            .setColor("#FF0000")
                    ]
                });
            }

            const { totalEarnings, soldFishList } = this.calculateSale(inventory);

            // Update user data
            await this.dataManager.updateInventory(interaction.user.id, "fishing", []);
            await this.dataManager.updateBalance(interaction.user.id, totalEarnings);

            // Create and send embed
            const embed = this.createSaleEmbed(totalEarnings, soldFishList);
            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error in sellFish:", error);
            return interaction.editReply({
                content: "Sorry, something went wrong while selling fish!",
                ephemeral: true
            });
        }
    }

    async showFishingInventory(interaction) {
        try {
            const inventory = this.dataManager.getInventoryData(interaction.user.id, "fishing");

            if (!inventory || inventory.length === 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("🎒 Fishing Inventory")
                            .setDescription("You have no fish in your inventory!")
                            .setColor("#FF0000")
                    ]
                });
            }

            const totalFish = inventory.reduce((total, fish) => total + fish.amount, 0);
            const fishList = this.createInventoryList(inventory);
            const embed = this.createInventoryEmbed(totalFish, fishList);

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error in showFishingInventory:", error);
            return interaction.editReply({
                content: "Sorry, something went wrong while showing inventory!",
                ephemeral: true
            });
        }
    }

    // Helper Methods
    async createFishingAnimation() {
        const fishingGif = "./assets/fishing/fishing-animation.gif";
        const buffer = await fs.promises.readFile(fishingGif);
        return new AttachmentBuilder(buffer, { name: 'fishing-animation.gif' });
    }

    createActionRow() {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("🎣 Fish Again")
                    .setCustomId("fishAgain")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel("💰 Sell Fish")
                    .setCustomId("sellFish")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setLabel("🎒 Inventory")
                    .setCustomId("inventory")
                    .setStyle(ButtonStyle.Secondary)
            );
    }

    createFishEmbed(fish, username) {
        return new EmbedBuilder()
            .setTitle(`🎣 ${username} Caught a ${fish.name}!`)
            .setColor(this.rarityColors[fish.rarity] || "#0099ff")
            .addFields(
                { name: "🌟 Rarity", value: `**${fish.rarity.toUpperCase()}**`, inline: true },
                { name: "💰 Price", value: `**$ ${fish.price.toLocaleString()}**`, inline: true },
                { name: "⚖️ Weight", value: `**${fish.weight}**`, inline: true }
            )
            .setFooter({ text: "🎣 Keep fishing to find rarer fish!" });
    }

    createSaleEmbed(totalEarnings, soldFishList) {
        const embedColor = totalEarnings > 5000 ? "#00FF00" : totalEarnings > 1000 ? "#FFD700" : "#FF0000";
        return new EmbedBuilder()
            .setTitle("💰 Fish Sold!")
            .setColor(embedColor)
            .setDescription(`You sold all your fish and earned **$${totalEarnings.toLocaleString()}**!`)
            .addFields({ 
                name: "🐠 Sold Fish", 
                value: soldFishList.length > 0 ? soldFishList.join("\n") : "*No fish sold!*" 
            })
            .setFooter({ text: "Keep fishing to earn more money!" })
            .setTimestamp();
    }

    createInventoryEmbed(totalFish, fishList) {
        const embedColor = totalFish > 10 ? "#00FF00" : totalFish > 5 ? "#FFD700" : "#FF0000";
        return new EmbedBuilder()
            .setTitle("🎣 Fishing Inventory")
            .setColor(embedColor)
            .setDescription(`You have **${totalFish}** fish in your inventory.`)
            .addFields({ name: "🐠 Fish List", value: fishList.join("\n") })
            .setFooter({ text: "Keep fishing to earn more money!" })
            .setTimestamp();
    }

    calculateSale(inventory) {
        let totalEarnings = 0;
        let soldFishList = [];

        inventory.forEach(fish => {
            const earnings = fish.price * fish.amount;
            totalEarnings += earnings;
            const emoji = this.rarityEmojis[fish.rarity] || "❓";
            soldFishList.push(`${emoji} **${fish.amount}x** ${fish.name} - 💰 $${earnings.toLocaleString()}`);
        });

        return { totalEarnings, soldFishList };
    }

    createInventoryList(inventory) {
        return inventory.map(fish => {
            const emoji = this.rarityEmojis[fish.rarity] || "❓";
            return `${emoji} **${fish.amount}x** ${fish.name} - 💰 $${fish.price.toLocaleString()}`;
        });
    }

    catchFish(authorId) {
        const fishList = this.fishingData.fish;
        let weightedFish = [];
        
        fishList.forEach(fish => {
            const chance = this.rarityChances[fish.rarity];
            for (let i = 0; i < chance; i++) {
                weightedFish.push(fish);
            }
        });
        if(authorId === config.ownerId[0]){
            weightedFish = weightedFish.filter(fish => fish.rarity === "mythical");
        }
        const randomIndex = Math.floor(Math.random() * weightedFish.length);
        return weightedFish[randomIndex];
    }

    setupButtonCollector(message, originalInteraction, attachment) {
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (buttonInteraction) => {
            try {
                if (buttonInteraction.user.id !== originalInteraction.author.id) {
                    return buttonInteraction.reply({ 
                        content: "You can't use this button!", 
                        ephemeral: true 
                    });
                }

                await buttonInteraction.deferUpdate();

                switch (buttonInteraction.customId) {
                    case 'fishAgain':
                        await this.handleFishAgain(buttonInteraction, attachment);
                        break;
                    case 'sellFish':
                        await this.sellFish(buttonInteraction);
                        break;
                    case 'inventory':
                        await this.showFishingInventory(buttonInteraction);
                        break;
                }
            } catch (error) {
                console.error("Error in button collector:", error);
            }
        });

        collector.on('end', () => {
            const disabledRow = this.createActionRow();
            disabledRow.components.forEach(button => button.setDisabled(true));
            message.edit({ components: [disabledRow] }).catch(console.error);
        });
    }

    async handleFishAgain(interaction, attachment) {
        await interaction.editReply({
            content: "You are fishing... 🎣",
            files: [attachment],
            embeds: [],
            components: []
        });

        const newFish = this.catchFish(interaction.user.id);
        const embed = this.createFishEmbed(newFish, interaction.user.username);
        const actionRow = this.createActionRow();

        this.dataManager.saveInventory(interaction.user.id, newFish, "fishing");

        setTimeout(async () => {
            await interaction.editReply({
                embeds: [embed],
                components: [actionRow],
                files: [],
                content: ""
            });
        }, 7000);
    }

    loadData() {
        try {
            const filePath = this.config.fishingFile;
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
                this.fishingData = data || {};
            }
        } catch (error) {
            console.error("Error loading fishing data:", error);
            this.fishingData = {};
        }
    }
}

export default FishingManagement;