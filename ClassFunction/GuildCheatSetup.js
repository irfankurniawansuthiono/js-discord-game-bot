import { ChannelType, PermissionFlagsBits } from 'discord.js';

class FiveMLuxeCheatSetupManager {
    constructor() {
        this.client = null;
    }

    async setupCheatServerGuild(client, guildId, storeName) {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            // Clear existing setup
            await this._cleanupGuild(guild);

            // Store setup sequence
            const cheatStoreRoles = await this._createCheatStoreRoles(guild);
            const cheatStoreCategories = await this._createCheatStoreCategories(guild);
            const cheatStoreChannels = await this._createCheatStoreChannels(guild, cheatStoreRoles, cheatStoreCategories);

            // Set store branding
            await this._setBrandingAndProfile(guild, storeName);

            return {
                roles: cheatStoreRoles,
                categories: cheatStoreCategories,
                channels: cheatStoreChannels
            };
        } catch (error) {
            console.error('FiveM Cheat Store Setup Error:', error);
            throw error;
        }
    }

    async _cleanupGuild(guild) {
        try {
            // Fetch all channels first to ensure cache is updated
            await guild.channels.fetch();
    
            // Safe channel deletion with error handling
            const channelDeletionPromises = guild.channels.cache
                .filter(channel => channel.deletable)
                .map(async (channel) => {
                    try {
                        await channel.delete();
                    } catch (error) {
                        console.warn(`Could not delete channel ${channel.name}: ${error.message}`);
                    }
                });
    
            await Promise.allSettled(channelDeletionPromises);
    
            // Safe role deletion
            const systemRoleIds = [
                guild.id,  // @everyone
                guild.roles.botRoleFor(guild.client.user)?.id
            ].filter(Boolean);
    
            const roleDeletionPromises = guild.roles.cache
                .filter(role => 
                    !systemRoleIds.includes(role.id) && 
                    !role.managed && 
                    role.editable
                )
                .map(async (role) => {
                    try {
                        await role.delete();
                    } catch (error) {
                        console.warn(`Could not delete role ${role.name}: ${error.message}`);
                    }
                });
    
            await Promise.allSettled(roleDeletionPromises);
    
        } catch (error) {
            console.error('Comprehensive cleanup error:', error);
        }
    }

    async _createCheatStoreRoles(guild) {
        return {
            cheatDeveloper: await guild.roles.create({
                name: '👑 Cheat Developer',
                color: '#FFD700',
                hoist: true,
                permissions: [PermissionFlagsBits.Administrator]
            }),
            adminReseller: await guild.roles.create({
                name: '⚡ Admin Reseller',
                color: '#FF4500',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ManageRoles,
                    PermissionFlagsBits.ManageMessages
                ]
            }),
            supportStaff: await guild.roles.create({
                name: '🔧 Support Staff',
                color: '#1E90FF',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.ManageMessages
                ]
            }),
            premiumUser: await guild.roles.create({
                name: '💎 Premium User',
                color: '#FF69B4',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles
                ]
            }),
            vipClient: await guild.roles.create({
                name: '🌟 VIP Client',
                color: '#8A2BE2',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles
                ]
            }),
            betaTester: await guild.roles.create({
                name: '🧪 Beta Tester',
                color: '#FFA500',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles
                ]
            }),
            verifiedUser: await guild.roles.create({
                name: '✅ Verified User',
                color: '#32CD32',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages
                ]
            }),
            reseller: await guild.roles.create({
                name: '💼 Reseller',
                color: '#4169E1',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles
                ]
            }),
            banned: await guild.roles.create({
                name: '🚫 Banned',
                color: '#353535',
                hoist: true,
                permissions: []
            })
        };
    }
    
    async _createCheatStoreCategories(guild) {
        return {
            info: await guild.channels.create({
                name: '📌 INFORMASI',
                type: ChannelType.GuildCategory
            }),
            products: await guild.channels.create({
                name: '🔥 PRODUK CHEAT',
                type: ChannelType.GuildCategory
            }),
            support: await guild.channels.create({
                name: '🛠️ DUKUNGAN & BANTUAN',
                type: ChannelType.GuildCategory
            }),
            tutorials: await guild.channels.create({
                name: '📚 TUTORIAL & PANDUAN',
                type: ChannelType.GuildCategory
            }),
            reviews: await guild.channels.create({
                name: '🌟 TESTIMONI',
                type: ChannelType.GuildCategory
            }),
            community: await guild.channels.create({
                name: '💬 KOMUNITAS',
                type: ChannelType.GuildCategory
            }),
            premium: await guild.channels.create({
                name: '💎 AREA PREMIUM',
                type: ChannelType.GuildCategory
            }),
            vip: await guild.channels.create({
                name: '👑 AREA VIP',
                type: ChannelType.GuildCategory
            }),
            admin: await guild.channels.create({
                name: '⚙️ ADMIN & TEAM',
                type: ChannelType.GuildCategory
            }),
            updates: await guild.channels.create({
                name: '🔄 UPDATES & CHANGELOGS',
                type: ChannelType.GuildCategory
            }),
            reseller: await guild.channels.create({
                name: '💼 AREA RESELLER',
                type: ChannelType.GuildCategory
            }),
            logs: await guild.channels.create({
                name: '📊 LOGS & REPORTS',
                type: ChannelType.GuildCategory
            })
        };
    }
    
    async _createCheatStoreChannels(guild, roles, categories) {
        // Info Category
        await guild.channels.create({
            name: '📢│pengumuman',
            type: ChannelType.GuildText,
            parent: categories.info.id
        });

        await guild.channels.create({
            name: '📜│peraturan-server',
            type: ChannelType.GuildText,
            parent: categories.info.id
        });

        await guild.channels.create({
            name: '🔰│verifikasi-member',
            type: ChannelType.GuildText,
            parent: categories.info.id
        });

        await guild.channels.create({
            name: '📰│status-server',
            type: ChannelType.GuildText,
            parent: categories.info.id
        });

        // Products Category
        await guild.channels.create({
            name: '🎮│daftar-cheat',
            type: ChannelType.GuildText,
            parent: categories.products.id
        });

        await guild.channels.create({
            name: '💵│harga-paket',
            type: ChannelType.GuildText,
            parent: categories.products.id
        });

        await guild.channels.create({
            name: '🛒│cara-order',
            type: ChannelType.GuildText,
            parent: categories.products.id
        });

        await guild.channels.create({
            name: '💳│pembayaran',
            type: ChannelType.GuildText,
            parent: categories.products.id
        });

        await guild.channels.create({
            name: '🔥│fitur-unggulan',
            type: ChannelType.GuildText,
            parent: categories.products.id
        });

        // Support Category
        await guild.channels.create({
            name: '🎫│buat-tiket',
            type: ChannelType.GuildText,
            parent: categories.support.id
        });

        await guild.channels.create({
            name: '❓│faq',
            type: ChannelType.GuildText,
            parent: categories.support.id
        });

        await guild.channels.create({
            name: '⚠️│report-bug',
            type: ChannelType.GuildText,
            parent: categories.support.id
        });

        await guild.channels.create({
            name: '💡│request-fitur',
            type: ChannelType.GuildText,
            parent: categories.support.id
        });

        // Tutorials Category
        await guild.channels.create({
            name: '📥│cara-download',
            type: ChannelType.GuildText,
            parent: categories.tutorials.id
        });

        await guild.channels.create({
            name: '⚙️│cara-instalasi',
            type: ChannelType.GuildText,
            parent: categories.tutorials.id
        });

        await guild.channels.create({
            name: '🔧│troubleshooting',
            type: ChannelType.GuildText,
            parent: categories.tutorials.id
        });

        await guild.channels.create({
            name: '🧰│pengaturan-cheat',
            type: ChannelType.GuildText,
            parent: categories.tutorials.id
        });

        // Reviews Category
        await guild.channels.create({
            name: '✅│testimoni-pelanggan',
            type: ChannelType.GuildText,
            parent: categories.reviews.id
        });

        await guild.channels.create({
            name: '📸│screenshot-gameplay',
            type: ChannelType.GuildText,
            parent: categories.reviews.id
        });

        await guild.channels.create({
            name: '🎥│video-showcase',
            type: ChannelType.GuildText,
            parent: categories.reviews.id
        });

        // Community Category
        await guild.channels.create({
            name: '💬│obrolan-umum',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        await guild.channels.create({
            name: '📝│saran-server',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        await guild.channels.create({
            name: '🎮│diskusi-gaming',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        await guild.channels.create({
            name: '🎁│giveaway-event',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        // Premium Category
        await guild.channels.create({
            name: '💎│fitur-premium',
            type: ChannelType.GuildText,
            parent: categories.premium.id
        });

        await guild.channels.create({
            name: '🔐│download-premium',
            type: ChannelType.GuildText,
            parent: categories.premium.id
        });

        await guild.channels.create({
            name: '📊│status-update',
            type: ChannelType.GuildText,
            parent: categories.premium.id
        });

        await guild.channels.create({
            name: '🔔│notifikasi-premium',
            type: ChannelType.GuildText,
            parent: categories.premium.id
        });

        // VIP Category
        await guild.channels.create({
            name: '👑│vip-exclusive',
            type: ChannelType.GuildText,
            parent: categories.vip.id
        });

        await guild.channels.create({
            name: '🎁│vip-benefits',
            type: ChannelType.GuildText,
            parent: categories.vip.id
        });

        await guild.channels.create({
            name: '📦│vip-beta-access',
            type: ChannelType.GuildText,
            parent: categories.vip.id
        });

        await guild.channels.create({
            name: '💯│priority-support',
            type: ChannelType.GuildText,
            parent: categories.vip.id
        });

        // Admin Category
        await guild.channels.create({
            name: '⚙️│admin-tools',
            type: ChannelType.GuildText,
            parent: categories.admin.id
        });

        await guild.channels.create({
            name: '📋│staff-commands',
            type: ChannelType.GuildText,
            parent: categories.admin.id
        });

        await guild.channels.create({
            name: '👮│mod-chat',
            type: ChannelType.GuildText,
            parent: categories.admin.id
        });

        await guild.channels.create({
            name: '📑│order-tracking',
            type: ChannelType.GuildText,
            parent: categories.admin.id
        });

        await guild.channels.create({
            name: '📊│sales-report',
            type: ChannelType.GuildText,
            parent: categories.admin.id
        });

        // Updates Category
        await guild.channels.create({
            name: '🔄│updates-baru',
            type: ChannelType.GuildText,
            parent: categories.updates.id
        });

        await guild.channels.create({
            name: '📝│changelog',
            type: ChannelType.GuildText,
            parent: categories.updates.id
        });

        await guild.channels.create({
            name: '🛡️│anti-detection-updates',
            type: ChannelType.GuildText,
            parent: categories.updates.id
        });

        await guild.channels.create({
            name: '⚠️│security-alerts',
            type: ChannelType.GuildText,
            parent: categories.updates.id
        });

        // Reseller Category
        await guild.channels.create({
            name: '💼│info-reseller',
            type: ChannelType.GuildText,
            parent: categories.reseller.id
        });

        await guild.channels.create({
            name: '💰│harga-reseller',
            type: ChannelType.GuildText,
            parent: categories.reseller.id
        });

        await guild.channels.create({
            name: '📈│reseller-dashboard',
            type: ChannelType.GuildText,
            parent: categories.reseller.id
        });

        await guild.channels.create({
            name: '🤝│reseller-support',
            type: ChannelType.GuildText,
            parent: categories.reseller.id
        });

        // Logs Category
        await guild.channels.create({
            name: '📊│transaction-logs',
            type: ChannelType.GuildText,
            parent: categories.logs.id
        });

        await guild.channels.create({
            name: '👤│user-activity',
            type: ChannelType.GuildText,
            parent: categories.logs.id
        });

        await guild.channels.create({
            name: '⚠️│ban-logs',
            type: ChannelType.GuildText,
            parent: categories.logs.id
        });

        await guild.channels.create({
            name: '🔒│security-logs',
            type: ChannelType.GuildText,
            parent: categories.logs.id
        });
    }

    async _setBrandingAndProfile(guild, storeName) {
        await guild.setName(`${storeName} - FiveM Cheat Hub`);
        
        // Note: Paths perlu disesuaikan dengan assets yang sesuai
        try {
            await guild.setIcon('./assets/corporate-logo.png');
        } catch (error) {
            console.warn('Failed to set guild branding assets:', error.message);
        }
    }

    // Method untuk membuat invite link khusus
    async createInviteLink(guild, channelId, options = {}) {
        try {
            const channel = guild.channels.cache.get(channelId);
            if (!channel) throw new Error('Channel for invite not found');
            
            const defaultOptions = {
                maxAge: 0, // No expiry
                maxUses: 0, // Unlimited uses
                unique: true,
                reason: 'Generated by FiveM Cheat Store bot'
            };
            
            const inviteOptions = { ...defaultOptions, ...options };
            const invite = await channel.createInvite(inviteOptions);
            
            return invite;
        } catch (error) {
            console.error('Error creating invite link:', error);
            throw error;
        }
    }
    
    // Method untuk membuat pesan otomatis di kanal welcome
    async setupWelcomeMessage(guild, welcomeChannelId, message) {
        try {
            const welcomeChannel = guild.channels.cache.get(welcomeChannelId);
            if (!welcomeChannel) throw new Error('Welcome channel not found');
            
            // Kirim pesan welcome pinned
            const welcomeMessage = await welcomeChannel.send({
                content: message || `Selamat datang di **${guild.name}**! \n\nSilakan baca peraturan server dan verifikasi akun Anda untuk mengakses semua fitur.\n\nUntuk pembelian cheat FiveM premium, silakan buat tiket di kanal <#${guild.channels.cache.find(c => c.name === '🎫│buat-tiket')?.id || 'ticket-support'}>.`,
                allowedMentions: { parse: [] }
            });
            
            try {
                await welcomeMessage.pin();
            } catch (e) {
                console.warn('Could not pin welcome message:', e.message);
            }
            
            return welcomeMessage;
        } catch (error) {
            console.error('Error setting up welcome message:', error);
            throw error;
        }
    }
    
    // Method untuk setup keamanan server
    async setupServerSecurity(guild) {
        try {
            // Setup verification level
            await guild.setVerificationLevel(3); // HIGH
            
            // Setup explicit content filter
            await guild.setExplicitContentFilter(2); // FILTER ALL MEMBERS
            
            return true;
        } catch (error) {
            console.error('Error setting up server security:', error);
            throw error;
        }
    }
}

export default FiveMLuxeCheatSetupManager;