import { ChannelType, PermissionFlagsBits } from 'discord.js';

class EnterpriseGuildSetupManager {
    constructor() {
        this.client = null;
    }

    async setupEnterpriseGuild(client, guildId, channelName) {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            // Clear existing setup
            await this._cleanupGuild(guild);

            // Enterprise setup sequence
            const enterpriseRoles = await this._createStoreRoles(guild);
            const enterpriseCategories = await this._createStoreCategories(guild);
            const enterpriseChannels = await this._createStoreChannels(guild, enterpriseRoles, enterpriseCategories);

            // Set corporate branding
            await this._setBrandingAndProfile(guild, channelName);

            return {
                roles: enterpriseRoles,
                categories: enterpriseCategories,
                channels: enterpriseChannels
            };
        } catch (error) {
            console.error('Enterprise Guild Setup Error:', error);
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

    async _createStoreRoles(guild) {
        return {
            storeOwner: await guild.roles.create({
                name: '🏪 Store Owner',
                color: '#FFD700',
                hoist: true,
                permissions: [PermissionFlagsBits.Administrator]
            }),
            manager: await guild.roles.create({
                name: '🛠️ Manager',
                color: '#FF4500',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ManageRoles,
                    PermissionFlagsBits.ManageMessages
                ]
            }),
            staff: await guild.roles.create({
                name: '🛒 Staff',
                color: '#1E90FF',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.ManageMessages
                ]
            }),
            vipCustomer: await guild.roles.create({
                name: '💎 VIP Customer',
                color: '#FF69B4',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles
                ]
            }),
            deliveryStaff: await guild.roles.create({
                name: '🚚 Delivery Staff',
                color: '#FFA500',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageMessages
                ]
            }),
            productManager: await guild.roles.create({
                name: '📦 Product Manager',
                color: '#8A2BE2',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ViewAuditLog
                ]
            }),
            customer: await guild.roles.create({
                name: '👤 Customer',
                color: '#32CD32',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages
                ]
            })
        };
    }
    
    async _createStoreCategories(guild) {
        return {
            info: await guild.channels.create({
                name: 'INFORMASI',
                type: ChannelType.GuildCategory
            }),
            store: await guild.channels.create({
                name: 'STORE',
                type: ChannelType.GuildCategory
            }),
            support: await guild.channels.create({
                name: 'SUPPORT & PELANGGAN',
                type: ChannelType.GuildCategory
            }),
            testimonials: await guild.channels.create({
                name: 'TESTIMONI',
                type: ChannelType.GuildCategory
            }),
            community: await guild.channels.create({
                name: 'KOMUNITAS',
                type: ChannelType.GuildCategory
            }),
            vip: await guild.channels.create({
                name: 'EXCLUSIVE MEMBER AREA',
                type: ChannelType.GuildCategory
            }),
            admin: await guild.channels.create({
                name: 'ADMIN & TEAM',
                type: ChannelType.GuildCategory
            }),
            promotions: await guild.channels.create({
                name: 'PROMOSI DAN KERJASAMA',
                type: ChannelType.GuildCategory
            }),
            entertainment: await guild.channels.create({
                name: 'ENTERTAINMENT',
                type: ChannelType.GuildCategory
            }),
            logs: await guild.channels.create({
                name: 'LOG',
                type: ChannelType.GuildCategory
            })
        };
    }
    
    async _createStoreChannels(guild, roles, categories) {
        await guild.channels.create({
            name: '📢│pengumuman',
            type: ChannelType.GuildText,
            parent: categories.info.id
        });

        await guild.channels.create({
            name: '📜│aturan-server',
            type: ChannelType.GuildText,
            parent: categories.info.id
        });

        await guild.channels.create({
            name: '📆│jadwal-event',
            type: ChannelType.GuildText,
            parent: categories.info.id
        });

        await guild.channels.create({
            name: '📊│statistik',
            type: ChannelType.GuildText,
            parent: categories.info.id
        });

        await guild.channels.create({
            name: '🛍️│katalog-produk',
            type: ChannelType.GuildText,
            parent: categories.store.id
        });

        await guild.channels.create({
            name: '💵│promo-diskon',
            type: ChannelType.GuildText,
            parent: categories.store.id
        });

        await guild.channels.create({
            name: '🛒│cara-order',
            type: ChannelType.GuildText,
            parent: categories.store.id
        });

        await guild.channels.create({
            name: '💳│metode-pembayaran',
            type: ChannelType.GuildText,
            parent: categories.store.id
        });

        await guild.channels.create({
            name: '🚚│info-pengiriman',
            type: ChannelType.GuildText,
            parent: categories.store.id
        });

        await guild.channels.create({
            name: '📩│kontak-admin',
            type: ChannelType.GuildText,
            parent: categories.support.id
        });

        await guild.channels.create({
            name: '🎟️│ticket-support',
            type: ChannelType.GuildText,
            parent: categories.support.id
        });

        await guild.channels.create({
            name: '❓│faq',
            type: ChannelType.GuildText,
            parent: categories.support.id
        });

        await guild.channels.create({
            name: '💡│saran-dan-masukan',
            type: ChannelType.GuildText,
            parent: categories.support.id
        });

        await guild.channels.create({
            name: '🌟│testimoni-positif',
            type: ChannelType.GuildText,
            parent: categories.testimonials.id
        });

        await guild.channels.create({
            name: '🛠️│kritik-dan-saran',
            type: ChannelType.GuildText,
            parent: categories.testimonials.id
        });

        await guild.channels.create({
            name: '💬│obrolan-umum',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        await guild.channels.create({
            name: '🎨│konten-pelanggan',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        await guild.channels.create({
            name: '🎉│event-dan-giveaway',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        await guild.channels.create({
            name: '📷│gallery-produk',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        await guild.channels.create({
            name: '🎮│game-bareng',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        await guild.channels.create({
            name: '👑│member-vip',
            type: ChannelType.GuildText,
            parent: categories.vip.id
        });

        await guild.channels.create({
            name: '📦│pre-order-vip',
            type: ChannelType.GuildText,
            parent: categories.vip.id
        });

        await guild.channels.create({
            name: '🎁│hadiah-eksklusif',
            type: ChannelType.GuildText,
            parent: categories.vip.id
        });

        await guild.channels.create({
            name: '🛠️│admin-tools',
            type: ChannelType.GuildText,
            parent: categories.admin.id
        });

        await guild.channels.create({
            name: '📂│laporan-order',
            type: ChannelType.GuildText,
            parent: categories.admin.id
        });

        await guild.channels.create({
            name: '💻│diskusi-admin',
            type: ChannelType.GuildText,
            parent: categories.admin.id
        });

        await guild.channels.create({
            name: '📊│laporan-keuangan',
            type: ChannelType.GuildText,
            parent: categories.admin.id
        });

        await guild.channels.create({
            name: '🤝│kerjasama-bisnis',
            type: ChannelType.GuildText,
            parent: categories.promotions.id
        });

        await guild.channels.create({
            name: '📣│iklan-dari-mitra',
            type: ChannelType.GuildText,
            parent: categories.promotions.id
        });

        await guild.channels.create({
            name: '🎶│musik',
            type: ChannelType.GuildText,
            parent: categories.entertainment.id
        });

        await guild.channels.create({
            name: '🔗│link-seru',
            type: ChannelType.GuildText,
            parent: categories.entertainment.id
        });

        await guild.channels.create({
            name: '📜│quote-hari-ini',
            type: ChannelType.GuildText,
            parent: categories.entertainment.id
        });

        await guild.channels.create({
            name: '🔐│log-pesan',
            type: ChannelType.GuildText,
            parent: categories.logs.id
        });

        await guild.channels.create({
            name: '🛡️│log-server',
            type: ChannelType.GuildText,
            parent: categories.logs.id
        });
    }

    async _setBrandingAndProfile(guild, channelName) {
        await guild.setName(`${channelName}`);
        
        // Note: Replace with actual paths to your corporate branding assets
        await guild.setIcon('./assets/corporate-logo.png');
        await guild.setBanner('./assets/corporate-banner.jpg');
    }
}

export default EnterpriseGuildSetupManager;