import fs from "fs";
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType }from "discord.js";
import { config } from "../config.js";
import { DataManager } from "./DataManager.js";

const dataManager = new DataManager()
class FishingManagement {
    constructor() {
        this.fishingData = {};
        this.loadData();
    }

    async sellFish(interaction) {
        const rarityEmojis = {
            "common": "⚪",
            "uncommon": "🟢",
            "rare": "🔵",
            "epic": "🟣",
            "legendary": "🟠",
            "mythical": "🔴"
        };
    
        const inventory = dataManager.getInventoryData(interaction.user.id, "fishing");
    
        if (!inventory || inventory.length === 0) {
            return interaction.update({ content: "You don't have any fish to sell.", ephemeral: true });
        }
    
        let totalEarnings = 0;
        let soldFishList = [];
    
        inventory.forEach(fish => {
            const earnings = fish.price * fish.amount;
            totalEarnings += earnings;
            const emoji = rarityEmojis[fish.rarity] || "❓";
            soldFishList.push(`${emoji} **${fish.amount}x** ${fish.name} - 💰 $${earnings.toLocaleString()}`);
        });
    
        // Hapus semua ikan dari kategori "fishing"
        dataManager.updateInventory(interaction.user.id, "fishing", []);
    
        // Tambahkan saldo ke akun user
        dataManager.updateBalance(interaction.user.id, totalEarnings);
    
        const embedColor = totalEarnings > 5000 ? "#00FF00" : totalEarnings > 1000 ? "#FFD700" : "#FF0000";
    
        const embed = new EmbedBuilder()
            .setTitle("💰 Fish Sold!")
            .setColor(embedColor)
            .setDescription(`You sold all your fish and earned **$${totalEarnings.toLocaleString()}**!`)
            .addFields({ name: "🐠 Sold Fish", value: soldFishList.length > 0 ? soldFishList.join("\n") : "*No fish sold!*" })
            .setFooter({ text: "Keep fishing to earn more money!" })
            .setTimestamp();
    
        return interaction.update({ embeds: [embed], ephemeral: true });
    }
    
    
    async showFishingInventory(interaction) {
        const rarityEmojis = {
            "common": "⚪",
            "uncommon": "🟢",
            "rare": "🔵",
            "epic": "🟣",
            "legendary": "🟠",
            "mythical": "🔴"
        };
    
        const inventory = dataManager.getInventoryData(interaction.user.id, "fishing");
    
        if (!inventory || inventory.length === 0) {
            return interaction.update({ content: "You don't have any fish in your inventory.", ephemeral: true });
        }
    
        const totalFish = inventory.reduce((total, fish) => total + fish.amount, 0);
    
        const fishList = inventory.map(fish => {
            const emoji = rarityEmojis[fish.rarity] || "❓";
            return `${emoji} **${fish.amount}x** ${fish.name} - 💰 $${fish.price.toLocaleString()}`;
        });
    
        const embedColor = totalFish > 10 ? "#00FF00" : totalFish > 5 ? "#FFD700" : "#FF0000";
    
        const embed = new EmbedBuilder()
            .setTitle("🎣 Fishing Inventory")
            .setColor(embedColor)
            .setDescription(`You have **${totalFish}** fish in your inventory.`)
            .addFields({ name: "🐠 Fish List", value: fishList.join("\n") })
            .setFooter({ text: "Keep fishing to earn more money!" })
            .setTimestamp();
    
        return interaction.update({ embeds: [embed], ephemeral: true });
    }
    
    async startFishing(interaction) {
        const fish = this.catchFish();
        const rarityColors = {
            "common": "#A0A0A0",
            "uncommon": "#1ABC9C", 
            "rare": "#3498DB",
            "epic": "#9B59B6",
            "legendary": "#E67E22",
            "mythical": "#E74C3C"
        };
        
        const embed = new EmbedBuilder()
            .setTitle(`🎣 ${interaction.author.username} Caught a ${fish.name}!`)
            .setColor(rarityColors[fish.rarity] || "#0099ff")
            .addFields(
                { name: "🌟 Rarity", value: `**${fish.rarity.toUpperCase()}**`, inline: true },
                { name: "💰 Price", value: `**$ ${fish.price.toLocaleString()}**`, inline: true },
                { name: "⚖️ Weight", value: `**${fish.weight}**`, inline: true }
            )
            .setFooter({ text: "🎣 Keep fishing to find rarer fish!" });
    
        const buttonFishAgain = new ButtonBuilder()
            .setLabel("🎣 Fish Again")
            .setCustomId(`fishAgain`)
            .setStyle(ButtonStyle.Primary);
        const buttonSellFish = new ButtonBuilder()
            .setLabel("💰 Sell Fish")
            .setCustomId(`sellFish`)
            .setStyle(ButtonStyle.Danger);
        const buttonInventory = new ButtonBuilder()
            .setLabel("🎒 Inventory")
            .setCustomId(`inventory`)
            .setStyle(ButtonStyle.Secondary);
        const actionRow = new ActionRowBuilder().addComponents(buttonFishAgain, buttonSellFish, buttonInventory);
        dataManager.saveInventory(interaction.author.id, fish, "fishing");
        const response = await interaction.reply({ 
            embeds: [embed], 
            components: [actionRow],
            fetchReply: true 
        });
    
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });
        
        collector.on('collect', async (buttonInteraction) => {
            if(buttonInteraction.user.id !== interaction.author.id) {
                return buttonInteraction.reply({ content: "You can't use this button!", ephemeral: true });
            }
            if(buttonInteraction.customId === "fishAgain") {
                const newFish = this.catchFish(); // Generate a new fish
                
                const newEmbed = new EmbedBuilder()
                    .setTitle(`🎣 ${buttonInteraction.user.username} Caught a ${newFish.name}!`)
                    .setColor(rarityColors[newFish.rarity] || "#0099ff")
                    .addFields(
                        { name: "🌟 Rarity", value: `**${newFish.rarity.toUpperCase()}**`, inline: true },
                        { name: "💰 Price", value: `**$ ${newFish.price.toLocaleString()}**`, inline: true },
                        { name: "⚖️ Weight", value: `**${newFish.weight}**`, inline: true }
                    )
                    .setFooter({ text: "🎣 Keep fishing to find rarer fish!" });
        
                await buttonInteraction.update({ 
                    embeds: [newEmbed],
                    components: [actionRow]
                });
                dataManager.saveInventory(buttonInteraction.user.id, newFish, "fishing");
            }else if(buttonInteraction.customId === "sellFish") {
                await this.sellFish(buttonInteraction);
            }else if (buttonInteraction.customId === "inventory") {
                await this.showFishingInventory(buttonInteraction);
            }
        });
    
        collector.on('end', async () => {
            button.setDisabled(true);
        });
    }

    catchFish() {
        const fishList = this.fishingData.fish;
        const rarityChances = {
            "common": 50,
            "uncommon": 25,
            "rare": 15,
            "epic": 7,
            "legendary": 2,
            "mythical": 1
        };
        
        let weightedFish = [];
        fishList.forEach(fish => {
            for (let i = 0; i < rarityChances[fish.rarity]; i++) {
                weightedFish.push(fish);
            }
        });
        
        const randomIndex = Math.floor(Math.random() * weightedFish.length);
        return weightedFish[randomIndex];
    }

    async loadData() {
        try {
            if (fs.existsSync(`${config.fishingFile}`)) {
                const data = JSON.parse(fs.readFileSync(`${config.fishingFile}`, "utf8"));
                if (data) {
                    this.fishingData = data;
                }
            }
        } catch (error) {
            console.error("Error loading data:", error);
            this.fishingData = {};
        }
    }

}
 export default FishingManagement;
