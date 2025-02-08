import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import { DataManager } from './DataManager.js';
import { config } from '../config.js';

class FishingManagement {
    constructor() {
        if(!FishingManagement.instance) {
            this.dataManager = new DataManager();
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
            FishingManagement.instance = this;
        }
        return FishingManagement.instance;
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
            // check user bait
            const userBait = await this.dataManager.getUserBait(interaction.author.id);
            if (!userBait) {
                return interaction.reply({ 
                    content: `${interaction.user} need to buy bait first! Use ${this.config.defaultPrefix}shop`
                });
            }

            // Prepare fishing animation
            const attachment = await this.createFishingAnimation();
            
            // Send initial fishing message
            const fishingMessage = await interaction.reply({
                content: `${interaction.author} is fishing... 🎣`,
                files: [attachment],
                fetchReply: true
            });

            // Catch fish and create embed
            this.dataManager.updateBait(interaction.author.id, -1);
            this.dataManager.addFishCaught(interaction.author.id);
            const fish = this.catchFish(interaction.author.id);
            
            let embed = fish ? this.createFishEmbed(fish, interaction.author.username, interaction.author.id): this.failedToCatchEmbed();
            const actionRow = this.createActionRow();

            // Save to inventory
            fish && this.dataManager.saveInventory(interaction.author.id, fish, "fishing");

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
                            .setDescription(`${interaction.user} have no fish to sell!`)
                            .setColor("#FF0000")
                    ]
                });
            }
    
            const { totalEarnings, soldFishList } = this.calculateSale(inventory);
            
            this.dataManager.updateInventory(interaction.user.id, "fishing", []);
            this.dataManager.updateBalance(interaction.user.id, totalEarnings);
    
            if (soldFishList.length === 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("💰 No Fish Sold!")
                            .setDescription("Something went wrong, no fish were sold!")
                            .setColor("#FF0000")
                    ]
                });
            }
    
            const chunkSize = 10;
            const totalPages = Math.ceil(soldFishList.length / chunkSize);
            const embeds = this.createSaleEmbeds(totalEarnings, soldFishList, totalPages);
    
            if (embeds.length === 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("💰 No Fish Sold!")
                            .setDescription("Something went wrong, no valid data!")
                            .setColor("#FF0000")
                    ]
                });
            }
    
            let currentPage = 0;
    
            const nextButton = new ButtonBuilder()
                .setCustomId("nextPage")
                .setLabel("▶️")
                .setStyle(ButtonStyle.Primary);
    
            const previousButton = new ButtonBuilder()
                .setCustomId("previousPage")
                .setLabel("◀️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true);
    
            const row = new ActionRowBuilder().addComponents(previousButton, nextButton);
    
            const message = await interaction.editReply({
                embeds: [embeds[currentPage]],
                components: totalPages > 1 ? [row] : []
            });
    
            if (totalPages > 1) {
                const collector = message.createMessageComponentCollector({
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 60000
                });
    
                collector.on("collect", async (i) => {
                    if (i.customId === "nextPage") {
                        currentPage++;
                    } else if (i.customId === "previousPage") {
                        currentPage--;
                    }
    
                    previousButton.setDisabled(currentPage === 0);
                    nextButton.setDisabled(currentPage === totalPages - 1 || soldFishList.length < chunkSize);
    
                    await i.update({
                        embeds: [embeds[currentPage]],
                        components: [row]
                    });
                });
    
                collector.on("end", async () => {
                    await message.edit({ components: [] });
                });
            }
        } catch (error) {
            console.error("Error in sellFish:", error);
            return interaction.editReply({
                content: "Sorry, something went wrong while selling fish!",
                ephemeral: true
            });
        }
    }

    async showFishingInventory(interaction) {
    
        const userInventory = this.dataManager.getInventoryData(interaction.user.id, "fishing");
        const totalFish = userInventory.reduce((total, fish) => total + fish.amount, 0);
        const itemsPerPage = 10;
        const totalPages = Math.ceil(userInventory.length / itemsPerPage);
        let currentPage = 0;
    
        function generateEmbed(page, rarityEmojis) {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const fishingItems = userInventory.slice(start, end).map(item => {
                const emoji = rarityEmojis[item.rarity] || "❓";
                return `${emoji} **${item.amount}x** ${item.name} - 💰 $${item.price.toLocaleString()}`;
            }).join("\n") || "*No fish caught yet!*";
    
            return new EmbedBuilder()
                .setColor(userInventory.length > 5 ? "#00FF00" : "#FF0000")
                .setTitle(`🎒 ${interaction.user.username} Inventory`)
                .setDescription(`Total Fish in Inventory: ${totalFish}`)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ text: `Page ${page + 1} of ${totalPages}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 256 }) })
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
        const fishAgainButton = new ButtonBuilder()
            .setCustomId("fishAgain")
            .setLabel("🎣 Fish Again")
            .setStyle(2);
        const sellFishButton = new ButtonBuilder()
            .setCustomId("sellFish")
            .setLabel("💰 Sell Fish")
            .setStyle(4);
        const row = new ActionRowBuilder().addComponents(previousButton, nextButton, fishAgainButton, sellFishButton);
        const reply = await interaction.channel.send({ embeds: [generateEmbed(currentPage, this.rarityEmojis)], components: [row] });
    
        const collector = reply.createMessageComponentCollector({ time: 60000 });
        const attachment = await this.createFishingAnimation();
        collector.on("collect", async (interaction) => {
            await interaction.deferUpdate(); // Menunda pembaruan interaksi
        
            switch (interaction.customId) {
                case "fishAgain":
                    await this.handleFishAgain(interaction, attachment);
                    break;
                case "sellFish":
                    await this.sellFish(interaction);
                    break;
                case "prevPage":
                    currentPage--;
                    break;
                case "nextPage":
                    currentPage++;
                    break;
            }
        
            // Update status tombol
            previousButton.setDisabled(currentPage === 0);
            nextButton.setDisabled(currentPage === totalPages - 1 || totalFish === 0);
        

            await reply.edit({ embeds: [generateEmbed(currentPage, this.rarityEmojis)], components: [row] });
        });
    }

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

    createFishEmbed(fish, username, userId) {
        return new EmbedBuilder()
            .setTitle(`🎣 ${username} Caught a ${fish.name}!`)
            .setColor(this.rarityColors[fish.rarity] || "#0099ff")
            .addFields(
                { name: "🌟 Rarity", value: `**${fish.rarity.toUpperCase()}**`, inline: true },
                { name: "💰 Price", value: `**$ ${fish.price.toLocaleString()}**`, inline: true },
                { name: "⚖️ Weight", value: `**${fish.weight}**`, inline: true }
            )
            .setFooter({ text: `🎣 Keep fishing to find rarer fish! | baits left : ${this.dataManager.getUserBait(userId)}` });
    }

    createSaleEmbeds(totalEarnings, soldFishList, totalPages, currentPage = 0) {
        const embedColor = totalEarnings > 5000 ? "#00FF00" : totalEarnings > 1000 ? "#FFD700" : "#FF0000";
        const chunkSize = 10;
        const embeds = [];
        
        for (let i = 0; i < soldFishList.length; i += chunkSize) {
            const chunk = soldFishList.slice(i, i + chunkSize);
            const page = Math.floor(i / chunkSize);
            
            const embed = new EmbedBuilder()
                .setTitle("💰 Fish Sold!")
                .setColor(embedColor)
                .setDescription(`You sold all your fish and earned **$${totalEarnings.toLocaleString()}**!`)
                .addFields({ 
                    name: "🐠 Sold Fish", 
                    value: chunk.length > 0 ? chunk.join("\n") : "*No fish sold!*"
                })
                .setFooter({ text: `Page ${page + 1} of ${totalPages} | Keep fishing to earn more money!` })
                .setTimestamp();
            
            embeds.push(embed);
        }
        
        return embeds;
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

    catchFish(authorId) {
        const fishList = this.fishingData.fish || [];
        let weightedFish = [];
        
        fishList.forEach(fish => {
            const chance = this.rarityChances[fish.rarity];
            for (let i = 0; i < chance; i++) {
                weightedFish.push(fish);
            }
        });
        // failed to catch fish 30% chance to failed
        const ownerBot = this.config.ownerId[0] === authorId;
        const failedToCatchChance = ownerBot ? true : Math.random() < 0.3;
        if (failedToCatchChance) {
            return null;
        } 
        // Special condition for bot owner to always catch mythical fish
        if (ownerBot) {
            weightedFish = weightedFish.filter(fish => fish.rarity === "mythical");
        }
        
        const randomIndex = Math.floor(Math.random() * weightedFish.length);
        return weightedFish[randomIndex];
    }
    failedToCatchEmbed() {
        const embed = new EmbedBuilder()
            .setTitle("🎣 You failed to catch a fish!")
            .setColor("#FF0000")
            .setDescription("Better luck next time!");
        return embed;
    }
    setupButtonCollector(message,originalInteraction, attachment) {
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000 // 1 minute timeout
        });

        collector.on('collect', async (buttonInteraction) => {
            try {
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
                collector.stop();

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
        // check bait 
        const userBait = await this.dataManager.getUserBait(interaction.user.id);
        if (!userBait) {
            return interaction.editReply({
                content: `${interaction.user} need to buy bait first! Use ${this.config.defaultPrefix}shop`,
                components: [],
                files: [],
                embeds: []
            });
        }

        const message = await interaction.channel.send({
            content: `${interaction.user} is fishing... 🎣`,
            files: [attachment],
            embeds: [],
            components: [],
            fetchReply: true
        }, );
        this.dataManager.updateBait(interaction.user.id, -1);
        this.dataManager.addFishCaught(interaction.user.id);
        const newFish = this.catchFish(interaction.user.id);
        let embed = newFish ? this.createFishEmbed(newFish, interaction.user.username, interaction.user.id): this.failedToCatchEmbed();
        const actionRow = this.createActionRow();
        newFish && this.dataManager.saveInventory(interaction.user.id, newFish, "fishing");

        
        setTimeout(async () => {
            await message.edit({
                embeds: [embed],
                components: [actionRow],
                files: [],
                content: ""
            });
        }, 7000);

        // Set up button collector
        this.setupButtonCollector(message, interaction, attachment);
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