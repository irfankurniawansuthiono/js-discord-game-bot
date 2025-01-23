import { ChannelType, PermissionFlagsBits } from 'discord.js';

class GuildSetupManager {
    constructor(guildManagement) {
        this.guildManagement = guildManagement;
        this.client = null;
    }

    setClient(client) {
        this.client = client;
    }
    async setServerName(guild) {
        await guild.setName('Nanami Base');
    }
    async createRoles(guild) {
        return {
            
            officialBot: await guild.roles.create({
                name: '🤖 Official Bot',
                color: '#FFF000',
                hoist: true
            }),
            BotDev: await guild.roles.create({
                name: '🤖 Bot Dev',
                color: '#800080',
                hoist: true
            }),
            helper: await guild.roles.create({
                name: '📚 Helper',
                color: '#FFDAB9',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.SendMessages
                ]
            }),
            admin: await guild.roles.create({
                name: '👑 Admin',
                color: '#FF0000',
                hoist: true,
                permissions: [PermissionFlagsBits.Administrator]
            }),
            moderator: await guild.roles.create({
                name: '🛡️ Moderator',
                hoist: true,
                color: '#0099FF',
                permissions: [
                    PermissionFlagsBits.ModerateMembers,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.KickMembers
                ]
            }),
            developer: await guild.roles.create({
                name: '💻 Developer',
                hoist: true,
                color: '#00FF00',
                permissions: [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageChannels
                ]
            }),
            announcer:await guild.roles.create({
                name: '📢 Announcer',
                color: '#FFA500',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ManageEvents,
                    PermissionFlagsBits.SendMessages
                ]
            }),
            
            tester:await guild.roles.create({
                name: '⚙️ Tester',
                color: '#808080',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles
                ]
            }),
            veteran: await guild.roles.create({
                name: '🏆 Veteran',
                color: '#FFD700',
                hoist: true,
                permissions: [PermissionFlagsBits.SendMessages]
            }),
            vip: await guild.roles.create({
                name: '💎 VIP',
                color: '#800080',
                hoist: true,
                permissions: [PermissionFlagsBits.SendMessages]
            }),
            artist: await guild.roles.create({
                name: '🎨 Artist',
                color: '#FF69B4',
                hoist: true,
                permissions: [PermissionFlagsBits.SendMessages]
            }),
            musician: await guild.roles.create({
                name: '🎵 Musician',
                color: '#1E90FF',
                hoist: true,
                permissions: [PermissionFlagsBits.SendMessages]
            }),
            streamer: await guild.roles.create({
                name: '📺 Streamer',
                color: '#9932CC',
                hoist: true,
                permissions: [PermissionFlagsBits.SendMessages]
            }),
            friends: await guild.roles.create({
                name: '🤝 Friends',
                color: '#FFC0CB',
                hoist: true,
                permissions: [PermissionFlagsBits.SendMessages]
            }),
            
            member: await guild.roles.create({
                name: '👥 Member',
                color: '#FFFFFF',
                hoist: true,
                permissions: [PermissionFlagsBits.SendMessages]
            }),
            
            
        };
    }
    
    async createCategories(guild) {
        return {
            rulesInfo:await guild.channels.create({
                name: '📜 Rules & Info',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    }
                ]
            }),
            
            development: await guild.channels.create({
                name: '⚙️ Development',
                type: ChannelType.GuildCategory
            }),
            
            admin: await guild.channels.create({
                name: '👑 Admin',
                type: ChannelType.GuildCategory,
                // buat agar umum tidak terlihat
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    }
                ]
            }),
            general: await guild.channels.create({
                name: '🌈 General',
                type: ChannelType.GuildCategory
            }),
            botDiscussion: await guild.channels.create({
                name: '🤖 Bot Discussion',
                type: ChannelType.GuildCategory
            }),
            support: await guild.channels.create({
                name: '🆘 Support',
                type: ChannelType.GuildCategory
            }),
            events: await guild.channels.create({
                name: '🎉 Events',
                type: ChannelType.GuildCategory
            }),
            creativeCorner: await guild.channels.create({
                name: '🎨 Creative Corner',
                type: ChannelType.GuildCategory
            }),
            music: await guild.channels.create({
                name: '🎵 Music',
                type: ChannelType.GuildCategory
            }),
            gaming: await guild.channels.create({
                name: '🎮 Gaming',
                type: ChannelType.GuildCategory
            })
        };
    }
    async setGuildProfile(guild) {
        return {
            icon: await guild.setIcon('./assets/default-profile.jpg'),
            banner: await guild.setBanner('./assets/welcome-banner.jpg'),
        };
    }
    async createChannels(guild, categories, roles) {
        return {
            devUpdates:await guild.channels.create({
                name: '🔧 dev-updates',
                type: ChannelType.GuildText,
                parent: categories.development
            }),
            
            suggestions:await guild.channels.create({
                name: '💡 suggestions',
                type: ChannelType.GuildText,
                parent: categories.development
            }),
            knownBugs:await guild.channels.create({
                name: '🐞 known-bugs',
                type: ChannelType.GuildText,
                parent: categories.development
            }),            
            gamingVoice:await guild.channels.create({
                name: '🎙️ gaming-voice',
                type: ChannelType.GuildVoice,
                parent: categories.gaming
            }),            
            liveDj:await guild.channels.create({
                name: '🎧 live-dj',
                type: ChannelType.GuildVoice,
                parent: categories.music
            }),            
            rules:await guild.channels.create({
                name: '📌 rules',
                type: ChannelType.GuildText,
                parent: categories.rulesInfo,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    }
                ]
            }),
            adminChat :await guild.channels.create({
                name: '🎇 admin-chat',
                type: ChannelType.GuildText,
                parent: categories.admin
            }),
            adminVoice:await guild.channels.create({
                name: '🎙️ admin-voice',
                type: ChannelType.GuildVoice,
                parent: categories.admin
            }),
            faq:await guild.channels.create({
                name: '📖 faq',
                type: ChannelType.GuildText,
                parent: categories.rulesInfo,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    }
                ]
            }),
            
            updates:await guild.channels.create({
                name: '🆕 updates',
                type: ChannelType.GuildText,
                parent: categories.rulesInfo,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    }
                ]
            }),            
            welcome: await guild.channels.create({
                name: '👋 welcome',
                type: ChannelType.GuildText,
                parent: categories.general,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    }
                ]
            }),
            generalChat: await guild.channels.create({
                name: '💬 general-chat',
                type: ChannelType.GuildText,
                parent: categories.general
            }),
            introductions: await guild.channels.create({
                name: '📋 introductions',
                type: ChannelType.GuildText,
                parent: categories.general
            }),
            botCommands: await guild.channels.create({
                name: '🤖 bot-commands',
                type: ChannelType.GuildText,
                parent: categories.botDiscussion
            }),
            techSupport: await guild.channels.create({
                name: '🆘 tech-support',
                type: ChannelType.GuildText,
                parent: categories.support
            }),
            eventAnnouncements: await guild.channels.create({
                name: '📢 event-announcements',
                type: ChannelType.GuildText,
                parent: categories.events
            }),
            bugReports: await guild.channels.create({
                name: '🐞 bug-reports',
                type: ChannelType.GuildText,
                parent: categories.support
            }),
            upcomingEvents: await guild.channels.create({
                name: '📅 upcoming-events',
                type: ChannelType.GuildText,
                parent: categories.events
            }),
            artShowcase: await guild.channels.create({
                name: '🎨 art-showcase',
                type: ChannelType.GuildText,
                parent: categories.creativeCorner
            }),
            musicShare: await guild.channels.create({
                name: '🎵 music-share',
                type: ChannelType.GuildText,
                parent: categories.music
            }),
            musicVoice: await guild.channels.create({
                name: '🎤 music-voice',
                type: ChannelType.GuildVoice,
                parent: categories.music
            }),
            gamingLounge: await guild.channels.create({
                name: '🎮 gaming-lounge',
                type: ChannelType.GuildText,
                parent: categories.gaming
            })
        };
    }
    async deleteUserRoles(guild) {
        // Keep system and bot roles, delete user-created roles
        const rolesToKeep = [
            guild.id,  // @everyone role
            guild.roles.botRoleFor(guild.client.user).id,  // Bot's role
            ...guild.roles.cache
                .filter(role => role.managed)  // Integration/system roles
                .map(role => role.id)
        ];
    
        const rolesToDelete = guild.roles.cache
            .filter(role => !rolesToKeep.includes(role.id))
            .map(role => role.delete());
    
        return Promise.all(rolesToDelete);
    }
    async setupGuild(client, guildId) {
        try {
            if (!this.client) {
                throw new Error('Client not initialized in GuildManagement');
            }
            const useClient = client || this.client;
            if (!useClient) {
                throw new Error('No client available for guild setup');
            }
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                throw new Error('Guild not found');
            }

            // Delete existing channels
            await Promise.all(guild.channels.cache.map(channel => channel.delete()));
            // delete all roles
            await this.deleteUserRoles(guild);
            // Create setup components
            const guildname = this.setServerName(guild);
            const guildProfile = this.setGuildProfile(guild);
            const roles = await this.createRoles(guild);
            const categories = await this.createCategories(guild);
            const channels = await this.createChannels(guild, categories, roles);


            return { roles, categories, channels, guildname, guildProfile };
        } catch (error) {
            console.error('Error setting up guild:', error);
            throw error;
        }
    }
}

export default GuildSetupManager;