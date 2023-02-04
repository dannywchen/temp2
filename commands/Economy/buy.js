const { SlashCommandBuilder } = require("@discordjs/builders");
const { PermissionFlagsBits } = require("discord.js");
const EconomySchema = require("../../models/EconomyModel");
const fs = require("fs");

const requiredBotPerms = {
  type: "flags",
  key: [],
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy an item from the shop")
    .addStringOption((option) =>
      option.setName("item").setDescription("The item to buy").setRequired(true)
    ),
  async execute(interaction) {
    const itemName = interaction.options.getString("item");

    fs.readFile("./docs/items.json", (err, data) => {
      if (err) throw err;
      const itemsJSON = JSON.parse(data);

      const item = itemsJSON.find(
        (item) => item.id === itemName.toLowerCase().replace(/\s+/g, "")
      );
      if (!item) {
        return interaction.reply({
          content: `The item \`${itemName}\` does not exist in the shop`,
          ephemeral: true,
        });
      }
      if (!item.buyable) {
        return interaction.reply({
          content: `\`${item.name}\` is not buyable`,
          ephemeral: true,
        });
      }

      EconomySchema.findOne({
        UserId: interaction.user.id,
      }).then((data) => {
        if (!data) {
          return interaction.reply({
            content: "You do not have enough money to buy this item",
            ephemeral: true,
          });
        }
        if (data.Wallet < item.price) {
          return interaction.reply({
            content:
              "You do not have enough money in your wallet to buy this item",
            ephemeral: true,
          });
        } else {
          const itemIndex = data.Inventory.findIndex(
            (item) => item.id === itemName.toLowerCase().replace(/\s+/g, "")
          );
          if (itemIndex === -1) {
            data.Inventory.push({
              id: item.id,
              amount: 1,
            });
          } else {
            let item = data.Inventory[itemIndex];
            item.amount++;
            data.Inventory[itemIndex] = item;
          }
          data.Wallet -= item.price;
          data.save();
          return interaction.reply({
            content: `You have bought a \`${item.name
              .replace(/:.*?:/g, "")
              .slice(1)}\` for ₳\`${item.price}\` Bobbucks`,
          });
        }
      });
    });
  },
  requiredBotPerms: requiredBotPerms,
};
