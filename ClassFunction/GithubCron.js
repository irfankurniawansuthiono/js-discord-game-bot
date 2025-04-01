import fs from "fs";
import path from "path";
import { Octokit } from "octokit";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import { config, discordEmotes } from "../config.js";
import { EmbedBuilder } from "discord.js";
const myOctokit = Octokit.plugin(restEndpointMethods);
class GithubCron {
    constructor(client) {
        if(!GithubCron.instance) {
            this.client = client;
            this.githubUsername = process.env.GITHUB_USERNAME;
            this.githubToken = process.env.GITHUB_TOKEN;
            this.filePath = path.join("./assets/githubCron");
            GithubCron.instance = this;
        }
        return GithubCron.instance;
    }

    generateRandomString(length = 8) {
        return Math.random().toString(36).substring(2, 2 + length);
    }

    async renameImage() {
        try {
            const files = fs.readdirSync(this.filePath);
            if (files.length === 0) {
                throw new Error("No files found in the directory.");
            }

            const firstFile = files[0];
            const ext = path.extname(firstFile);
            const newFileName = `${this.generateRandomString()}_${new Date().toISOString().replace(/[-:.TZ]/g, "")}.gif`;
            
            const oldPath = path.join(this.filePath, firstFile);
            const newPath = path.join(this.filePath, newFileName);
            
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed ${firstFile} to ${newFileName}`);
            return {status : true, fileName: newFileName};
        } catch (error) {
            console.error("Error renaming image:", error);
            return {status : false, error: error};
        }
    }
    async imageBuffer() {
        try {
            const files = fs.readdirSync(this.filePath);
            if (files.length === 0) {
                throw new Error("No files found in the directory.");
            }
            const firstFile = files[0];
            const ext = path.extname(firstFile);
            const imageBuffer = fs.readFileSync(path.join(this.filePath, firstFile));
            return {status : true, imageBuffer: imageBuffer};
        } catch (error) {
            console.error("Error in imageBuffer:", error);
            return {status : false, error: error};
        }
    }
    async startCommit() {
        const octokit = new myOctokit({ auth: this.githubToken });

        try {
            const renamedFile = await this.renameImage();
            if (!renamedFile.status) {
                throw new Error("Failed to rename the file.");
            }
            const fileBuffer = await this.imageBuffer();
            if (!fileBuffer.status) {
                throw new Error("Failed to read the file buffer.");
            }
            const fileName = renamedFile.fileName;
            const imageBuffer = fileBuffer.imageBuffer;
            const content = imageBuffer.toString("base64");
            const filePath = `file/${fileName}`;
            const response = await octokit.rest.repos.createOrUpdateFileContents({
                owner: `${process.env.GITHUB_USERNAME}`,
                repo: "public-uploads",
                path: filePath,
                message: `Upload ${fileName} file`,
                content,
                branch: "main",
              });
            const githubURL = `https://raw.githubusercontent.com/${this.githubUsername}/public-uploads/main/${filePath}`;
            const cdnURL ="https://cdn.irfanks.site/api/file/" + githubURL.toString().split("/")[githubURL.toString().split("/").length - 1];
            // send github url to owner dm
            const userId = config.ownerId[0];
            const user = await this.client.users.fetch(userId);
            const embed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle("Cron JOB - Github Upload")
                .setURL(cdnURL)
                .setDescription(`New image uploaded: [Click here](${cdnURL})`)
                .setTimestamp()
                .setFooter({ text: "Github Commit Stream" });
            await user.send({ embeds: [embed] });
            console.log("GITHUB CRON STATUS : SUCCESS", cdnURL);
            return {status : true, githubURL: cdnURL};
        } catch (error) {
            console.error("GITHUB CRON STATUS : FAILED");
            console.error("Error in startCommit:", error);
            return {status : false, error: error};
        }
    }
}

export default GithubCron;