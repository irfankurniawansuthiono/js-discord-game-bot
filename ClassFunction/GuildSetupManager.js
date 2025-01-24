import { ChannelType, PermissionFlagsBits } from 'discord.js';
class GuildSetupManager {
    constructor(companyName = 'Global Community') {
        this.companyName = companyName;
        this.client = null;
    }

    async setupBaseGuild(client, guildId) {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) throw new Error('Guild not found');

            // Clear existing setup
            await this._cleanupGuild(guild);

            // Enterprise setup sequence
            const enterpriseRoles = await this._createBaseRoles(guild);
            const enterpriseCategories = await this._createBaseCategories(guild);
            const enterpriseChannels = await this._createBaseChannels(guild, enterpriseRoles, enterpriseCategories);

            // Set corporate branding
            await this._setBrandingAndProfile(guild);

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

    async _createBaseRoles(guild) {
        return {
            officialBot: await guild.roles.create({
                name: 'Official Bot',
                color: '#7289DA',
                hoist: true,
                permissions: [PermissionFlagsBits.Administrator]
            }),
            botDev: await guild.roles.create({
                name: 'Bot Developer',
                color: '#FF0000',
                hoist: true,
                permissions: [PermissionFlagsBits.Administrator]
            }),
            communityLeader: await guild.roles.create({
                name: '👑 Community Leader',
                color: '#FFD700',
                hoist: true,
                permissions: [PermissionFlagsBits.Administrator]
            }),
            communityManager: await guild.roles.create({
                name: '🛠️ Community Manager',
                // warna orange
                color: '#FF4500',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.ManageRoles,
                    PermissionFlagsBits.ManageMessages
                ]
            }),
            communityStaff: await guild.roles.create({
                name: '🤝 Community Staff',
                color: '#1E90FF',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.ManageMessages
                ]
            }),
            friends: await guild.roles.create({
                name: '👫 Friends',
                color: '#FFC0CB',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages
                ]
            }),
            premiumMember: await guild.roles.create({
                name: '💎 Premium Member',
                color: '#FF69B4',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles
                ]
            }),
            contentCreator: await guild.roles.create({
                name: '🎨 Content Creator',
                color: '#FFA500',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages
                ]
            }),
            member: await guild.roles.create({
                name: '👥 Community Member',
                color: '#32CD32',
                hoist: true,
                permissions: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages
                ]
            })
        };
    }
    
    async _createBaseCategories(guild) {
        return {
            information: await guild.channels.create({
                name: '📢 INFORMATION HUB',
                type: ChannelType.GuildCategory
            }),
            friendsZone: await guild.channels.create({
                name: '👫 FRIENDS ZONE',
                type: ChannelType.GuildCategory
            }),
            community: await guild.channels.create({
                name: '🌐 COMMUNITY CENTER',
                type: ChannelType.GuildCategory
            }),
            support: await guild.channels.create({
                name: '🆘 SUPPORT & HELP',
                type: ChannelType.GuildCategory
            }),
            feedback: await guild.channels.create({
                name: '💬 FEEDBACK & REVIEWS',
                type: ChannelType.GuildCategory
            }),
            projectSpaces: await guild.channels.create({
                name: '🚀 PROJECT SPACES',
                type: ChannelType.GuildCategory
            }),
            premiumZone: await guild.channels.create({
                name: '💎 PREMIUM ZONE',
                type: ChannelType.GuildCategory
            }),
            administration: await guild.channels.create({
                name: '🔧 ADMINISTRATION',
                type: ChannelType.GuildCategory
            }),
            events: await guild.channels.create({
                name: '🎉 EVENTS & PROGRAMS',
                type: ChannelType.GuildCategory
            }),
            networking: await guild.channels.create({
                name: '🤝 NETWORKING',
                type: ChannelType.GuildCategory
            }),
            logs: await guild.channels.create({
                name: '📋 SERVER LOGS',
                type: ChannelType.GuildCategory
            })
        };
    }
    
    async _createBaseChannels(guild, roles, categories) {
        // Information Channels
        await guild.channels.create({
            name: '📢│announcements',
            type: ChannelType.GuildText,
            parent: categories.information.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: PermissionFlagsBits.ViewChannel,
                    deny: PermissionFlagsBits.SendMessages
                }
            ]
        });
        await guild.channels.create({
            name: '📝│New Commands',
            type: ChannelType.GuildText,
            parent: categories.information.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: PermissionFlagsBits.ViewChannel,
                    deny: PermissionFlagsBits.SendMessages
                }
            ]
        })
        await guild.channels.create({
            name: '📜│server-rules',
            type: ChannelType.GuildText,
            parent: categories.information.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: PermissionFlagsBits.ViewChannel,
                    deny: PermissionFlagsBits.SendMessages
                }
            ]
        });

        await guild.channels.create({
            name: '📅│event-calendar',
            type: ChannelType.GuildText,
            parent: categories.information.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: PermissionFlagsBits.ViewChannel,
                    deny: PermissionFlagsBits.SendMessages
                }
            ]
        });

        // Community Channels
        await guild.channels.create({
            name: '💬│general-chat',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });

        await guild.channels.create({
            name: '🌍│international-lounge',
            type: ChannelType.GuildText,
            parent: categories.community.id
        });
        // bot channel 
        await guild.channels.create({
            name: '🤖│bot-zone',
            type: ChannelType.GuildText,
            parent: categories.community.id
        })

        // friends zone
        await guild.channels.create({
            name: '💬│friends-zone',
            type: ChannelType.GuildText,
            parent: categories.friendsZone.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel]
                },
                {
                    id: roles.friends.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        })

        await guild.channels.create({
            name: '🎙️│friends-voice',
            type: ChannelType.GuildVoice,
            parent: categories.friendsZone.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
                },
                {
                    id: roles.friends.id,
                    allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
                }
            ]
        });

        await guild.channels.create({
            name: '🎨│content-showcase',
            type: ChannelType.GuildText,
            parent: categories.community.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: PermissionFlagsBits.ViewChannel,
                    deny: PermissionFlagsBits.SendMessages
                },
                {
                    id: roles.contentCreator.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });

        // Support Channels
        await guild.channels.create({
            name: '🆘│help-desk',
            type: ChannelType.GuildText,
            parent: categories.support.id,
            rateLimitPerUser: 3600,
        });

        await guild.channels.create({
            name: '🐞│bug-report',
            type: ChannelType.GuildText,
            parent: categories.support.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: PermissionFlagsBits.ViewChannel,
                    deny: PermissionFlagsBits.SendMessages
                }
            ]
        })

        await guild.channels.create({
            name: '❓│faq-corner',
            type: ChannelType.GuildText,
            parent: categories.support.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: PermissionFlagsBits.ViewChannel,
                    deny: PermissionFlagsBits.SendMessages
                }
            ]
        });

        await guild.channels.create({
            name: '👷│technical-support',
            type: ChannelType.GuildText,
            parent: categories.support.id
        });

        // Feedback Channels
        await guild.channels.create({
            name: '⭐│testimonials',
            type: ChannelType.GuildText,
            parent: categories.feedback.id
        });

        await guild.channels.create({
            name: '📝│suggestions',
            type: ChannelType.GuildText,
            parent: categories.feedback.id,
            rateLimitPerUser: 3600
        });

        // Project Spaces
        await guild.channels.create({
            name: '🚀│project-showcase',
            type: ChannelType.GuildText,
            parent: categories.projectSpaces.id,
            rateLimitPerUser: 3600,
        });

        await guild.channels.create({
            name: '💡│innovation-hub',
            type: ChannelType.GuildText,
            parent: categories.projectSpaces.id,
            rateLimitPerUser: 3600,
        });

        // Premium Zone
        await guild.channels.create({
            name: '💎│premium-lounge',
            type: ChannelType.GuildText,
            parent: categories.premiumZone.id,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: roles.premiumMember.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });

        // Administration Channels
        await guild.channels.create({
            name: '🔧│admin-discussion',
            type: ChannelType.GuildText,
            parent: categories.administration.id,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: roles.communityLeader.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });
        await guild.channels.create({
            name: '🎤│admin-voice',
            type: ChannelType.GuildVoice,
            parent: categories.administration.id,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: roles.communityLeader.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        })
        // Events Channels
        await guild.channels.create({
            name: '🎉│upcoming-events',
            type: ChannelType.GuildText,
            parent: categories.events.id,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    allow: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: roles.communityLeader.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });

        await guild.channels.create({
            name: '🏆│community-challenges',
            type: ChannelType.GuildText,
            parent: categories.events.id,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages]
                },
                {
                    id: roles.communityLeader.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });

        // Networking Channels
        await guild.channels.create({
            name: '🤝│collaboration-hub',
            type: ChannelType.GuildText,
            parent: categories.networking.id
        });

        // Log Channels
        await guild.channels.create({
            name: '🔐│message-logs',
            type: ChannelType.GuildText,
            parent: categories.logs.id,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: roles.communityLeader.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });

        await guild.channels.create({
            name: '🗒️│moderation-logs',
            type: ChannelType.GuildText,
            parent: categories.logs.id,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: roles.communityLeader.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });
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
    async _setBrandingAndProfile(guild) {
        await guild.setName(`Nanami Base`);
        
        // Note: Replace with actual paths to your corporate branding assets
        await guild.setIcon('./assets/default-profile.jpg');
        await guild.setBanner('./assets/welcome-banner.jpg');
    }
}

export default GuildSetupManager;