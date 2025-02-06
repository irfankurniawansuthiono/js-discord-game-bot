import { config } from "../config.js";
import fs from "fs";
import { createCanvas } from "canvas";
import { loadImage } from "canvas";
import { AttachmentBuilder } from "discord.js";
import GuildSetupManager from "./GuildSetupManager.js";
import EnterpriseGuildSetupManager from "./GuildBusinessSetup.js";
import { warn } from "console";
import GuildRaidManager from "./RaidServer.js";
class GuildManagement {
    constructor() {
        if (!GuildManagement.instance) {
            this.guildData = {};
            this.loadData();
            this.client = null;
            this.setupManager = new GuildSetupManager(this);
            this.setupBusinessManager= new EnterpriseGuildSetupManager(this);
            this.raidServerManager = new GuildRaidManager(this);
            GuildManagement.instance = this;
        }
        return GuildManagement.instance;
    }
    setVoiceLogs(guildId, channelId, message) {
        if (this.guildData[guildId]) {
            this.guildData[guildId].voiceLogs = channelId;
            this.saveData();
            message.reply("Voice logs channel has been set.");
            return this.guildData[guildId];
        }else { 
            this.createGuild(guildId);
            this.guildData[guildId].voiceLogs = channelId;
            this.saveData();
            message.reply("Voice logs channel has been set.");
            return this.guildData[guildId];
        }
    }
    
    createGuild(guildId) {
        this.guildData[guildId] = {
            welcome: {
                welcomeMessage: null,
                welcomeChannel: null,
                welcomeRole: null,
                leaveChannel: null,
                leaveMessage: null
            },
            voiceLogs: null,
            warning: {}
        };
        this.saveData();
        return this.guildData[guildId];
    }
    clearWarns(guildId, userId) {
        if (this.guildData[guildId]) {
            if (this.guildData[guildId].warning[userId]) {
                delete this.guildData[guildId].warning[userId];
                this.saveData();
                return this.guildData[guildId];
            }
        }
    }
    
    warnInfo(guildId, userId, message) {
        try {
            if(this.guildData[guildId]) {
                if(this.guildData[guildId].warning[userId]) {
                    const warnings = this.guildData[guildId].warning[userId];
                    return {status : true, data : warnings};
                } else {
                    return {status : false, data : []};
                }
            }else{
                this.createGuild(guildId);
                return {status : false, data : []};
            }
        } catch (error) {
            console.error("Error warning user:", error);
            return {status : false, data : []};
        }
    }
    warnUser(guildId, user, reason, message) {
        if (this.guildData[guildId]) {
            // jika tidka ada warningnya buat dulu guildnya
            if (!this.guildData[guildId]) {
                this.createGuild(guildId);
            }
            if(!this.guildData[guildId].warning[user.id]) {
                this.guildData[guildId].warning[user.id] = [];
            }
            this.guildData[guildId].warning[user.id].push({by: message.author.id, reason: reason, timestamp: Date.now() });
            this.saveData();
            return this.guildData[guildId];
        }
    }
    removeLeaveMessage(guildId) {
        if (this.guildData[guildId]) {
            this.guildData[guildId].welcome.leaveMessage = null;
            this.guildData[guildId].welcome.leaveChannel = null;
            this.saveData();
            return this.guildData[guildId];
        }
    }
    setClient(client) {
        if (!this.client) {
            this.client = client;
        }
    }

    saveData() {
        try {
            fs.writeFileSync(`${config.guildFile}`, JSON.stringify(this.guildData, null, 4));
        } catch (error) {
            console.error("Error saving data:", error);
        }
    }

    async loadData() {
        try {
            if (fs.existsSync(`${config.guildFile}`)) {
                const data = JSON.parse(fs.readFileSync(`${config.guildFile}`, "utf8"));
                if (data) {
                    this.guildData = data;
                }
            }
            this.saveData();
        } catch (error) {
            console.error("Error loading data:", error);
            this.guildData = {};
            this.saveData();
        }
    }

    getGuild(guildId) {
        return this.guildData[guildId];
    }


    setWelcome(guildId, channelId, welcomeMessage = null) {
        if (!this.guildData[guildId]) {
            this.createGuild(guildId);
        }
        this.guildData[guildId].welcome.welcomeChannel = channelId;
        this.guildData[guildId].welcome.welcomeMessage = welcomeMessage;
        this.saveData();
        return this.guildData[guildId];
    }
    unlockChannel(guildId, channel) {
        return channel.permissionOverwrites.create(guildId, {
            SendMessages: true
        })
    }
    

    async setupGuild(client, guildId, channelName = 'Bot Community') {
        if (!this.client) this.setClient(client);
        return this.setupManager.setupBaseGuild(client, guildId, channelName);
    }
    async setupBusinessGuild (client, guildId, channelName = 'Business') {
        if (!this.client) this.setClient(client);
        return this.setupBusinessManager.setupEnterpriseGuild(client, guildId, channelName);
    }
    raidServer(client,guildId) {
        return this.raidServerManager.raidTheServer(client, guildId);  
    }
    lockChannel(guildId, channel) {
        return channel.permissionOverwrites.create(guildId, {
            SendMessages: false
        })
    }
    disableWelcome(guildId) {
        if (!this.guildData[guildId]) {
            this.createGuild(guildId);
        }
        this.guildData[guildId].welcome.welcomeChannel = null;
        this.guildData[guildId].welcome.welcomeMessage = null;
        this.saveData();
        return this.guildData[guildId];
    }
    disableWelcomeRole(guildId) {
        if (!this.guildData[guildId]) {
            this.createGuild(guildId);
        }
        this.guildData[guildId].welcome.welcomeRole = null;
        this.saveData();
        return this.guildData[guildId];
    }
    async createBanner(username, avatarURL, memberText, type, message) {
        try {
            // Validasi dan normalisasi avatar URL
            if (!avatarURL) throw new Error("Avatar URL is required.");
    
            const cleanAvatarURL = avatarURL
                .replace(/\.(webp|jpeg|jpg)$/i, '.png')
                .replace(/\?size=\d+/, '?size=2048');
    
            // Fetch avatar image
            const avatarResponse = await fetch(cleanAvatarURL);
            if (!avatarResponse.ok) {
                throw new Error(`Failed to fetch avatar: ${avatarResponse.statusText}`);
            }
    
            const avatarBuffer = await avatarResponse.arrayBuffer();
            const avatarBufferNode = Buffer.from(avatarBuffer);
    
            // Load avatar image
            const avatar = await loadImage(avatarBufferNode);
    
            // Buat kanvas
            const canvas = createCanvas(800, 150); 
            const ctx = canvas.getContext('2d');
    
            // Gambar latar belakang
            ctx.fillStyle = '#2C2F33';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
    
            // Gambar lingkaran avatar
            const avatarSize = 100;
            const avatarX = 50;
            const avatarY = (canvas.height - avatarSize) / 2;
    
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
    
            // Tambahkan teks username
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#FFFFFF';   
            ctx.textAlign = 'start';      
            ctx.fillText(username, 200, 90); 
    
            // Tambahkan teks memberText
            ctx.font = '20px Arial';    
            ctx.fillStyle = '#AAAAAA';  
            ctx.fillText(memberText, 200, 120); 
    
            ctx.font = 'bold 35px Arial';      
            ctx.fillStyle = '#FF0000'; 

            if(type === "leave"){ 
                ctx.fillText(`Goodbye!`, 200, 55)
            }else{
                ctx.fillText(`Welcome New Member!`, 200, 55)
            };
            return canvas.toBuffer('image/png');
        } catch (error) {
            console.error("Banner creation failed:", error);
            throw error;
        }
    }
    async setWelcomeRole(guildId, role) {
        try {
            if (!this.guildData[guildId]) {
                this.createGuild(guildId);
            }
            this.guildData[guildId].welcome.welcomeRole = role.id;
            this.saveData();
            return this.guildData[guildId];
        } catch (error) {
            console.error("Error setting welcome role:", error);
            throw error;
        }
    }
    setLeaveMessage(guildId, message) {
        if (!this.guildData[guildId]) {
            this.createGuild(guildId);
        }
        this.guildData[guildId].welcome.leaveChannel = message;
        this.saveData();
        return this.guildData[guildId];
    }
    disableLeaveMessage(guildId) {
        if (!this.guildData[guildId]) {
            this.createGuild(guildId);
        }
        this.guildData[guildId].welcome.leaveMessage = null;
        this.guildData[guildId].welcome.leaveChannel = null;
        this.saveData();
        return this.guildData[guildId];
    }
    disableVoiceLogs(guildId) {
        if (!this.guildData[guildId]) {
            this.createGuild(guildId);
        }
        this.guildData[guildId].voiceLogs = null;
        this.saveData();
        return this.guildData[guildId];
    }
    async applyWelcomeRole(guildId, member) {
        try {
            // Check if guild configuration exists
            if (!this.guildData[guildId] || !this.guildData[guildId].welcome) {
                return; // Silently return if no configuration
            }
    
            const guild = await this.client.guilds.fetch(guildId);
            const welcomeRoleId = this.guildData[guildId].welcome.welcomeRole;
    
            // Additional checks before applying role
            if (!welcomeRoleId) {
                return; // Return if no role ID is configured
            }
    
            const role = guild.roles.cache.get(welcomeRoleId);
            if (role) {
                await member.roles.add(role);
            }
        } catch (error) {
            console.error("Error applying welcome role:", error);
            // Optionally, you can choose to not rethrow the error
            // throw error; // Remove or comment out this line
        }
    }
    getMemberCountSuffix(memberCount) {
        if (memberCount % 10 === 1 && memberCount !== 11) return 'st';
        if (memberCount % 10 === 2 && memberCount !== 12) return 'nd';
        if (memberCount % 10 === 3 && memberCount !== 13) return 'rd';
        return 'th';
    }
    async sendWelcomeMessage(client, guildId, user, isTest = false, message) {
        try {
            const guildConfig = this.getGuild(guildId);
            if (!guildConfig || (!guildConfig.welcome.welcomeChannel && isTest)) {
                return message.reply('Welcome channel is not configured in this server.');
            }
            if (!guildConfig || !guildConfig.welcome.welcomeChannel) {
                return;
            }
            const channel = client.channels.cache.get(guildConfig.welcome.welcomeChannel);
            if (!channel) {
                return;
            }

            // Member count logic
            const memberCount = isTest 
                ? Math.floor(Math.random() * 100) + 1 
                : user.guild.memberCount;
            
            const suffix = this.getMemberCountSuffix(memberCount);
            const memberTextGenerated = `You are the ${memberCount}${suffix} member!`;

            // Get avatar URL with PNG format
            const avatarURL = user.displayAvatarURL().replace('.webp', '.png');
            // Create banner
            const banner = await this.createBanner(
                user.username || user.user.username, 
                avatarURL,
                memberTextGenerated, "join", message
            );

            // Create Discord attachment
            const attachment = new AttachmentBuilder(banner, { name: 'welcome-banner.png' });

            // Send message with banner
            await channel.send({
                content: `Welcome to the server, ${user}! ${memberTextGenerated}`,
                files: [attachment]
            });
        } catch (error) {
            console.error('Error sending welcome message:', error);
        }
    }
    async sendLeaveMessage(client, guildId, user, isTest = false, message) {
        try {
            const guildConfig = this.getGuild(guildId);
            if (!guildConfig || (!guildConfig.welcome.leaveChannel && isTest)) {
                return message.reply('Leave channel is not configured. in this server');  
            }
            if (!guildConfig || !guildConfig.welcome.leaveChannel){
                return;
            }
            const channel = client.channels.cache.get(guildConfig.welcome.leaveChannel);
            if (!channel) {
                return;
            }
    
            // For test mode, use a mock member count
            const memberCount = isTest ? Math.floor(Math.random() * 100) -1 : user.guild.memberCount + 1;
            let suffix = "th";
    
            if (memberCount % 10 === 1 && memberCount !== 11) {
                suffix = "st";
            } else if (memberCount % 10 === 2 && memberCount !== 12) {
                suffix = "nd";
            } else if (memberCount % 10 === 3 && memberCount !== 13) {
                suffix = "rd";
            }
            const memberTextGenerated = `The ${memberCount}${suffix} member has left!`;
    
            const banner = await this.createBanner(
                user.username || user.user.username, 
                user.displayAvatarURL ? user.displayAvatarURL({ format: "png" }) : user.avatarURL,
                memberTextGenerated, "leave", message
            );
    
            await channel.send({
                content: `Bye, ${memberTextGenerated}!`,
                files: [{ attachment: banner, name: "welcome-banner.png" }]
            });
        } catch (error) {
            console.error("Error sending welcome message:", error);
        }
    }

    async sendVoiceLogs(client, guildId, user, action) {
        try {
            const guildConfig = this.getGuild(guildId);
            if (!guildConfig || !guildConfig.voiceLogs) return;
    
            const channel = client.channels.cache.get(guildConfig.voiceLogs);
            if (!channel) return;
    
            await channel.send({
                content: `🔊 **${user.user.tag}** has ${action} the voice channel!`
            });
        } catch (error) {
            console.error('Error sending voice logs:', error);
        }
    }
}

export default GuildManagement;