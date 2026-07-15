// =========================================================
// ADD THIS TO src/config/botConfig.js (or wherever botConfig lives)
// Paste it in as a new top-level key, e.g. right after `giveaways: {...},`
// =========================================================

  farm: {
    // Channel IDs where !farm is allowed to be used.
    // Leave empty [] to allow it in every channel.
    allowedChannels: [
      // "123456789012345678",
    ],

    // The category buttons shown when someone runs !farm.
    // key = internal id (used in customId), label/emoji = what users see.
    categories: {
      experience: { label: "Experience", emoji: "🧠" },
      tapes: { label: "Tapes", emoji: "🎞️" },
      boosts: { label: "SCB", emoji: "🚀" },
    },
  },
