const config = {
  token: process.env.TOKEN,
  ownerId: [
    "411125001853468672",
    "500585213546463232",
    "1107212927536201738",
    "534661318385336321",
    "481315540733001728"
  ],
  guildBaseServerID: "1329992328550682774",
  announcementChannelID: "1329992333994758247",
  bugReportChannelID: "1331221345010188350",
  defaultPrefix: "!",
  startingBalance: 10000,
  guildFile: "./guilds.json",
  dataFile: "./players.json",
};

const discordEmotes = {
  loading: "<a:loading:1330226649169399882>",
  error: "<a:error:1331479515515457536>",
  success: "<a:success:1331856899070496819>",
};

const pages = {
    1: {
      title: "📚 Basic Commands & Tools",
      fields: [
        {
          name: "🎯 Basic Commands",
          value: [
            "`🔹 register` - Create new account",
            "`🔹 help` - Show this message",
            "`🔹 profile` - View your profile/balance",
            "`🔹 ownerinfo` - Show bot owner information",
            "`🔹 botinfo` - Show bot information",
            "`🔹 ping` - Check bot latency",
            "`🔹 sc` - Bot Source Code",
            "`🐛 bugreport` - Report a BUG!",
          ].join("\n"),
          inline: false,
        },
        {
          name: "🛠️ Tools",
          value: [
            "`🎥 ttfind <prompt>` - Search TikTok videos",
            "`📱 ttinfo <url>` - TikTok video information",
            "`⬇️ ttdown <url>` - Download TikTok video",
            "`📺 ytdown <url>` - Download YouTube videos",
            "`📸 iginfo <post url>` - Instagram info",
            "`📥 igdown <url>` - Download Instagram content",
            "`🎵 spdown <url>` - Download Spotify song",
            "`🖼️ remini` - Generate HD image",
            // "`🔍 wiki <query>` - Search Wikipedia",
            "`📝 snick <name>` - Find cool nicknames",
          ].join("\n"),
          inline: false,
        },
      ],
    },
    2: {
      title: "🎵 Music & Moderation",
      fields: [
        {
          name: "🎼 Music Commands",
          value: [
            "`🎵 play/p <song>` - Play a song",
            "`🎤 karaoke <song title>` - playing song and show synced lyrics",
            "`⬅️ leave` - Leave voice channel",
            "`📝 lyrics <song title>` - Show song lyrics",
            "`📝 syncedlyrics/sl <song title>` - Show synced lyrics",
            "`🔍 s <song>` - Search for a song",
            "`⏩ skip` - Skip song",
            "`⏯️ pause` - Pause music",
            "`🔁 loop <queue|track|off|autplay>` - looping the music",
            "`🎶 q` - Show current queue",
            "`▶️ resume` - Resume music",
            "`🔀 sf` - Shuffle current queue",
            "`🎶 np` - Now playing",
            "`🔊 volume/vol <1-100>` - Set volume",
          ].join("\n"),
          inline: false,
        },
        {
          name: "⚔️ Moderation",
          value: [
            "`🗑️ rbc` - Delete bot messages",
            "`📝 nick <@user>` - Set user nickname",
            // "`🔒 lock` - Lock the channel",
            // "`🔓 unlock` - Unlock the channel",
            "` 🗑️ purge <amount>` - Delete messages, max 100 purge",
            "`🔨 kick <@user>` - Kick a user",
            "`☢️ nuke` - Nuke the channel",
            // "`🔨 unban <@user>` - Unban a user",
            // "`🔨 warn <@user>` - Warn a user",
            // "`🔨 unmute <@user>` - Unmute a user",
            // "`🔨 clearwarn <@user>` - Clear user warnings",
            // "`🔨 mute <@user>` - Mute a user",
            // "`🔨 ban <@user>` - Ban a user",
          ].join("\n"),
          inline: false,
        },
      ],
    },
    3: {
      title: "🎮 Games & Social",
      fields: [
        {
          name: "🎲 Games",
          value: [
            "`🪙 flip <bet> <h/t>` - Coin flip (2x)",
            "`🔢 guess <bet> <1-10>` - Number guess (5x)",
            "`♠️ bj <bet>` - Blackjack (5x)",
            "`🎲 dice <bet> <2-12>` - Dice game (8x)",
            "`📅 daily` - Daily reward",
            "`🎰 slots <bet>` - Slots (10x)",
            "`🖼️ tg` - Tebak gambar",
            "`🎮 clt` - Cak lontong",
          ].join("\n"),
          inline: false,
        },
        {
          name: "👥 Social",
          value: [
            "`💝 give <@user> <amount>` - Give money",
            "`📊 rank` - Show top players",
            "`📨 invite` - Invite Nanami",
            "`👤 profile [@user]` - Show profile",
            "`🦹 rob <@user>` - Rob a user",
          ].join("\n"),
          inline: false,
        },
      ],
    },
    4: {
      title: "⚡ Owner Commands",
      fields: [
        {
          name: "🛠️ Owner Commands",
          value: [
            "`👤 registeruser <@user>` - Register a user",
            "`💰 setbalance <@user>` - Set balance",
            "`📢 ga <message>` - Guild announcement",
            "`💸 giveowner <amount>` - Give to owner",
            "`⚙️ setprefix <prefix>` - Set bot prefix",
            "`🔄 setstatus <status>` - Set status",
            "`👤 resetap` - reset all players",
            "`😎 spamsendto <@user> <amount>` - Spam DM Message to a user",
            "`😎 spamsay <amount>` - Spam Message to current",
            "`🗣️ say <message>` - Spam DM Message to a user",
            "`👤 resetplayer <@user>` - reset a players",
          ].join("\n"),
          inline: false,
        },
        {
          name: "🔒 Bot Owner Commands",
          value: [
            "`📣 announcement <msg>` - Global announcement",
            "`✅ tg jawab` - Answer tebak gambar",
            "`✅ clt jawab` - Answer tebak gambar",
          ].join("\n"),
          inline: false,
        },
      ],
    },
  };

export { config, discordEmotes, pages };