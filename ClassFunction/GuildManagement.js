import { config } from "../config.js";
import fs from "fs";
import Canvas from "canvas";

class GuildManagement {
    constructor() {
        if (!GuildManagement.instance) {
            this.guildData = {};
            this.loadData();
            GuildManagement.instance = this;
        }
        return GuildManagement.instance;
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

    createGuild(guildId) {
        this.guildData[guildId] = {
            welcome: {
                welcomeMessage: null,
                welcomeChannel: null
            }
        };
        this.saveData();
        return this.guildData[guildId];
    }

    setWelcomeMessage(guildId, channelId, welcomeMessage = null) {
        if (!this.guildData[guildId]) {
            this.createGuild(guildId);
        }
        this.guildData[guildId].welcome.welcomeChannel = channelId;
        this.guildData[guildId].welcome.welcomeMessage = welcomeMessage;
        this.saveData();
        return this.guildData[guildId];
    }
    disableWelcomeMessage(guildId) {
        if (!this.guildData[guildId]) {
            this.createGuild(guildId);
        }
        this.guildData[guildId].welcome.welcomeChannel = null;
        this.guildData[guildId].welcome.welcomeMessage = null;
        this.saveData();
        return this.guildData[guildId];
    }
    async createWelcomeBanner(username, avatarURL, memberText) {
        if (!username || typeof username !== 'string') {
            throw new Error('Invalid username provided');
        }
    
        try {
            // Validate and normalize avatar URL
            const safeAvatarURL = avatarURL && typeof avatarURL === 'string' 
                ? avatarURL.replace(/\?size=\d+/, '') + '?size=256' 
                : `./assets/default-profile.jpg`;
    
            // Load background and avatar images concurrently
            const [background, avatar] = await Promise.all([
                Canvas.loadImage("./assets/welcome-banner.jpg"),
                new Promise((resolve, reject) => {
                    const img = new Canvas.Image();
                    img.onload = () => resolve(img);
                    img.onerror = (err) => {
                        console.error(`Failed to load avatar: ${safeAvatarURL}`, err);
                        // Fallback to default avatar on error
                        Canvas.loadImage("./assets/default-profile.jpg").then(resolve).catch(reject);
                    };
                    img.src = safeAvatarURL;
                })
            ]);
    
            const canvas = Canvas.createCanvas(background.width, background.height);
            const ctx = canvas.getContext("2d");
    
            // Draw background
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
            // Draw circular avatar
            const avatarSize = 200;
            const avatarX = (canvas.width - avatarSize) / 2;
            const avatarY = 50;
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
    
            // Add text styling
            ctx.font = "bold 48px Arial";
            ctx.fillStyle = "#ffff";
            ctx.textAlign = "center";
            
            const text = `Welcome, ${username}!`;
            ctx.fillText(text, canvas.width/2, 300);
            ctx.fillText(memberText, canvas.width/2, 350);
    
            // Optional: Add shadow effect
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
    
            // Return image buffer
            return canvas.toBuffer("image/png");
        } catch (error) {
            console.error("Welcome banner creation failed:", error);
            throw new Error(`Failed to create welcome banner: ${error.message}`);
        }
    }

    async sendWelcomeMessage(client, guildId, user, isTest = false) {
        try {
            const guildConfig = this.getGuild(guildId);
            if (!guildConfig || !guildConfig.welcome.welcomeChannel) {
                return;
            }
    
            const channel = client.channels.cache.get(guildConfig.welcome.welcomeChannel);
            if (!channel) {
                throw new Error("Welcome channel not found.");
            }
    
            // For test mode, use a mock member count
            const memberCount = isTest ? Math.floor(Math.random() * 100) + 1 : user.guild.memberCount;
            let suffix = "th";
    
            if (memberCount % 10 === 1 && memberCount !== 11) {
                suffix = "st";
            } else if (memberCount % 10 === 2 && memberCount !== 12) {
                suffix = "nd";
            } else if (memberCount % 10 === 3 && memberCount !== 13) {
                suffix = "rd";
            }
            const memberTextGenerated = `You are the ${memberCount}${suffix} member!`;
    
            const banner = await this.createWelcomeBanner(
                user.username || user.user.username, 
                user.displayAvatarURL ? user.displayAvatarURL({ format: "png" }) : user.avatarURL,
                memberTextGenerated
            );
    
            await channel.send({
                content: `Welcome to the server, ${user}, ${memberTextGenerated}!`,
                files: [{ attachment: banner, name: "welcome-banner.png" }]
            });
        } catch (error) {
            console.error("Error sending welcome message:", error);
        }
    }
}

export default GuildManagement;