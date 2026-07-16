import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
} from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { ErrorTypes, replyUserError } from '../../utils/errorHandler.js';

// Channel IDs where farm submissions are allowed. Leave empty to allow everywhere.
const ALLOWED_CHANNEL_IDS = [
  // "123456789012345678",
];

const CATEGORIES = {
  scb: { label: 'SCB', emoji: '💰' },
  experience: { label: 'Experience', emoji: '⭐' },
  tapes: { label: 'Tapes', emoji: '📼' },
};

export default {
  data: new SlashCommandBuilder()
    .setName('farm')
    .setDescription('Submit a farm entry (SCB / Experience / Tapes)'),

  async execute(interaction) {
    if (!interaction.guild) {
      return await replyUserError(interaction, {
        type: ErrorTypes.UNKNOWN,
        message: 'This command can only be used in a server.',
      });
    }

    if (
      ALLOWED_CHANNEL_IDS.length > 0 &&
      !ALLOWED_CHANNEL_IDS.includes(interaction.channel.id)
    ) {
      return await replyUserError(interaction, {
        type: ErrorTypes.PERMISSION,
        message: 'This command can only be used in the designated farm channel(s).',
      });
    }

    // If this was triggered via "!farm" (prefix command), react to the
    // original message with 🔥. Slash-command invocations have no
    // message to react to, so this only fires for the prefix path.
    const triggerMessage = interaction._responseCoordinator?.message;
    if (triggerMessage) {
      await triggerMessage.react('🔥').catch(() => {});
    }

    // --- Step 1: show the service dropdown ---
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('farm_category_select')
      .setPlaceholder('Choose a service')
      .addOptions(
        Object.entries(CATEGORIES).map(([key, cat]) => ({
          label: cat.label,
          value: key,
          emoji: cat.emoji,
        })),
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const introEmbed = createEmbed({
      title: 'Farm Submission',
      description: 'Choose a service below to open the submission form.',
    });

    await interaction.reply({ embeds: [introEmbed], components: [row] });
    const message = await interaction.fetchReply();

    // --- Step 2: wait for a selection ---
    const selectInteraction = await message
      .awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter: (i) => i.user.id === interaction.user.id && i.customId === 'farm_category_select',
        time: 5 * 60 * 1000, // 5 minutes
      })
      .catch(() => null);

    if (!selectInteraction) {
      await interaction.editReply({ components: [] }).catch(() => {});
      return;
    }

    const categoryKey = selectInteraction.values[0];
    const category = CATEGORIES[categoryKey];

    // --- Step 3: show the modal form ---
    const modal = new ModalBuilder()
      .setCustomId(`farm_modal_${categoryKey}`)
      .setTitle(`Farm Submission - ${category.label}`);

    const modelInput = new TextInputBuilder()
      .setCustomId('model')
      .setLabel('Model')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const usernameInput = new TextInputBuilder()
      .setCustomId('username')
      .setLabel('Username')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const amountInput = new TextInputBuilder()
      .setCustomId('amount')
      .setLabel('Amount')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const notesInput = new TextInputBuilder()
      .setCustomId('notes')
      .setLabel('Notes')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(modelInput),
      new ActionRowBuilder().addComponents(usernameInput),
      new ActionRowBuilder().addComponents(amountInput),
      new ActionRowBuilder().addComponents(notesInput),
    );

    await selectInteraction.showModal(modal);

    // --- Step 4: wait for the modal submission ---
    const submitted = await selectInteraction
      .awaitModalSubmit({
        time: 5 * 60 * 1000,
        filter: (i) =>
          i.customId === `farm_modal_${categoryKey}` && i.user.id === interaction.user.id,
      })
      .catch(() => null);

    if (!submitted) return;

    const model = submitted.fields.getTextInputValue('model');
    const username = submitted.fields.getTextInputValue('username');
    const amount = submitted.fields.getTextInputValue('amount');
    const notes = submitted.fields.getTextInputValue('notes') || '-';

    // --- Step 5: post the result as an embed ---
    const resultEmbed = createEmbed({
      title: `New Farm Submission - ${category.label}`,
      fields: [
        { name: 'Model', value: model, inline: true },
        { name: 'Username', value: username, inline: true },
        { name: 'Amount', value: amount, inline: true },
        { name: 'Submitted By', value: `${submitted.user} (${submitted.user.tag})`, inline: false },
        { name: 'Notes', value: notes, inline: false },
      ],
      footer: `Submitted by ${submitted.user.tag}`,
      timestamp: true,
    });

    await submitted.reply({ embeds: [resultEmbed] });

    logger.info('Farm submission created', {
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      category: categoryKey,
    });
  },
};
