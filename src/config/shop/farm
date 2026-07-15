import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} from "discord.js";
import { botConfig, getColor } from "../config/botConfig.js"; // adjust path to your actual config file
import { logger } from "../utils/logger.js"; // adjust path if different

const CUSTOM_ID_PREFIX = "farm";

// ---------------------------------------------------------------
// 1) PREFIX COMMAND: "!farm"
// Wire this into however your bot loads prefix commands.
// Most command loaders expect a shape like { name, execute(message, args, client) }.
// ---------------------------------------------------------------
export default {
  name: "farm",
  description: "Start a farm submission (Experience / Tapes / Boosts).",

  async execute(message) {
    const farmConfig = botConfig.farm;

    // Restrict to specific channels, if configured.
    const allowed = farmConfig?.allowedChannels ?? [];
    if (allowed.length > 0 && !allowed.includes(message.channel.id)) {
      const reply = await message.reply(
        "🚫 The `!farm` command can't be used in this channel."
      );
      setTimeout(() => {
        reply.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 5000);
      return;
    }

    const categories = farmConfig?.categories ?? {};
    const row = new ActionRowBuilder().addComponents(
      Object.entries(categories).map(([key, cat]) =>
        new ButtonBuilder()
          .setCustomId(`${CUSTOM_ID_PREFIX}_category_${key}`)
          .setLabel(cat.label)
          .setEmoji(cat.emoji)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const embed = new EmbedBuilder()
      .setColor(getColor("primary"))
      .setTitle("📋 Farm Submission")
      .setDescription("Choose a category below to open the submission form.")
      .setFooter({ text: botConfig.embeds.footer.text });

    await message.reply({ embeds: [embed], components: [row] });
  },
};

// ---------------------------------------------------------------
// 2) INTERACTION HANDLING
// Call `handleFarmInteraction(interaction)` from your central
// interactionCreate event file, e.g.:
//
//   import { handleFarmInteraction } from "../commands/farm.js";
//   client.on("interactionCreate", async (interaction) => {
//     if (interaction.customId?.startsWith("farm_")) {
//       return handleFarmInteraction(interaction);
//     }
//     // ...your existing routing
//   });
// ---------------------------------------------------------------
export async function handleFarmInteraction(interaction) {
  try {
    // --- Step A: button clicked -> show modal ---
    if (interaction.isButton() && interaction.customId.startsWith(`${CUSTOM_ID_PREFIX}_category_`)) {
      const categoryKey = interaction.customId.replace(`${CUSTOM_ID_PREFIX}_category_`, "");
      const category = botConfig.farm?.categories?.[categoryKey];
      if (!category) return;

      const modal = new ModalBuilder()
        .setCustomId(`${CUSTOM_ID_PREFIX}_modal_${categoryKey}`)
        .setTitle(`Farm Submission — ${category.label}`);

      const modelInput = new TextInputBuilder()
        .setCustomId("model")
        .setLabel("Model")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const usernameInput = new TextInputBuilder()
        .setCustomId("username")
        .setLabel("Username")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const amountInput = new TextInputBuilder()
        .setCustomId("amount")
        .setLabel("Amount")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const notesInput = new TextInputBuilder()
        .setCustomId("notes")
        .setLabel("Notes")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(modelInput),
        new ActionRowBuilder().addComponents(usernameInput),
        new ActionRowBuilder().addComponents(amountInput),
        new ActionRowBuilder().addComponents(notesInput)
      );

      await interaction.showModal(modal);
      return;
    }

    // --- Step B: modal submitted -> post embed ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith(`${CUSTOM_ID_PREFIX}_modal_`)) {
      const categoryKey = interaction.customId.replace(`${CUSTOM_ID_PREFIX}_modal_`, "");
      const category = botConfig.farm?.categories?.[categoryKey];

      const model = interaction.fields.getTextInputValue("model");
      const username = interaction.fields.getTextInputValue("username");
      const amount = interaction.fields.getTextInputValue("amount");
      const notes = interaction.fields.getTextInputValue("notes") || "—";

      const embed = new EmbedBuilder()
        .setColor(getColor("primary"))
        .setTitle(`📋 New Farm Submission — ${category?.label ?? categoryKey}`)
        .addFields(
          { name: "Model", value: model, inline: true },
          { name: "Username", value: username, inline: true },
          { name: "Amount", value: amount, inline: true },
          { name: "Notes", value: notes, inline: false }
        )
        .setFooter({
          text: `Submitted by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }
  } catch (err) {
    logger.error("Error handling farm interaction:", err);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction
        .reply({ content: "Something went wrong with that submission.", ephemeral: true })
        .catch(() => {});
    }
  }
}
