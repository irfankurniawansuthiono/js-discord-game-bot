import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { config } from "../config.js";
import { formatBalance } from "../index.js";
import fs from "fs";
import { DataManager } from "./DataManager.js";

class ShopManagement {
  constructor() {
    if (!ShopManagement.instance) {
      this.shopData = JSON.parse(fs.readFileSync("./db/shop.json", "utf-8"));
      this.client = null;
      this.dataManager = new DataManager();
      ShopManagement.instance = this;
    }
    return ShopManagement.instance;
  }

  setClient(client) {
    this.client = client;
  }

  getShopData() {
    return this.shopData;
  }

  async showShopCategories(client, message) {
    if (!this.client) {
      this.setClient(client);
    }

    const categories = this.shopData;
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("categorySelect")
      .setPlaceholder("Select Category...")
      .addOptions(
        categories.map((category) => ({
          label: category.name,
          value: category.id.toString(),
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("🛒 Shop Categories")
      .setDescription("Please select a category to view items");

    const reply = await message.reply({
      embeds: [embed],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: 3,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      const selectedCategoryId = interaction.values[0];
      await this.showItemsInCategory(interaction, selectedCategoryId);
    });

    collector.on("end", () => {
      selectMenu.setDisabled(true);
      reply
        .edit({
          components: [new ActionRowBuilder().addComponents(selectMenu)],
        })
        .catch(console.error);
    });
  }

  async showItemsInCategory(interaction, categoryId) {
    const category = this.shopData.find(
      (cat) => cat.id.toString() === categoryId
    );

    if (!category) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription("Category not found!");
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    if (
      category.items &&
      Array.isArray(category.items) &&
      category.items.length > 0
    ) {
      const subCategoryMenu = new StringSelectMenuBuilder()
        .setCustomId("subCategorySelect")
        .setPlaceholder("Select Sub-Category...")
        .addOptions(
          category.items.map((subCategory) => ({
            label: subCategory.name,
            value: `${categoryId}-${subCategory.name}`,
          }))
        );

      const row = new ActionRowBuilder().addComponents(subCategoryMenu);

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle(`📦 ${category.name}`)
        .setDescription("Please select a sub-category");

      const reply = await interaction.followUp({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });

      const collector = reply.createMessageComponentCollector({
        componentType: 3,
        time: 60000,
      });

      collector.on("collect", async (subInteraction) => {
        await subInteraction.deferUpdate();
        const [catId, subCatName] = subInteraction.values[0].split("-");
        const subCategory = category.items.find(
          (sub) => sub.name === subCatName
        );

        if (subCategory && subCategory.items) {
          const itemMenu = new StringSelectMenuBuilder()
            .setCustomId("itemSelect")
            .setPlaceholder("Select Item...")
            .addOptions(
              subCategory.items.map((item) => ({
                label: item.name,
                description: `Price: ${formatBalance(item.price)}`,
                value: `${categoryId}-${subCatName}-${item.name}`,
              }))
            );

          const itemRow = new ActionRowBuilder().addComponents(itemMenu);

          const itemsEmbed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle(`🏪 ${category.name} - ${subCategory.name}`)
            .setDescription("Select an item to view details");

          const subReply = await subInteraction.followUp({
            embeds: [itemsEmbed],
            components: [itemRow],
            ephemeral: true,
          });

          const itemCollector = subReply.createMessageComponentCollector({
            componentType: 3,
            time: 60000,
          });

          itemCollector.on("collect", async (itemInteraction) => {
            await itemInteraction.deferUpdate();
            const [catId, subCatName, itemName] =
              itemInteraction.values[0].split("-");
            const selectedItem = subCategory.items.find(
              (item) => item.name === itemName
            );

            if (selectedItem) {
              const itemEmbed = new EmbedBuilder()
                .setColor("#00ff00")
                .setTitle(`📋 Item Details`)
                .setFields([
                  { name: "Category", value: category.name, inline: true },
                  {
                    name: "Sub-Category",
                    value: subCategory.name,
                    inline: true,
                  },
                  { name: "Item", value: selectedItem.name, inline: true },
                  {
                    name: "Price",
                    value: formatBalance(selectedItem.price),
                    inline: true,
                  },
                  { name: "Description", value: selectedItem.description },
                ]);

              const buyButton = new ButtonBuilder()
                .setCustomId("buy")
                .setLabel("✅ Buy")
                .setStyle(ButtonStyle.Success);

              const cancelButton = new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("❌ Cancel")
                .setStyle(ButtonStyle.Danger);

              const buttonRow = new ActionRowBuilder().addComponents(
                buyButton,
                cancelButton
              );

              const sub2Reply = await itemInteraction.followUp({
                embeds: [itemEmbed],
                components: [buttonRow],
                ephemeral: true,
              });

              // Mengubah componentType menjadi 2 untuk Button
              const buttonCollector = sub2Reply.createMessageComponentCollector(
                {
                  componentType: 2, // BUTTON
                  time: 60000,
                }
              );

              buttonCollector.on("collect", async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                if (buttonInteraction.customId === "buy") {
                    const userBalance = this.dataManager.getUser(
                      buttonInteraction.user.id
                    ).balance;

                  if (userBalance < selectedItem.price*1.2) {
                    const errorEmbed = new EmbedBuilder()
                      .setColor("#ff0000")
                      .setTitle("❌ Error")
                      .setDescription("You don't have enough balance to buy this item.");
                      buttonCollector.stop();
                    return buttonInteraction.followUp({
                      embeds: [errorEmbed],
                      ephemeral: true,
                    });
                  }else {
                    this.dataManager.updateBalance(buttonInteraction.user.id, -(selectedItem.price*1.2));
                    if (subCategory.name === "Bait Shop") {
                      this.dataManager.updateBait(buttonInteraction.user.id, selectedItem.qty);
                    }
                  }
                  const currentDate = new Date();
                  const transactionId = Math.random()
                    .toString(36)
                    .substring(2, 15);

                  // Buat struk dengan embed
                  const receiptEmbed = new EmbedBuilder()
                    .setColor("#00ff00")
                    .setTitle("🧾 Purchase Receipt")
                    .setDescription("Thank you for your purchase!")
                    .setFields([
                      {
                        name: "Transaction Details",
                        value: `ID: \`${transactionId}\`\nDate: \`${currentDate.toLocaleString()}\``,
                      },
                      {
                        name: "Store Information",
                        value: `Category: ${category.name}\nSub-Category: ${subCategory.name}`,
                      },
                      {
                        name: "Item Purchased",
                        value: `Name: ${
                          selectedItem.name
                        }\nPrice: ${formatBalance(selectedItem.price)}`,
                      },
                      {
                        name: "Purchase Summary",
                        value: [
                          "```",
                          "Item Price:     " +
                            formatBalance(selectedItem.price),
                          "Tax (20%):      " +
                            formatBalance(selectedItem.price * 0.2),
                          "─────────────────────────",
                          "Total:          " +
                            formatBalance(selectedItem.price * 1.2),
                          "```",
                        ].join("\n"),
                      },
                    ])
                    .setFooter({
                      text: `Transaction ID: ${transactionId} • Keep this receipt for your records`,
                    })
                    .setTimestamp();

                    
                  // Kirim notifikasi ke channel
                  const buyEmbed = new EmbedBuilder()
                    .setColor("#00ff00")
                    .setTitle("✅ Purchase Successful")
                    .setDescription(
                      `You just bought ${selectedItem.name} for ${formatBalance(
                        selectedItem.price*1.2
                      )} (included 20% tax)`
                    );

                  // Kirim struk ke DM user
                  await buttonInteraction.user.send({
                    content: "Here's your purchase receipt:",
                    embeds: [receiptEmbed],
                  });

                  // Kirim konfirmasi ke channel
                  await buttonInteraction.followUp({
                    embeds: [buyEmbed],
                    ephemeral: true,
                  });
                } else if (buttonInteraction.customId === "cancel") {
                  // Handle cancel action
                  const cancelEmbed = new EmbedBuilder()
                    .setColor("#ff0000")
                    .setTitle("❌ Purchase Cancelled")
                    .setDescription("Transaction has been cancelled.");

                  await buttonInteraction.followUp({
                    embeds: [cancelEmbed],
                    ephemeral: true,
                  });
                }
                buttonCollector.stop();
              });

              buttonCollector.on("end", () => {
                const disabledRow = new ActionRowBuilder().addComponents(
                  buyButton.setDisabled(true),
                  cancelButton.setDisabled(true)
                );
                sub2Reply
                  .edit({ components: [disabledRow] })
                  .catch(console.error);
              });
            }
            itemCollector.stop();
          });

          itemCollector.on("end", () => {
            itemMenu.setDisabled(true);
            subReply
              .edit({
                components: [new ActionRowBuilder().addComponents(itemMenu)],
              })
              .catch(console.error);
          });
        }
        collector.stop();
      });

      collector.on("end", () => {
        subCategoryMenu.setDisabled(true);
        reply
          .edit({
            components: [new ActionRowBuilder().addComponents(subCategoryMenu)],
          })
          .catch(console.error);
      });
    }
  }
}

export default ShopManagement;
