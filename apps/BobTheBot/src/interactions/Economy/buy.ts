import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { EconomyModel } from "../../models/index.js";
import { logger, requestItemData, raiseMiscellaneousError } from "../../utils/index.js";

const requiredBotPerms = {
  type: "flags" as const,
  key: [] as const,
};

const requiredUserPerms = {
  type: "flags" as const,
  key: [] as const,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy an item from the shop")
    .addStringOption((option) => option.setName("item").setDescription("The item to buy").setRequired(true))
    .setDMPermission(true),
  async execute(interaction: ChatInputCommandInteraction<"cached">) {
    const itemName = interaction.options.getString("item", true);

    const item = await requestItemData(itemName);
    if (!item) return raiseMiscellaneousError(interaction, "Item not found", "The item you specified was not found.");

    if (!item.buyable)
      return interaction.reply({
        content: `\`${item.name}\` is not buyable`,
        ephemeral: true,
      });

    await EconomyModel.findOne({
      UserId: interaction.user.id,
    })
      .then(async (data) => {
        if (!data?.Wallet) {
          return interaction.reply({
            content: "You do not have enough money to buy this item",
            ephemeral: true,
          });
        }

        if (data.Wallet < item.price) {
          return interaction.reply({
            content: "You do not have enough money in your wallet to buy this item",
            ephemeral: true,
          });
        } else {
          const itemIndex = data.Inventory.findIndex(
            (item) => item.id === itemName.toLowerCase().replaceAll(/\s+/g, "")
          );
          if (itemIndex === -1) {
            data.Inventory.push({
              id: item.id,
              amount: 1,
            });
          } else {
            const item = data.Inventory[itemIndex];
            item.amount++;
            data.Inventory[itemIndex] = item;
          }

          data.Wallet -= item.price;
          await data.save().catch((error) => logger.error(error));

          return interaction.reply({
            content: `You have bought a \`${item.name
              .replaceAll(/:.*?:/g, "")
              .replace(
                /(?:\u00A9\s|\u00AE\s|[\u2000-\u3300]\s|\uD83C[\uD000-\uDFFF]\s|\uD83D[\uD000-\uDFFF]\s|\uD83E[\uD000-\uDFFF])(?<ws>\s)?/,
                ""
              )}\` for ₳\`${item.price}\` Bobbucks`,
          });
        }
      })
      .catch(async (error) => {
        logger.error(error);
        return interaction.reply({
          content: "An error occurred while trying to buy this item",
          ephemeral: true,
        });
      });
  },
  requiredBotPerms,
  requiredUserPerms,
};
