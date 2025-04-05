import { SlashCommandBuilder, Routes, ChannelType } from 'discord.js';
import { config, discordEmotes } from '../config.js';
import { DiscordFormat } from './DiscordFormat.js';
import { DataManager } from './DataManager.js';
import { ApiManagement } from './ApiManagement.js';
import { VoiceManager } from './VoiceManager.js';
import { FileManagement } from './FileManagement.js';
import GuildManagement from './GuildManagement.js';
import GithubCron from './GithubCron.js';
import ShopManagement from './ShopManagement.js';
import FishingManagement from './FishingManagement.js';
import AnonChat from './AnonimManagement.js';
import { Games } from './GamesManagement.js';
import { ownerHelperFirewall, guildAdmin, formatBalance } from '../index.js';

class SlashCommands {
    constructor(client) {
        this.client = client;
        this.commands = new Map();
        this.discordFormat = new DiscordFormat();
        this.dataManager = new DataManager();
        this.apiManagement = new ApiManagement();
        this.voiceManager = new VoiceManager();
        this.fileManagement = new FileManagement();
        this.guildManagement = new GuildManagement(client);
        this.githubCron = new GithubCron(client);
        this.shopManagement = new ShopManagement(client);
        this.fishingManagement = new FishingManagement(client);
        this.anonChat = new AnonChat(client);
        // Make slashCommands point to the same Map as commands
        this.client.slashCommands = this.commands;
        
        // Define command creation methods here
        this.commandBuilders = {
            // exclusive slash command
            deleteAllRegisteredCommands: () => ({
                data: new SlashCommandBuilder()
                    .setName('delete-all-registered-commands')
                    .setDescription('Delete all registered commands'),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        this.deleteAllRegisteredCommands();
                        await interaction.reply('✅ All registered commands have been deleted.', {ephemeral: true});
                    } catch (error) {
                        console.error('Error in slash delete-all-registered-commands command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),
            deleteAllGuildRegisteredCommands: () => ({
                data: new SlashCommandBuilder()
                    .setName('delete-all-guild-commands')
                    .setDescription('Delete all registered commands for the current guild'),   
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        this.deleteAllGuildRegisteredCommands();
                        await interaction.reply('✅ All registered commands for the current guild have been deleted.', {ephemeral: true});
                    } catch (error) {
                        console.error('Error in slash delete-all-guild-registered-commands command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),
            ping: () => ({
                data: new SlashCommandBuilder()
                    .setName('ping')
                    .setDescription('Replies with pong!'),
                execute: async (interaction) => {
                    // show bot latency
                    await interaction.reply(`Pong! Latency: ${this.client.ws.ping}ms`);
                }
            }),

            // convert from message command to slash command
            setbait: () => ({
                data: new SlashCommandBuilder()
                    .setName('set-fishing-bait')
                    .setDescription('Sets the amount of bait for a user')
                    .addIntegerOption(option => 
                        option.setName('amount')
                            .setDescription('The amount of bait to set')
                            .setRequired(true)
                    )
                    .addUserOption(option => 
                        option.setName('user')
                            .setDescription('The user to set the bait for')
                            .setRequired(false)
                    ),
                execute: async (interaction) => {
                    try {
                        // Check if the user has permission to use this command
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const user = interaction.options.getUser('user') || interaction.user; // Default ke user yang menjalankan command
                        const amount = interaction.options.getInteger('amount');
                        const userId = user.id;
                        // Validasi amount harus lebih dari 0
                        if (amount <= 0) {
                            return interaction.reply({ content: 'Amount must be greater than zero.', ephemeral: true });
                        }
                
                        this.dataManager.setbait(userId, amount);
                        await interaction.reply({content:`Successfully set ${amount} bait for ${user}.`, ephemeral: true});
                    } catch (error) {
                        console.error('Error in slash setbait command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                        
                    }
                    
                }
            }),
            
            inv: () => ({
                data: new SlashCommandBuilder()
                    .setName('inventory')
                    .setDescription('Displays your inventory or another user\'s inventory'),
                execute: async (interaction) => {
                    try {
                        const user = interaction.user; // Default ke user yang menjalankan command
                        const userId = user.id;
                        await this.dataManager.getInventory(interaction, userId, user);
                    } catch (error) {
                        console.error('Error in slash inv command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            checkInv: () => ({
                data: new SlashCommandBuilder()
                    .setName('check-inventory')
                    .setDescription('Check another user\'s inventory')
                    .addUserOption(option => 
                        option.setName('user')
                            .setDescription('The user to check the inventory of')
                            .setRequired(true)
                    ),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const user = interaction.options.getUser('user');
                        const userId = user.id;
                        await this.dataManager.getInventory(interaction, userId, user);
                    } catch (error) {
                        console.error('Error in slash checkInv command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),
            
            shop: () => ({
                data: new SlashCommandBuilder()
                    .setName('shop')
                    .setDescription('Displays the shop'),
                execute: async (interaction) => {
                    try {
                        await this.shopManagement.showShopCategories(this.client, interaction);
                    } catch (error) {
                        console.error('Error in slash shop command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            resetinv: () => ({
                data: new SlashCommandBuilder()
                    .setName('reset-inventory')
                    .setDescription('Resets your or other user\'s inventory')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('The user to reset the inventory of')
                            .setRequired(false)
                    ),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const user = interaction.options.getUser('user') || interaction.user; // Default ke user yang menjalankan command
                        const userId = user.id;
                        const status = this.dataManager.resetInventory(userId);
                        if(!status) return interaction.reply({content:`${discordEmotes.error} User not found! please register them first.`, ephemeral: true });

                        await interaction.reply({content:`${discordEmotes.success} Successfully reset inventory for ${user}.`, ephemeral: true});
                    } catch (error) {
                        console.error('Error in slash reset-inventory command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            fishing: () => ({
                data: new SlashCommandBuilder()
                    .setName('fishing')
                    .setDescription('Go fishing!'),
                execute: async (interaction) => {
                    try {
                        await this.fishingManagement.startFishing(interaction);
                    } catch (error) {
                        console.error('Error in slash fish command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),
            warninfo: () => ({
                data: new SlashCommandBuilder()
                    .setName('warn-info')
                    .setDescription('Get information about the warning of an user')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('The user to get warning information for')
                            .setRequired(true)
                    ),
                execute: async (interaction) => {
                    try {
                         if(!guildAdmin(interaction)) return;
                            const guildId = interaction.guild.id;
                            const user = interaction.options.getUser('user');
                            await this.discordFormat.warnInfo(guildId, user, interaction);
                    } catch (error) {
                        console.error('Error in slash warninfo command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            warn: () => ({
                data: new SlashCommandBuilder()
                    .setName('warn')
                    .setDescription('Warn a user')
                    .addUserOption(option =>
                        option.setName('user')
                            .setDescription('The user to warn')
                            .setRequired(true)
                    )
                    .addStringOption(option => 
                        option.setName('reason')
                            .setDescription('The reason for the warning')
                            .setRequired(true)
                    ),
                execute: async (interaction) => {
                    try {
                        if(!guildAdmin(interaction)) return;
                        const guildId = interaction.guild.id;
                        const user = interaction.options.getUser('user');
                        const reason = interaction.options.getString('reason');
                        await this.discordFormat.warnUser(guildId, user, reason, interaction);
                    } catch (error) {
                        console.error('Error in slash warn command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            setwelcome: () => ({
                data: new SlashCommandBuilder()
                .setName('set-welcome')
                .setDescription('Set the welcome channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to set as welcome channel')
                        .addChannelTypes(0) // 0 = GUILD_TEXT
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The message to send in the welcome channel')
                        .setRequired(false)
                ),
                execute: async (interaction) => {
                    try {
                        if(!guildAdmin(interaction)) return;
                        const guildId = interaction.guild.id;
                        const channel = interaction.options.getChannel('channel');
                        const welcomeMessage = interaction.options.getString('message');
                        await this.discordFormat.setWelcome(guildId, channel.id,welcomeMessage, interaction);
                    } catch (error) {
                        console.error('Error in slash setwelcome command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            volume: () => ({
                data: new SlashCommandBuilder()
                .setName('volume')
                .setDescription('Set the volume of the music player')
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('The volume level (0-100)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(100)
                ),
                execute: async (interaction) => {
                    try {
                        const level = interaction.options.getInteger('level');
                        await this.voiceManager.setVolume(interaction, level);
                    } catch (error) {
                        console.error('Error in slash volume command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            lyrics : () => ({
                data: new SlashCommandBuilder()
                .setName('lyrics')
                .setDescription('Show the lyrics of a song')
                .addStringOption(option =>
                    option.setName('song')
                        .setDescription('The song to get lyrics for')
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const song = interaction.options.getString('song');
                        await this.voiceManager.getLyrics(interaction, song);
                    } catch (error) {
                        console.error('Error in slash lyrics command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            loop: () => ({
                data: new SlashCommandBuilder()
                .setName('loop')
                .setDescription('Toggle loop mode for the current song')
                .addStringOption(option =>
                    option.setName('mode')
                        .setDescription('Choose loop mode')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Off', value: 'off' },
                            { name: 'Track', value: 'track' },
                            { name: 'Queue', value: 'queue' },
                            { name: 'Autoplay', value: 'autoplay' }
                        )
                ),
                execute: async (interaction) => {
                    try {
                        const mode = interaction.options.getString('mode');
                        await this.voiceManager.loopMusic(interaction, mode);
                    } catch (error) {
                        console.error('Error in slash loop command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            queue: () => ({
                data: new SlashCommandBuilder()
                .setName('queue')
                .setDescription('Show the current music queue'),
                execute: async (interaction) => {
                    try {
                        await this.voiceManager.queueMusic(interaction);
                    } catch (error) {
                        console.error('Error in slash queue command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            karaoke: () => ({
                data: new SlashCommandBuilder()
                .setName('karaoke')
                .setDescription('Play a song with synced lyrics')
                .addStringOption(option =>
                    option.setName('song')
                        .setDescription('The song to play')
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const song = interaction.options.getString('song');
                        await this.voiceManager.karaokeMusic(interaction, song);
                    } catch (error) {
                        console.error('Error in slash karaoke command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            skip: () => ({
                data: new SlashCommandBuilder()
                .setName('skip')
                .setDescription('Skip the current song'),
                execute: async (interaction) => {
                    try {
                        await this.voiceManager.skipMusic(interaction);
                    } catch (error) {
                        console.error('Error in slash skip command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            pause: () => ({
                data: new SlashCommandBuilder()
                .setName('pause')
                .setDescription('Pause the current song'),
                execute: async (interaction) => {
                    try {
                        await this.voiceManager.pauseMusic(interaction);
                    } catch (error) {
                        console.error('Error in slash pause command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            resume: () => ({
                data: new SlashCommandBuilder() 
                .setName('resume')
                .setDescription('Resume the current song'),
                execute: async (interaction) => {
                    try {
                        await this.voiceManager.pauseMusic(interaction);
                    } catch (error) {
                        console.error('Error in slash resume command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            nowPlaying: () => ({
                data: new SlashCommandBuilder()
                .setName('now-playing')
                .setDescription('Show the currently playing song'),
                execute: async (interaction) => {
                    try {
                        await this.voiceManager.nowPlaying(interaction);
                    } catch (error) {
                        console.error('Error in slash nowplaying command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            syncedLyrics: () => ({
                data: new SlashCommandBuilder()
                .setName('synced-lyrics')
                .setDescription('Show synchronized lyrics of a song with the current timestamp of the playing track.')
                .addStringOption(option =>
                    option.setName('song')
                        .setDescription('The song to get synchronized lyrics for')
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const song = interaction.options.getString('song');
                        await this.voiceManager.getSyncedLyrics(interaction, song);
                    } catch (error) {
                        console.error('Error in slash synced-lyrics command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            shuffleMusic: () => ({
                data: new SlashCommandBuilder()
                .setName('shuffle')
                .setDescription('Shuffle the current music queue'),
                execute: async (interaction) => {
                    try {
                        await this.voiceManager.shuffleMusic(interaction);
                    } catch (error) {
                        console.error('Error in slash shuffle command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            play: () => ({
                data: new SlashCommandBuilder()
                .setName('play')
                .setDescription('Play a song')
                .addStringOption(option => 
                    option.setName('song')
                        .setDescription('The song to play')
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {  
                        const song = interaction.options.getString('song');
                        await this.voiceManager.playMusic(interaction, song);
                    } catch (error) {
                        console.error('Error in slash play command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),
            leave: () => ({
                data: new SlashCommandBuilder()
                .setName('leave')
                .setDescription('Leave the voice channel'),
                execute: async (interaction) => {
                    try {
                        await this.voiceManager.leaveVoice(interaction);
                    } catch (error) {
                        console.error('Error in slash leave command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            guildAnnouncement: () => ({
                data: new SlashCommandBuilder()
                .setName('guild-announcement')
                .setDescription('Set the guild announcement channel')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The message to announce')
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        if(interaction.user.id !== config.ownerId[0]) return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                        const message = interaction.options.getString('message');
                        await this.discordFormat.guildAnnouncement(interaction, message);
                    } catch (error) {
                        console.error('Error in slash guild-announcement command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),
                
            remini: () => ({
                data: new SlashCommandBuilder()
                .setName('remini')
                .setDescription('Generate HD image from a photo')
                .addAttachmentOption(option =>
                    option.setName('image')
                        .setDescription('The image to enhance')
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const image = interaction.options.getAttachment('image');
                        if (image.size > 2 * 1024 * 1024) {  // 2MB = 2 * 1024 * 1024 bytes
                            return interaction.reply({
                                content: '❌ The uploaded image is too large! Maximum allowed size is 2MB.',
                                ephemeral: true
                            });
                        }
                        await this.apiManagement.remini(interaction, image.url);
                    } catch (error) {
                        console.error('Error in slash remini command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            snick: () => ({
                data: new SlashCommandBuilder()
                .setName("special-nickname-maker")
                .setDescription("Create a special nickname with unique font styles")
                .addStringOption(option =>
                    option.setName("nickname")
                        .setDescription("The nickname to create")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const nickname = interaction.options.getString("nickname");
                        await this.apiManagement.stylizeText(interaction, nickname);
                    } catch (error) {
                        console.error('Error in slash snick command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            bugreport: () => ({
                data: new SlashCommandBuilder() 
                .setName("bug-report")
                .setDescription("Report a bug")
                .addStringOption(option =>
                    option.setName("description")
                        .setDescription("The description of the bug")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const description = interaction.options.getString("description") || "No description provided";
                        if(interaction.user.id === config.ownerId[0]) return this.discordFormat.bugReport(interaction, description);
                        // Set cooldown 1 hour
                            const cooldown = 60 * 60 * 1000;
                            const userData = this.dataManager.users[interaction.user.id] || {};
                            const lastUsed = userData.lastBugReport;
                          
                            if (lastUsed && Date.now() - lastUsed < cooldown) {
                              const timeRemaining = cooldown - (Date.now() - lastUsed);
                              return interaction.reply(
                                `Please wait ${formatClockHHMMSS(timeRemaining)} before using this command again.`, {ephemeral: true}
                              );
                            }
                          
                            // Update user data
                            if (!this.dataManager.users[interaction.user.id]) {
                              this.dataManager.users[interaction.user.id] = {};
                            }
                            this.dataManager.users[interaction.user.id].lastBugReport = Date.now();
                        await this.discordFormat.bugReport(interaction, description);
                    } catch (error) {
                        console.error('Error in slash bugreport command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            clearwarns: () => ({
                data: new SlashCommandBuilder()
                .setName('clear-warns')
                .setDescription('Clear all warnings for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to clear warnings for')  
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        if(!guildAdmin(interaction)) return;
                        const guildId = interaction.guild.id;
                        const user = interaction.options.getUser('user');
                        await this.discordFormat.clearWarns(guildId, user, interaction);
                    } catch (error) {
                        console.error('Error in slash clearwarns command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),
            
            spotifyDownload: () => ({
                data: new SlashCommandBuilder()
                .setName('spotify-download')
                .setDescription('Download a song from Spotify')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('The Spotify URL of the song')
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const url = interaction.options.getString('url');
                        await this.apiManagement.spotifyDownload(interaction, url);
                    } catch (error) {
                        console.error('Error in slash spotify-download command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            instagramDownload: ()=> ({
                data: new SlashCommandBuilder()
                .setName("instagram-download")
                .setDescription("Download a post from Instagram")
                .addStringOption(option =>
                    option.setName("url")
                        .setDescription("The Instagram URL of the post")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const url = interaction.options.getString("url");
                        await this.apiManagement.instagramDownload(interaction, url);
                    } catch (error) {
                        console.error('Error in slash instagram-download command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            instagramInfo: () => ({
                data: new SlashCommandBuilder()
                .setName("iginfo")
                .setDescription("Get information about an Instagram post")
                .addStringOption(option =>
                    option.setName("url")
                        .setDescription("The Instagram URL of the post")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const url = interaction.options.getString("url");
                        await this.apiManagement.instagramInfo(interaction, url);
                    } catch (error) {
                        console.error('Error in slash instagram-info command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            tiktokInfo: ()=> ({
                data: new SlashCommandBuilder()
                .setName("tiktok-info")
                .setDescription("Get information about a TikTok video")
                .addStringOption(option =>
                    option.setName("url")
                        .setDescription("The TikTok URL of the video")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const url = interaction.options.getString("url");
                        await this.apiManagement.tiktokInfo(interaction, url);
                    } catch (error) {
                        console.error('Error in slash tiktok-info command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            tiktokDownload: () => ({
                data: new SlashCommandBuilder()
                .setName("tiktok-download")
                .setDescription("Download a TikTok video")
                .addStringOption(option =>
                    option.setName("url")
                        .setDescription("The TikTok URL of the video")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const url = interaction.options.getString("url");
                        await this.apiManagement.tiktokDownload(interaction, url);
                    } catch (error) {
                        console.error('Error in slash tiktok-download command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            youtubeDownload: () => ({
                data: new SlashCommandBuilder()
                .setName("yt-download")
                .setDescription("Download a video from YouTube")
                .addStringOption(option =>
                    option.setName("url")
                        .setDescription("The YouTube URL of the video")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const url = interaction.options.getString("url");
                        await this.apiManagement.youtubeDownload(interaction, url);
                    } catch (error) {
                        console.error('Error in slash yt-download command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            tiktokFind: () => ({
                data: new SlashCommandBuilder()
                .setName("tiktok-find")
                .setDescription("Search for a TikTok video")
                .addStringOption(option =>
                    option.setName("query")
                        .setDescription("The search query")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        const query = interaction.options.getString("query");
                        await this.apiManagement.tiktokSearch(interaction, query);
                    } catch (error) {
                        console.error('Error in slash tiktok-find command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            setBalance: () => ({
                data: new SlashCommandBuilder()
                .setName("set-balance")
                .setDescription("Set the balance of a user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to set the balance for")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("The amount to set the balance to")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const user = interaction.options.getUser("user");
                        const amount = interaction.options.getInteger("amount");
                        this.dataManager.setBalance(user, amount);
                        await interaction.reply({content:`${discordEmotes.success} ${user}'s balance has been set to ${formatBalance(amount)}.`, ephemeral: true});
                    } catch (error) {
                        console.error('Error in slash setbalance command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }    
                }
            }),

            resetAllPlayer: () => ({
                data: new SlashCommandBuilder()
                .setName("reset-all-player") 
                .setDescription("Reset all player data"),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        this.dataManager.resetAllPlayer();
                        await interaction.reply({content:`${discordEmotes.success} Successfully reset all player data.`, ephemeral: true});
                    } catch (error) {
                        console.error('Error in slash reset-all-player command:', error);
                        return interaction.reply({ content: `${discordEmotes.error} An error occurred while executing the command.`, ephemeral: true });
                    }
                }
            }),

            registerUser: () => ({
                data: new SlashCommandBuilder()
                .setName("register-user")
                .setDescription("Register a new user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to register")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const user = interaction.options.getUser("user");
                        this.dataManager.createUser(user.id);
                        await interaction.reply({content:`${discordEmotes.success} Welcome ${user}! Your balance start with ${formatBalance(config.startingBalance)}.`, ephemeral: true});
                    } catch (error) {
                        console.error('Error in slash register-user command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            giveawayAll: () => ({
                data: new SlashCommandBuilder()
                .setName("giveaway-all")
                .setDescription("Start a giveaway for all users")
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("The amount to giveaway")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const amount = interaction.options.getInteger("amount");
                        await this.dataManager.giveawayAll(amount,interaction);
                    } catch (error) {
                        console.error('Error in slash giveaway-all command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            register: () => ({
                data: new SlashCommandBuilder()
                .setName("register")
                .setDescription("Register yout discord account"),
                execute: async (interaction) => {
                    try {
                        await this.dataManager.createUser(interaction.user.id);
                        await interaction.reply({content:`${discordEmotes.success} Welcome ${interaction.user}! Your balance start with ${formatBalance(interaction.user.balance)}.`, ephemeral: true});
                    } catch (error) {
                        console.error('Error in slash register command:', error);
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            resetAllBalance: () => ({
                data: new SlashCommandBuilder()
                .setName("reset-all-balance")
                .setDescription("Reset all current registered player's balance"),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        return this.dataManager.resetAllBalance(interaction);
                    } catch (error) {
                        console.error('Error in slash reset-all-balance command:', error);    
                        return interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }    
                }
            }),

            kick: () => ({
                data: new SlashCommandBuilder()
                .setName("kick")
                .setDescription("Kick a user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to kick")
                        .setRequired(true)
                ).addStringOption(option =>
                    option.setName("reason")
                        .setDescription("The reason for the kick")
                ),
                execute: async (interaction) => {
                    try {
                        if(!guildAdmin(interaction)) return;
                        const user = interaction.options.getUser("user");
                        const reason = interaction.options.getString("reason") || "No reason provided";
                        return await this.discordFormat.kickUser(interaction,user, reason);
                    } catch (error) {
                        console.error('Error in slash kick command:', error);
                }}
            }),

            purge: () => ({
                data: new SlashCommandBuilder()
                .setName("purge")
                .setDescription("Purge messages")
                .addIntegerOption(option =>
                    option.setName("amount")
                        .setDescription("The amount of messages to purge")
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100)
                ),
                execute: async (interaction) => {
                    try {
                        if(!guildAdmin(interaction)) return;
                        const amount = interaction.options.getInteger("amount");
                        return await this.discordFormat.deleteMessages(interaction, amount);
                    } catch (error) {
                        console.error('Error in slash purge command:', error);
                        return await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                }}
            }),

            removeBotChats: () => ({
                data: new SlashCommandBuilder()
                .setName("remove-bot-chats")
                .setDescription("Remove all bot chats"),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        return await this.discordFormat.removeBotChats(interaction);
                    } catch (error) {
                        console.error('Error in slash remove-bot-chats command:', error);
                        return await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                }
            }
            }),

            profile: () => ({
                data: new SlashCommandBuilder()
                .setName("profile")
                .setDescription("Get your profile")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to get the profile of")
                ),
                execute: async (interaction) => {
                    try {
                        const user = interaction.options.getUser("user") ?? interaction.user;
                        const userId = user.id;
                        return await this.dataManager.userProfile(userId, interaction, this.client);
                    } catch (error) {
                        console.error('Error in slash profile command:', error);
                        return await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                }
               }
            }),

            setOtherNick:  () => ({
                data: new SlashCommandBuilder()
                .setName("set-nick")
                .setDescription("Set the nickname for another user")
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user to set the nickname of")
                        .setRequired(true)
                ).addStringOption(option =>
                    option.setName("nick")
                        .setDescription("The nickname to set")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        if(!guildAdmin(interaction)) return;
                        const user = interaction.options.getUser("user");
                        const nick = interaction.options.getString("nick");
                        return await this.discordFormat.setNickname(interaction, user, nick);
                    } catch (error) {
                        console.error('Error in slash set-other-nick command:', error);
                        return await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                    }
                }
            }),

            inviteBot: () => ({
                data: new SlashCommandBuilder()
                .setName("invite")
                .setDescription("Invite nanami to your server"),
                execute: async (interaction) => {
                    try {
                        return await this.discordFormat.inviteBot(interaction);
                    } catch (error) {
                        console.error('Error in slash invite command:', error);
                        return await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                }
            }
            }),

            setBotStatus: () => ({
                data: new SlashCommandBuilder()
                .setName("set-status")
                .setDescription("Set the status of nanami")
                .addStringOption(option =>
                    option.setName("mode")
                        .setDescription("The mode to set the status in")
                        .setRequired(true)
                        .addChoices(
                            { name: "Online", value: "online" },
                            { name: "Idle", value: "idle" },
                            { name: "Do Not Disturb", value: "dnd" },
                            { name: "Invisible", value: "invisible" },
                        )
                )
                .addStringOption(option =>
                    option.setName("type")
                        .setDescription("The type of status to set")
                        .setRequired(true)
                        .addChoices(
                            { name: "Playing", value: "playing" },
                            { name: "Streaming", value: "streaming" },
                            { name: "Listening", value: "listening" },
                            { name: "Watching", value: "watching" },
                        )
                )
                .addStringOption(option =>
                    option.setName("status")
                        .setDescription("The status to set")
                        .setRequired(true)
                ),    
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const mode = interaction.options.getString("mode");
                        const type = interaction.options.getString("type");
                        const status = interaction.options.getString("status");
                        return await this.discordFormat.setBotStatus(this.client, mode, type, status, interaction);
                    } catch (error) {
                        console.error('Error in slash set-bot-status command:', error);
                        return await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                }
            }
            }),
            
            setBotPrefix: () => ({
                data: new SlashCommandBuilder()
                .setName("set-prefix")
                .setDescription("Set the prefix for nanami")
                .addStringOption(option =>
                    option.setName("prefix")
                        .setDescription("The prefix to set")
                        .setRequired(true)
                ),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const prefix = interaction.options.getString("prefix");
                        config.defaultPrefix(prefix);
                        return await interaction.reply({ content: `Prefix set to ${prefix}`, ephemeral: true });
                    } catch (error) {
                        console.error('Error in slash set-bot-prefix command:', error);
                        return await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                }
            }
            }),

            joinAnonim: () => ({
                data: new SlashCommandBuilder()
                .setName("join-anonim")
                .setDescription("Join the anonymous chat"),
                execute: async (interaction) => {
                    try {
                        await this.anonChat.joinSession(interaction);
                        return await interaction.reply({ content: 'You have joined the anonymous chat.', ephemeral: true });
                    } catch (error) {
                        console.error('Error in slash join-anonim command:', error);
                        return await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                }
            }
            }),

            leaveAnonim: () => ({
                data: new SlashCommandBuilder()
                .setName("leave-anonim")
                .setDescription("Leave the anonymous chat"),
                execute: async (interaction) => {
                    try {
                        await this.anonChat.leaveSession(interaction);
                        return await interaction.reply({ content: 'You have left the anonymous chat.', ephemeral: true });
                    } catch (error) {
                        console.error('Error in slash leave-anonim command:', error);
                        return await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
                }
            }
            }),

            spamSendTo: () => ({
                data: new SlashCommandBuilder()
                    .setName("spam-send-to")
                    .setDescription("Spam a message to a user's DM or channel")   
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName("user")
                            .setDescription("Send spam messages to a user")
                            .addUserOption(option =>
                                option.setName("target")
                                    .setDescription("The user to send messages to")
                                    .setRequired(true)
                            )
                            .addIntegerOption(option =>
                                option.setName("amount")
                                    .setDescription("The amount of times to send the message")
                                    .setRequired(true)
                                    .setMinValue(1)
                                    .setMaxValue(100)
                            )
                            .addStringOption(option =>
                                option.setName("message")
                                    .setDescription("The message to send")
                                    .setRequired(true)
                            )
                    )
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName("channel")
                            .setDescription("Send spam messages to a channel")
                            .addChannelOption(option =>
                                option.setName("target")
                                    .setDescription("The channel to send messages to")
                                    .setRequired(true)
                                    .addChannelTypes(ChannelType.GuildText) // Only allow text channels
                            )
                            .addIntegerOption(option =>
                                option.setName("amount")
                                    .setDescription("The amount of times to send the message")
                                    .setRequired(true)
                                    .setMinValue(1)
                                    .setMaxValue(100)
                            )
                            .addStringOption(option =>
                                option.setName("message")
                                    .setDescription("The message to send")
                                    .setRequired(true)
                            )
                    ),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        
                        const subcommand = interaction.options.getSubcommand();
                        let target;
                        
                        if (subcommand === "user") {
                            target = interaction.options.getUser("target");
                        } else if (subcommand === "channel") {
                            target = interaction.options.getChannel("target");
                        }
                        
                        const message = interaction.options.getString("message");
                        const amount = interaction.options.getInteger("amount");
                        
                        // First, acknowledge the interaction to prevent timeout
                        await interaction.deferReply({ ephemeral: true });
                        
                        // Call the spamSendTo function
                        await this.discordFormat.spamSendTo(target, message, amount, interaction);
                        
                        // Follow up after spam is complete
                        return await interaction.followUp({ 
                            content: `Command executed successfully!`, 
                            ephemeral: true 
                        });
                    } catch (error) {
                        console.error('Error in slash spam-send-to command:', error);
                        
                        // If interaction hasn't been replied to yet
                        if (!interaction.replied && !interaction.deferred) {
                            return await interaction.reply({ 
                                content: 'An error occurred while executing the command.', 
                                ephemeral: true 
                            });
                        } else {
                            return await interaction.followUp({ 
                                content: 'An error occurred while executing the command.', 
                                ephemeral: true 
                            });
                        }
                    }
                } 
            }),

            spamSay: () => ({
                data: new SlashCommandBuilder()
                  .setName("spam-say")
                  .setDescription("Spam a message to the current channel")
                  .addIntegerOption(option =>
                    option.setName("amount")
                      .setDescription("The amount of times to send the message (max 50)")
                      .setRequired(true)
                      .setMinValue(1)
                      .setMaxValue(50) // Reduced maximum to be safer with rate limits
                  )
                  .addStringOption(option =>
                    option.setName("message")
                      .setDescription("The message to send")
                      .setRequired(true)
                  ),
                execute: async (interaction) => {
                  try {
                    if (!ownerHelperFirewall(interaction.user.id, interaction)) return;
                    
                    const message = interaction.options.getString("message");
                    const amount = interaction.options.getInteger("amount");
                    
                    // Defer the reply to prevent timeout
                    await interaction.deferReply({ ephemeral: true });
                    
                    // Call the spamSay function
                    await this.discordFormat.spamSay(interaction, message, amount);
                    
                    // This will be handled inside the spamSay function using followUp
                  } catch (error) {
                    console.error('Error in slash spam-say command:', error);
                    
                    if (!interaction.replied && !interaction.deferred) {
                      return await interaction.reply({ 
                        content: 'An error occurred while executing the command.', 
                        ephemeral: true 
                      });
                    } else {
                      return await interaction.followUp({ 
                        content: 'An error occurred while executing the command.', 
                        ephemeral: true 
                      });
                    }
                  }
                }
              }),

            help: () => ({
                data: new SlashCommandBuilder()
                .setName("help")
                .setDescription("Show help menu"),
                execute: async (interaction) => {
                    try {
                        return this.discordFormat.nanamiHelpMenu(interaction);
                    } catch (error) {
                        console.error('Error in slash help command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                }
            }
            }),

            rob: () => ({
                data: new SlashCommandBuilder()
                .setName("rob")
                .setDescription("Rob a user")
                .addUserOption(option =>
                    option.setName("user")
                      .setDescription("The user to rob")
                      .setRequired(true)
                  ),
                execute: async (interaction) => {
                    try {
                        const user = interaction.options.getUser("user");
                        return this.dataManager.robUser(interaction.user.id, user, interaction);
                    } catch (error) {
                        console.error('Error in slash rob command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                }
            }
            }),

            botInfo: () => ({
                data: new SlashCommandBuilder()
                .setName("botinfo")
                .setDescription("Show bot information"),
                execute: async (interaction) => {
                    try {
                        return this.discordFormat.nanamiBotInfo(this.client,interaction);
                    } catch (error) {
                        console.error('Error in slash botinfo command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                }   
                }
            }),

            hostingInfo: () => ({
                data: new SlashCommandBuilder()
                .setName("hosting-info")
                .setDescription("Show VPS information"),
                execute: async (interaction) => {
                    try {
                        return this.discordFormat.nanamiHostingInfo(this.client, interaction);
                    } catch (error) {
                        console.error('Error in slash hosting-info command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                }   
                }
            }),

            ownerInfo: () => ({
                data: new SlashCommandBuilder()
                .setName("owner-info")
                .setDescription("Show bot owner information"),
                execute: async (interaction) => {
                    try {
                        return this.discordFormat.nanamiOwnerInfo(this.client, interaction);
                    } catch (error) {
                        console.error('Error in slash ownerinfo command:', error);
                        await interaction.reply({
                    
                })}}
            }),

            rank: () => ({
                data: new SlashCommandBuilder()
                .setName("rank")
                .setDescription("Show top 10 player's balance"),
                execute: async (interaction) => {
                    try {
                        return this.dataManager.showLeaderBoard(interaction);
                    } catch (error) {
                        console.error('Error in slash rank command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                }}
            }),

            giveOwner: () => ({
                data: new SlashCommandBuilder()
                .setName("give-owner")
                .setDescription("Give bot owner money")
                .addIntegerOption(option =>
                    option.setName("amount")
                      .setDescription("The amount of money to give (max 1000000000000000)")
                      .setRequired(true)
                      .setMinValue(1)
                      .setMaxValue(1000000000000000)
                  ),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const amount = interaction.options.getInteger("amount");
                        return this.dataManager.giveOwnerMoney(interaction.user.id, amount);
                    } catch (error) {
                        console.error('Error in slash give-owner command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                    }
                }
            }),

            give: () => ({
                data: new SlashCommandBuilder()
                .setName("give")
                .setDescription("Give money to a user")
                .addUserOption(option =>
                    option.setName("user")
                      .setDescription("The user to give money to")
                      .setRequired(true)
                  )
                .addIntegerOption(option =>
                    option.setName("amount")
                      .setDescription("The amount of money to give (max 1000000000000000)")
                      .setRequired(true)
                      .setMinValue(1)
                      .setMaxValue(1000000000000000)
                  ),
                execute: async (interaction) => {
                    try {
                        const user = interaction.options.getUser("user");
                        const amount = interaction.options.getInteger("amount");
                        return this.dataManager.giveMoney(interaction.user, user, amount, interaction);
                    } catch (error) {
                        console.error('Error in slash give command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                    }}
            }),

            announcement: () => ({
                data: new SlashCommandBuilder()
                .setName("announcement")
                .setDescription("Send an announcement")
                .addStringOption(option =>
                    option.setName("message")
                      .setDescription("The message to send")
                      .setRequired(true)
                  ),
                execute: async (interaction) => {
                    try {
                        if(interaction.user.id !== config.ownerId[0]) return
                        const message = interaction.options.getString("message");
                        return this.discordFormat.globalAnnouncement(interaction, message);
                    } catch (error) {
                        console.error('Error in slash announcement command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                    }
                }
            }),
            
            nukeChannel: () => ({
                data: new SlashCommandBuilder()
                .setName("nuke-channel")
                .setDescription("delete and recreate the channel with the same properties"),
                execute: async (interaction) => {
                    try {
                        if(!guildAdmin(interaction)) return;
                        return this.discordFormat.nukeChannel(interaction);
                    } catch (error) {
                        console.error('Error in slash nuke-channel command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                    }
                }
            }),

            takeMoney: () => ({
                data: new SlashCommandBuilder()
                .setName("take-money")
                .setDescription("Take money from a user")
                .addUserOption(option =>
                    option.setName("user")
                      .setDescription("The user to take money from")
                      .setRequired(true)
                  )
                .addIntegerOption(option =>
                    option.setName("amount")
                      .setDescription("The amount of money to take")
                      .setRequired(true)
                      .setMinValue(1)
                  ),    
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const user = interaction.options.getUser("user");
                        const amount = interaction.options.getInteger("amount");
                        return await this.dataManager.takeMoney(interaction.user, user, amount, interaction);
                    } catch (error) {
                        console.error('Error in slash take-money command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                    }
                }
            }),

            say: () => ({
                data: new SlashCommandBuilder()
                .setName("say")
                .setDescription("Make the bot say something")
                .addStringOption(option =>
                    option.setName("message")
                      .setDescription("The message to say")
                      .setRequired(true)
                  ),
                execute: async (interaction) => {
                    try {
                        if(!ownerHelperFirewall(interaction.user.id, interaction)) return;
                        const message = interaction.options.getString("message");
                        await interaction.reply({
                            content: `${discordEmotes.success} Executed`,
                            ephemeral: true
                        });
                        return await interaction.channel.send(message);
                    } catch (error) {
                        console.error('Error in slash say command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                }
                }    
            }),

            lock: () => ({
                data: new SlashCommandBuilder()
                .setName("lock-channel")
                .setDescription("Lock the channel"),
                execute: async (interaction) => {
                    try {
                        if(!guildAdmin(interaction)) return;
                        await interaction.reply({
                            content: `${discordEmotes.success} Executed`,
                            ephemeral: true
                        })
                        return this.discordFormat.lockChannel(interaction);
                    } catch (error) {
                        console.error('Error in slash lock command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                    
                }
            }
            }),

            unlock: () => ({
                data: new SlashCommandBuilder()
                .setName("unlock-channel")
                .setDescription("Unlock the channel"),
                execute: async (interaction) => {
                    try {
                        if(!guildAdmin(interaction)) return;
                        await interaction.reply({
                            content: `${discordEmotes.success} Executed`,
                            ephemeral: true
                        })
                        return this.discordFormat.unlockChannel(interaction);
                    } catch (error) {
                        console.error('Error in slash unlock command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                    
                }
            }
        
            }),

            setupGuild: () => ({
                data: new SlashCommandBuilder()
                .setName("setup-guild")
                .setDescription("Setup the guild")
                .addStringOption(option =>
                    option.setName("name")
                      .setDescription("The name of the server")
                      .setRequired(true)
                  ),
                execute: async (interaction) => {
                    try {
                        if(interaction.user.id !== config.ownerId[0]) return;
                        const guildName = interaction.options.getString("name");
                        await interaction.reply({
                            content: `${discordEmotes.success} Executed`,
                            ephemeral: true
                        })
                        return this.discordFormat.setupGuild(interaction, guildName);
                    } catch (error) {
                        console.error('Error in slash setup-guild command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                    
                }
            }
            }),

            setupBusinessGuild: ()=> ({
                data: new SlashCommandBuilder()
                .setName("setup-business-guild")
                .setDescription("Setup the business guild")
                .addStringOption(option =>
                    option.setName("name")
                      .setDescription("The name of the server")
                      .setRequired(true)
                  ),
                execute: async (interaction) => {
                    try {
                        if(interaction.user.id !== config.ownerId[0]) return;
                        const guildName = interaction.options.getString("name") ?? "Business Guild";
                        await interaction.reply({
                            content: `${discordEmotes.success} Executed`,
                            ephemeral: true
                        })
                        return this.discordFormat.setupBusinessGuild(interaction, guildName);
                    } catch (error) {
                        console.error('Error in slash setup-business-guild command:', error);
                        await interaction.reply({
                            content: `${discordEmotes.error} An error occurred while executing the command.`,
                            ephemeral: true
                        })
                }}
            }),

            removeBackground: () => ({
                data: new SlashCommandBuilder()
                .setName("removebg")
                .setDescription("Remove the background of an image")
                .addAttachmentOption(option =>
                    option.setName("image")
                      .setDescription("The image to remove the background from")
                      .setRequired(true)
                  ),
                  execute: async (interaction) => {
                    try {
                      const attachment = interaction.options.getAttachment("image");
                  
                      // Validasi ukuran maksimal 2MB
                      if (attachment.size > 2 * 1024 * 1024) {
                        return await interaction.reply({
                          content: `${discordEmotes.error} Ukuran gambar terlalu besar! Maksimal 2MB ya.`,
                          ephemeral: true,
                        });
                      }
                  
                      // Validasi tipe file
                      const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
                      if (!allowedTypes.includes(attachment.contentType)) {
                        return await interaction.reply({
                          content: `${discordEmotes.error} Hanya format PNG, JPG, atau WEBP yang didukung.`,
                          ephemeral: true,
                        });
                      }
                  
                      const image = attachment.url;
                      return this.apiManagement.removeBackground(interaction, image);
                  
                    } catch (error) {
                      console.error("Error in slash removebg command:", error);
                      await interaction.reply({
                        content: `${discordEmotes.error} Terjadi kesalahan saat menjalankan perintah.`,
                        ephemeral: true,
                      });
                    }
                  }
                  
            }),
            blackjack: () => ({
                data: new SlashCommandBuilder()
                .setName("games-blackjack")
                .setDescription("Play a game of blackjack")
                .addStringOption(option =>
                    option.setName("bet")
                      .setDescription("Type 'all' or enter a number to bet")
                      .setRequired(true)
                  ),
                execute: async (interaction) => {
                    try {
                        const bet = interaction.options.getString("bet");
                        return Games.blackjack(interaction, bet);
                    } catch (error) {
                        console.error('Error in slash blackjack command:', error);
                }
            }
            }),

            slots: () => ({
                data: new SlashCommandBuilder()
                .setName("games-slots")
                .setDescription("Play a game of slots")
                .addStringOption(option =>
                    option.setName("bet")
                      .setDescription("Type 'all' or enter a number to bet")
                      .setRequired(true)
                  ),
                execute: async (interaction) => {
                    try {
                        const bet = interaction.options.getString("bet");
                        return Games.slots(interaction, bet);
                    } catch (error) {
                        console.error('Error in slash slots command:', error);
                }
            }
            }),

            flipCoin: () => ({
                data: new SlashCommandBuilder()
                .setName("games-flipcoin")
                .setDescription("Flip a coin")
                .addStringOption(option =>
                    option.setName("bet")
                      .setDescription("Type 'all' or enter a number to bet")
                      .setRequired(true)
                  )
                  .addStringOption(option =>
                    option.setName("guess")
                      .setDescription("Type 'h' for head or 't' for tail")
                      .setRequired(true)
                  ),
                execute: async (interaction) => {
                    try {
                        const guess = interaction.options.getString("guess");
                        const bet = interaction.options.getString("bet");
                        return Games.coinFlip(interaction, bet, guess);
                    } catch (error) {
                        console.error('Error in slash flipcoin command:', error);
                }
            }
            }),

            guessNumber: () => ({
                data: new SlashCommandBuilder()
                .setName("games-guessnumber")
                .setDescription("Guess a number")
                .addStringOption(option =>
                    option.setName("bet")
                      .setDescription("Type 'all' or enter a number to bet")
                      .setRequired(true)
                  )
                  .addIntegerOption(option =>
                    option.setName("guess")
                      .setDescription("Enter a number to guess")
                      .setRequired(true)
                      .setMinValue(1)
                      .setMaxValue(10)
                  ),
                execute: async (interaction) => {
                    try {
                        const guess = interaction.options.getInteger("guess");
                        const bet = interaction.options.getString("bet");
                        return Games.numberGuess(interaction, bet, guess);
                    } catch (error) {
                        console.error('Error in slash guessnumber command:', error);
                }
            }
            }),

            dice: () => ({
                data: new SlashCommandBuilder()
                .setName("games-dice")
                .setDescription("Roll the dice")
                .addStringOption(option =>
                    option.setName("bet")
                      .setDescription("Type 'all' or enter a number to bet")
                      .setRequired(true)
                  )
                  .addIntegerOption(option =>
                    option.setName("guess")
                      .setDescription("Enter a number to guess (2-12)")
                      .setRequired(true)
                      .setMinValue(2)
                      .setMaxValue(12)
                  ),
                execute: async (interaction) => {
                    try {
                        const guess = interaction.options.getInteger("guess");
                        const bet = interaction.options.getString("bet");
                        return Games.diceRoll(interaction, bet, guess);
                    } catch (error) {
                        console.error('Error in slash dice command:', error);
                }
            }
            })


            // Add more command builders here
        };
    }

    createCommands() {
        // Register all commands using the builders
        for (const [name, builder] of Object.entries(this.commandBuilders)) {
            this.addCommand(builder());
        }
    }

    // Helper method to add a command
    addCommand(command) {
        this.commands.set(command.data.name, command);
    }
    async deleteAllRegisteredCommands() {
        await this.client.application.commands.set([]).then(async () => {
            const commands = await this.client.application.commands.fetch();
            console.log(commands.size === 0 ? "✅ Semua command berhasil dihapus!" : "⚠️ Masih ada command tersisa.");
        }).catch(console.error);
    }
    async deleteAllGuildRegisteredCommands() {
        try {
            const guilds = this.client.guilds.cache;
            for (const guild of guilds.values()) {
                const commands = await guild.commands.fetch();
                if (commands.size === 0) {
                    console.log(`No commands found in guild: ${guild.name}`);
                    continue;
                }
    
                const deletePromises = commands.map(cmd => cmd.delete());
                await Promise.all(deletePromises);
                console.log(`✅ Deleted ${commands.size} commands in guild: ${guild.name}`);
            }
        } catch (error) {
            console.error('❌ Error deleting all guild registered commands:', error);
        }
    }
    
    async handleInteraction(interaction) {
        if (!interaction.isCommand()) return;

        const command = this.commands.get(interaction.commandName);
        
        if (!command) {
            console.log(`Command ${interaction.commandName} not found`);
            return;
        }
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            
            const replyContent = 'There was an error while executing this command!';
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: replyContent, ephemeral: true }).catch(console.error);
            } else {
                await interaction.reply({ content: replyContent, ephemeral: true }).catch(console.error);
            }
        }
    }

    // async registerCommandsForGuild(guild) {
    //     if (!guild) return;
    //     const commands = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
    //     await guild.commands.set(commands);
    //     console.log(`Registered ${commands.length} slash commands for guild ${guild.name}`);
    // }

    // async registerCommandsForAllGuilds() {
    //     const guilds = this.client.guilds.cache;
    //     if (guilds.size === 0) {
    //         console.log('Bot is not in any guilds yet');
    //         return;
    //     }

    //     console.log(`Registering commands for ${guilds.size} guilds...`);
        
    //     for (const guild of guilds.values()) {
    //         try {
    //             await this.registerCommandsForGuild(guild);
    //         } catch (error) {
    //             console.error(`Failed to register commands for guild ${guild.name}:`, error);
    //         }
    //     }
    // }

    async registerGlobalCommands() {
        const commands = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
        await this.client.application.commands.set(commands);
        console.log(`Registered ${commands.length} global slash commands`);
    }

    async setupSlashCommands() {
        // Create commands directly instead of loading from files
        this.createCommands();
        
        try {
            // Option 1: Register commands globally (recommended for production bots)
            await this.registerGlobalCommands();
            
            // Option 2: Register commands for each individual guild (faster updates during development)
            // await this.registerCommandsForAllGuilds();
        } catch (error) {
            console.error("Error setting up slash commands:", error);
        }
    }
}

export { SlashCommands };