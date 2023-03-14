import type { ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../utils/index.js";

export const RequiredPerms = {
  bot: [],
  user: [],
} as const;

export const PingCommand: Command = {
  name: "ping",
  description: "Returns the bots's latency",
  default_member_permissions: "0",
  dm_permission: true,
} as const;

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({
    content: "Pinging...",
    fetchReply: true,
    ephemeral: true,
  });

  await interaction.editReply(
    `:heartbeat: Websocket heartbeat: \`${interaction.client.ws.ping}ms\`.\n:comet: Rountrip Latency: \`${
      sent.createdTimestamp - interaction.createdTimestamp
    }ms\``
  );
}
