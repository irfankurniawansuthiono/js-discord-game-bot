import fs from "fs";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { config } from "../config.js";
import { formatBalance } from "../index.js";

class ShopManagement {
    constructor() {
        this.shopData = JSON.parse(fs.readFileSync("./db/shop.json", "utf-8"));
    }

    getShopData() {
        return this.shopData;
    }

    showShopList(message) {
        const shopList = this.shopData.map((item) => `**${item.item}**: ${formatBalance(item.price)}`).join("\n");
        const embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("🛒 Shop List")
            .setDescription(shopList);
        return message.reply({ embeds: [embed] });
    }
}

export default ShopManagement;