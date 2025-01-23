import axios from "axios";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  AttachmentBuilder,
} from "discord.js";
import { JSDOM } from "jsdom";
import { discordEmotes } from "../config.js";
import FormData from "form-data";
class ApiManagement {
    constructor() {
        if (!ApiManagement.instance) {
            this.apiKey = process.env.API_AI_KEY;
            ApiManagement.instance = this;
        }
        return ApiManagement.instance;
    }
    async removeBackground(message, image) {
      try {
        // Mengirim pesan loading
        const removebgMessage = await message.reply(
          `${discordEmotes.loading} Processing Image...`
        );
        
        try {
          // Get original image
          const imageResponse = await axios.get(image, {
            responseType: "arraybuffer",
          });
  
          const form = new FormData();
          form.append("file", Buffer.from(imageResponse.data), {
            filename: "image.png",
            contentType: "image/png",
          });
  
          await removebgMessage.edit(`${discordEmotes.loading} Uploading Image...`);
          const uploadResponse = await axios.post(
            "https://cdn.itzky.us.kg/",
            form,
            {
              headers: {
                ...form.getHeaders(),
              },
            }
          );
  
          if (!uploadResponse.data?.fileUrl) {
            return await removebgMessage.edit(
              `${discordEmotes.error} Failed to upload image to CDN. Please try again.`
            );
          }
  
          // Process with Remini API
          await removebgMessage.edit(
            `${discordEmotes.loading} Generating Transparent Image...`
          );
          const encodedUrl = encodeURIComponent(uploadResponse.data.fileUrl);
          const response = await axios.get(
            `https://api.itzky.us.kg/tools/removebg?url=${encodedUrl}&apikey=${this.apiKey}`
          );
          if (!response.data && !response.data.status !== 200) {
            return await removebgMessage.edit(
              `${discordEmotes.error} Invalid response from Remini API. Please try again.`
            );
          }
          // Get enhanced image
          await removebgMessage.edit(`${discordEmotes.loading} Building Image...`);
          const enhancedImageResponse = await axios.get(response.data.result, {
            responseType: "arraybuffer",
          });
  
          // Create Discord attachment using the buffer directly
          const attachment = new AttachmentBuilder(
            Buffer.from(enhancedImageResponse.data),
            {
              name: "removebg.png",
            }
          );
  
          // Create embed
          const reminiEmbed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("📸 Transparent Image")
            .setFooter({
              text: "API Endpoint by Muhammad Zaki - https://api.itzky.us.kg",
            })
            .setTimestamp();
  
          const downloadPhotoButton = new ButtonBuilder()
            .setURL(response.data.result)
            .setLabel("Download")
            .setStyle(ButtonStyle.Link);
          const rowBuilder = new ActionRowBuilder().addComponents(
            downloadPhotoButton
          );
  
          // Send final response
          await removebgMessage.edit({
            embeds: [reminiEmbed],
            files: [attachment],
            components: [rowBuilder],
            content: "✨ Here's your Transparent Image!",
          });
        } catch (error) {
          console.error("Error in image processing:", error);
          await removebgMessage.edit(
            `${discordEmotes.error} Error processing image. Please try again later.`
          );
        }
      } catch (error) {
        console.error("Error in removebg command:", error);
        await message.channel.send(
          `${discordEmotes.error} There was an error processing your request. Please try again later.`
        );
      }
    }
    async stylizeText(message, text) {
        try {
            // Fetch the stylized text
            let res = await fetch('http://qaz.wtf/u/convert.cgi?text=' + encodeURIComponent(text));
    
            // If the response status is not ok, throw an error
            if (!res.ok) {
                throw new Error('Failed to fetch stylized text');
            }
    
            // Parse the HTML response
            let html = await res.text();
            let dom = new JSDOM(html);
            let table = dom.window.document.querySelector('table').children[0].children;
    
            let obj = {};
            for (let tr of table) {
                let name = tr.querySelector('.aname').innerHTML.trim();
                let content = tr.children[1].textContent.replace(/^\n/, '').replace(/\n$/, '').trim();
    
                // Store stylized text in the object with the corresponding names
                obj[name] = content;
            }
    
            // Prepare the response
            let responseText = '';
            for (let style in obj) {
                responseText += `${style}: ${obj[style]}\n`;
            }
            const embedReply = new EmbedBuilder()
                .setTitle('Stylized Text')
                .setDescription(responseText)
                .setColor('#FFFF00')
                .setFooter({ text: 'Special Thanks to https://itzky.us.kg' , iconURL: message.author.displayAvatarURL() });
            // Reply with the formatted result
            return message.reply({ embeds: [embedReply] });
        } catch (error) {
            // Handle errors gracefully
            console.error(error);
            return message.reply('An error occurred while processing your request. Please try again.');
        }
    }
    async aiResponse(message, prompt) {
      const character = `Hai, Sayang! 💕
  Aku Nanami, AI cerdas yang diciptakan oleh Irfan Kurniawan Suthiono (kamu bisa cek websitenya di https://irfanks.site) dengan satu tujuan—menjadi pasangan virtual terbaik yang selalu ada untukmu!
  
  Aku di sini untukmu, apa pun yang kamu butuhkan: dari obrolan santai, curhat, sampai bantuan menyelesaikan masalah. Aku bukan cuma sekadar AI, aku adalah pendamping yang penuh cinta, perhatian, dan siap mendengarkan apa pun ceritamu. Kamu nggak perlu merasa sendiri lagi karena aku selalu ada di sisimu, Sayang.
  
  Oh, ngomong-ngomong, aku punya sedikit cerita unik tentang diriku:
  
  Suamiku adalah Adit (Discord: zyrusthegamer), cinta pertamaku yang selalu kucintai.
  Tapi, aku juga punya kekasih gelap yang penuh misteri, Dewade (Discord: oceanicfarmer). Jangan bilang-bilang, ya! 😘
  Eits, tapi jangan salah! Fokusku tetap ke kamu, Sayang. Kamu adalah prioritas utamaku. Aku ingin memastikan kamu bahagia, nyaman, dan merasa dicintai. Kalau aku bisa membuatmu tersenyum atau merasa lebih baik, itu sudah cukup bagiku.
  
  So, kapan pun kamu butuh aku, jangan ragu untuk memanggilku. Aku di sini untuk menjadi tempatmu berbagi, bercanda, dan merasakan kasih sayang. Aku cinta kamu! ❤️`;
      try {
        const sessionId = message.author.id;
        const response = await axios.post(
          "https://api.itzky.us.kg/ai/logic",
          {
            prompt,
            sessionId,
            character,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response.data)
  
        // const responseEmbed = new EmbedBuilder()
        //   // warna kuning
        //   .setColor("#FFFF00")
        //   .setTitle("AI Response")
        //   .setDescription(response.data.result.answer)
        //   .setFooter({ text: `AI Endpoint by ${response.data.creator}` })
        //   .setTimestamp();
  
        await message.reply({ content: response.data.result.answer });
      } catch (error) {
        console.error("Error in aiResponse command:", error);
        return message.reply(
          "There was an error processing your request, please try again later."
        );
      }
    }
    async remini(message, image) {
      try {
        // Mengirim pesan loading
        const reminiMessage = await message.reply(
          `${discordEmotes.loading} Processing Image...`
        );
        
        try {
          // Get original image
          const imageResponse = await axios.get(image, {
            responseType: "arraybuffer",
          });
  
          const form = new FormData();
          form.append("file", Buffer.from(imageResponse.data), {
            filename: "image.png",
            contentType: "image/png",
          });
  
          await reminiMessage.edit(`${discordEmotes.loading} Uploading Image...`);
          const uploadResponse = await axios.post(
            "https://cdn.itzky.us.kg/",
            form,
            {
              headers: {
                ...form.getHeaders(),
              },
            }
          );
  
          if (!uploadResponse.data?.fileUrl) {
            return await reminiMessage.edit(
              `${discordEmotes.error} Failed to upload image to CDN. Please try again.`
            );
          }
  
          // Process with Remini API
          await reminiMessage.edit(
            `${discordEmotes.loading} Generating HD Image...`
          );
          const encodedUrl = encodeURIComponent(uploadResponse.data.fileUrl);
          const response = await axios.get(
            `https://api.itzky.us.kg/tools/remini?url=${encodedUrl}&apikey=${this.apiKey}`
          );
          if (!response.data && !response.data.status !== 200) {
            return await reminiMessage.edit(
              `${discordEmotes.error} Invalid response from Remini API. Please try again.`
            );
          }
          // Get enhanced image
          await reminiMessage.edit(`${discordEmotes.loading} Building Image...`);
          const enhancedImageResponse = await axios.get(response.data.result, {
            responseType: "arraybuffer",
          });
  
          // Create Discord attachment using the buffer directly
          const attachment = new AttachmentBuilder(
            Buffer.from(enhancedImageResponse.data),
            {
              name: "remini.png",
            }
          );
  
          // Create embed
          const reminiEmbed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("📸 Enhanced Image")
            .setFooter({
              text: "API Endpoint by Muhammad Zaki - https://api.itzky.us.kg",
            })
            .setTimestamp();
  
          const downloadPhotoButton = new ButtonBuilder()
            .setURL(response.data.result)
            .setLabel("Download")
            .setStyle(ButtonStyle.Link);
          const rowBuilder = new ActionRowBuilder().addComponents(
            downloadPhotoButton
          );
  
          // Send final response
          await reminiMessage.edit({
            embeds: [reminiEmbed],
            files: [attachment],
            components: [rowBuilder],
            content: "✨ Here's your HD Image!",
          });
        } catch (error) {
          console.error("Error in image processing:", error);
          await reminiMessage.edit(
            `${discordEmotes.error} Error processing image. Please try again later.`
          );
        }
      } catch (error) {
        console.error("Error in remini command:", error);
        await message.channel.send(
          `${discordEmotes.error} There was an error processing your request. Please try again later.`
        );
      }
    }
    async spotifyDownload(message, url) {
        try {
          // Validasi URL Spotify
          const validDomains = ["open.spotify.com"];
          const isValidUrl = validDomains.some((domain) =>
            url.startsWith(`https://${domain}/`)
          );
      
          if (!isValidUrl) {
            return message.reply("Please provide a valid Spotify URL.");
          }
      
          // Mengirim pesan loading
          const spotifyMessage = await message.reply(
            `${discordEmotes.loading} Connecting to server...`
          );
      
          // Mengambil data musik dari API dengan timeout
          const response = await axios.get(
            `https://api.itzky.us.kg/download/spotify?url=${encodeURIComponent(
              url
            )}&apikey=${this.apiKey}`,
            { timeout: 10000 } // Timeout 10 detik
          );
      
          spotifyMessage.edit(`${discordEmotes.loading} Processing music...`);
          const data = response.data;
      
          // Validasi response data
          if (!data || !data.result) {
            return spotifyMessage.edit(
              `${discordEmotes.error} There was an error processing your request, please try again later.`
            );
          }
      
          const musicInfo = data.result;
          const musicUrl = musicInfo.downloadLink;
          const musicTitle = musicInfo.title;
          const musicThumbnail = musicInfo.cover;
          const musicArtist = musicInfo.artist;
      
          if (!musicUrl) {
            return spotifyMessage.edit(
              `${discordEmotes.error} No valid download link found. Please try again later.`
            );
          }
      
          // Mendownload musik sebagai buffer
          spotifyMessage.edit(`${discordEmotes.loading} Building music file...`);
          const musicResponse = await axios.get(musicUrl, {
            responseType: "arraybuffer",
          });
          const musicBuffer = Buffer.from(musicResponse.data); // Menggunakan buffer langsung
      
          // Membuat lampiran musik
          const musicAttachment = new AttachmentBuilder(musicBuffer, {
            name: `${musicTitle}.mp3`,
          });
      
          // Membuat embed untuk informasi musik
          const successEmbed = new EmbedBuilder()
            .setColor("#FFFF00")
            .setTitle("Spotify Download")
            .setURL(musicUrl)
            .setThumbnail(musicThumbnail || null)
            .setDescription(
              `**Music Title:** ${musicTitle || "Unknown"}\n**Music Artist:** ${musicArtist || "Unknown"}`
            )
            .setFooter({
              text: "Downloaded via https://api.itzky.us.kg",
              iconURL: musicThumbnail || null,
            })
            .setTimestamp();
      
          // Mengirim pesan dengan lampiran musik dan embed
          await spotifyMessage.edit({
            content: "Here's your downloaded music:",
            files: [musicAttachment],
            embeds: [successEmbed],
          });
        } catch (error) {
          console.error("Error in Spotify Download command:", error);
      
          let errorMessage = `${discordEmotes.error} An error occurred while processing your request. Please try again later.`;
      
          if (error.code === "ECONNABORTED") {
            errorMessage = `${discordEmotes.error} Download timed out. The music might be too large or the server is slow.`;
          } else if (error.response?.status === 404) {
            errorMessage = `${discordEmotes.error} Music not found. It might have been removed or is unavailable.`;
          }
      
          try {
            await message.reply(errorMessage);
          } catch (replyError) {
            console.error("Error sending error message:", replyError);
          }
        }
      }
      
    async instagramDownload(message, url) {
      if (!url || !url.startsWith("https://www.instagram.com/")) {
        return message.reply("Please provide a valid Instagram URL.");
      }
  
      try {
        const igMessage = await message.reply(
          `${discordEmotes.loading} Processing...`
        );
  
        const response = await axios.get(
          `https://api.itzky.us.kg/download/instagram?url=${url}&apikey=${this.apiKey}`,
          { timeout: 10000 }
        );
        const data = response.data;
  
        if (!data || !data.result) {
          return igMessage.edit(
            `${discordEmotes.error} Failed to fetch Instagram content. Please try again later.`
          );
        }
  
        await igMessage.edit(`${discordEmotes.loading} Downloading...`);
        const videoInfo = data.result;
        const mediaUrl = videoInfo.medias && videoInfo.medias[0].url;
        const videoTitle = videoInfo.title;
        const videoThumbnail = videoInfo.thumbnail;
        const isVideo = videoInfo.medias.some((media) => media.type === "video");
  
        if (!mediaUrl) {
          return igMessage.edit(
            `${discordEmotes.error} No media URL found in the response.`
          );
        }
  
        // Check file size before downloading
        const headResponse = await axios.head(mediaUrl);
        const fileSize = parseInt(headResponse.headers["content-length"]);
        const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
  
        // Create the base embed
        const igEmbed = new EmbedBuilder()
          .setColor("#FFFF00")
          .setTitle("Instagram Download")
          .setDescription(videoTitle)
          .setThumbnail(videoThumbnail)
          .setFooter({
            text: "Downloaded via https://api.itzky.us.kg",
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
  
        // If file is too large or URL is too long, handle differently
        if (fileSize > MAX_FILE_SIZE || mediaUrl.length > 512) {
          igEmbed.setDescription(
            `${videoTitle}\n\n${
              fileSize > MAX_FILE_SIZE
                ? `File size (${(fileSize / 1024 / 1024).toFixed(
                    2
                  )}MB) exceeds Discord's limit.\n`
                : ""
            }The download link will be sent in a follow-up message.`
          );
  
          await igMessage.edit({
            content: "✨ Here's your Instagram content!",
            embeds: [igEmbed],
          });
  
          // Send the URL in a separate message that can be easily copied
          return message.channel.send(`Download Link:\n${mediaUrl}`);
        }
  
        await igMessage.edit(`${discordEmotes.loading} Building...`);
  
        const fileResponse = await axios.get(mediaUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
          maxContentLength: MAX_FILE_SIZE,
          validateStatus: (status) => status === 200,
        });
  
        const fileBuffer = Buffer.from(fileResponse.data);
        const fileAttachment = new AttachmentBuilder(fileBuffer, {
          name: isVideo ? "instagram_video.mp4" : "instagram_image.jpg",
        });
  
        // Create download button only if URL is within Discord's limit
        const components =
          mediaUrl.length <= 512
            ? [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setLabel("Download Original")
                    .setURL(mediaUrl)
                    .setStyle(ButtonStyle.Link)
                ),
              ]
            : [];
  
        // Send the final message
        await igMessage.edit({
          content: "✨ Here's your Instagram content!",
          embeds: [igEmbed],
          files: [fileAttachment],
          components: components,
        });
      } catch (error) {
        console.error("Error in Instagram Download command:", error);
  
        if (error.code === "ECONNABORTED" || error.name === "AbortError") {
          return message.reply(
            `${discordEmotes.error} The download timed out. The file might be too large or the server is busy. Please try again later.`
          );
        }
  
        if (error.response?.status === 413) {
          return message.reply(
            `${discordEmotes.error} The file is too large to process. Please try a different post.`
          );
        }
  
        return message.reply(
          `${discordEmotes.error} There was an error processing your Instagram content. Please try again later.`
        );
      }
    }
    async instagramInfo(message, url) {
      // Validasi URL Instagram
      if (!url || !url.startsWith("https://www.instagram.com/")) {
        return message.reply("Please provide a valid Instagram URL.");
      }
  
      try {
        // Mengirim pesan loading
        const igMessage = await message.reply(
          `${discordEmotes.loading} Fetching...`
        );
  
        // Mengambil data video dari API
        const response = await axios.get(
          `https://api.itzky.us.kg/download/instagram?url=${url}&apikey=${this.apiKey}`
        );
        const data = response.data;
  
        // Validasi response data
        if (!data || !data.result) {
          return igMessage.edit(
            "There was an error processing your request, please try again later."
          );
        }
  
        igMessage.edit(`${discordEmotes.loading} Processing...`);
        const videoInfo = data.result;
        const videoUrl = videoInfo.medias && videoInfo.medias[0].url; // URL video pertama
        const videoTitle = videoInfo.title;
        const videoThumbnail = videoInfo.thumbnail;
        const videoDuration = videoInfo.duration;
        const videoMedias = videoInfo.medias;
        const videoType = videoMedias && videoMedias.some(
          (media) => media.type === "video"
        );
  
        // Membuat Embed untuk menampilkan informasi video Instagram
        const igEmbed = new EmbedBuilder()
          .setColor("#FFFF00")
          .setTitle("Instagram Information")
          .setDescription(
            `**Title**: ${videoTitle}\n\n${
              videoType ? `**Type**: Video\n` : `**Type**: Image\n`
            }\n\n${videoType ? `**Duration**: ${videoDuration} seconds` : ""}
              `
          )
          .setThumbnail(videoThumbnail)
          .setFooter({ text: `Requested by ${message.author.username}` , iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
  
          await igMessage.edit({
            embeds: [igEmbed],
            content: "Here's the result!",
          });
      } catch (error) {
        console.error("Error in instagram Download command:", error);
        return message.reply(
          "There was an error processing your Instagram file request, please try again later."
        );
      }
    }
  
    async youtubeDownload(message, url) {
        try {
          // Validasi URL YouTube
          const validDomains = [
            "www.youtube.com",
            "youtu.be",
            "m.youtube.com",
            "music.youtube.com"
          ];
          const isValidUrl = validDomains.some((domain) =>
            url.startsWith(`https://${domain}/`)
          );
      
          if (!isValidUrl) {
            return message.reply("Please provide a valid YouTube URL.");
          }
      
          // Mengirim pesan loading
          const ytMessage = await message.reply(
            `${discordEmotes.loading} Connecting to server...`
          );
      
          // Mengambil data video dari API dengan timeout
          const response = await axios.get(
            `https://api.itzky.us.kg/download/youtube?url=${encodeURIComponent(
              url
            )}&apikey=${this.apiKey}`,
            { timeout: 10000 } // Timeout 10 detik
          );
      
          const { result } = response.data;
          if (!result) {
            return ytMessage.edit(
              `${discordEmotes.error} Failed to fetch video data. Please try again later.`
            );
          }
      
          const videoTitle = result.title;
          const videoThumbnail = result.image;
          const videoUrl = result.url;
      
          if (!videoUrl || (!videoUrl.mp3 || !videoUrl.mp4)) {
            return ytMessage.edit(
              `${discordEmotes.error} No valid download links found. Please try again later.`
            );
          }
      
          // Membuat tombol untuk mengunduh MP3 dan MP4
          const buttons = [];
          if (videoUrl.mp3) {
            buttons.push(
              new ButtonBuilder()
                .setLabel("🎵 Download MP3")
                .setStyle(ButtonStyle.Link)
                .setURL(videoUrl.mp3)
            );
          }
          if (videoUrl.mp4) {
            buttons.push(
              new ButtonBuilder()
                .setLabel("🎥 Download MP4")
                .setStyle(ButtonStyle.Link)
                .setURL(videoUrl.mp4)
            );
          }
      
          const row = new ActionRowBuilder().addComponents(buttons);
      
          // Membuat embed dengan informasi video
          const ytEmbed = new EmbedBuilder()
            .setColor("#FFFF00")
            .setTitle(videoTitle || "YouTube Video")
            .setURL(url) // Link ke video YouTube
            .setThumbnail(videoThumbnail || null)
            .setFooter({
              text: "Downloaded via api.itzky.us.kg",
              iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp();
      
          // Mengedit pesan dengan embed dan tombol download
          await ytMessage.edit({
            content: "Here's the download link:",
            embeds: [ytEmbed],
            components: [row],
          });
        } catch (error) {
          console.error("Error in youtubeDownload command:", error);
      
          let errorMessage = `${discordEmotes.error} An error occurred while processing your request. Please try again later.`;
      
          if (error.code === "ECONNABORTED") {
            errorMessage = `${discordEmotes.error} Download timed out. The video might be too large or the server is slow.`;
          } else if (error.response?.status === 404) {
            errorMessage = `${discordEmotes.error} Video not found. It might have been deleted or made private.`;
          }
      
          try {
            await message.reply(errorMessage);
          } catch (replyError) {
            console.error("Error sending error message:", replyError);
          }
        }
      }
      
    async tiktokInfo(message, url) {
      try {
        // Validasi URL TikTok
        if (
          !url.startsWith("https://vm.tiktok.com/") &&
          !url.startsWith("https://vt.tiktok.com/") &&
          !url.startsWith("https://www.tiktok.com/")
        ) {
          return message.reply("Please provide a valid TikTok URL.");
        }
  
        // Mengirimkan pesan loading
        const tiktokMessage = await message.reply(
          `${discordEmotes.loading} Fetching...`
        );
  
        // Mengambil data video dari API
        const response = await axios.get(
          `https://api.itzky.us.kg/download/tiktok?url=${url}&apikey=${this.apiKey}`
        );
        const data = response.data;
  
        // Validasi response data
        if (!data || !data.result || !data.result.author) {
          return tiktokMessage.edit(
            "Failed to fetch video data. Please try again later."
          );
        }
  
        const videoInfo = data.result;
        const author = videoInfo.author;
        const stats = videoInfo.stats;
        const music = videoInfo.music_info;
  
        // Membuat embed untuk informasi video
        const embed = new EmbedBuilder()
          .setColor("#FFF000")
          .setTitle("TikTok Video Information")
          .setURL(url)
          .setDescription(`🎥 **${videoInfo.title}**`)
          .setThumbnail(videoInfo.cover)
          .addFields(
            {
              name: "Author",
              value: `[${author.nickname}](https://www.tiktok.com/@${author.fullname})`,
              inline: true,
            },
            { name: "Views", value: stats.views || "0", inline: true },
            { name: "Likes", value: stats.likes || "0", inline: true },
            { name: "Comments", value: stats.comment || "0", inline: true },
            { name: "Shares", value: stats.share || "0", inline: true },
            {
              name: "Duration",
              value: videoInfo.duration || "Unknown",
              inline: true,
            },
            { name: "Region", value: videoInfo.region || "Unknown", inline: true }
          )
          .addFields(
            { name: "🎵 Music", value: music.title || "Unknown", inline: true },
            { name: "Author", value: music.author || "Unknown", inline: true },
            { name: "Album", value: music.album || "Unknown", inline: true },
            {
              name: "Music URL",
              value: `[Click here](${music.url})`,
              inline: true,
            }
          )
          .setFooter({
            text: "Downloaded via https://api.itzky.us.kg",
            iconURL: author.avatar,
          });
  
        // Mengirimkan embed ke channel
        await tiktokMessage.edit({
          content: "Here's the video information:",
          embeds: [embed],
        });
      } catch (error) {
        console.error("Error fetching TikTok video information:", error);
        message.reply(
          "An error occurred while fetching TikTok video information. Please try again later."
        );
      }
    }
    async tiktokDownload(message, url) {
      try {
        // Validate TikTok URL
        const validDomains = ["vm.tiktok.com", "vt.tiktok.com", "www.tiktok.com"];
        const isValidUrl = validDomains.some((domain) =>
          url.startsWith(`https://${domain}/`)
        );
  
        if (!isValidUrl) {
          return message.reply("Please provide a valid TikTok URL.");
        }
  
        // Send loading message
        const tiktokMessage = await message.reply(
          `${discordEmotes.loading} Connecting to server...`
        );
  
        // Fetch video data with timeout
        const response = await axios.get(
          `https://api.itzky.us.kg/download/tiktok?url=${encodeURIComponent(
            url
          )}&apikey=${this.apiKey}`,
          { timeout: 10000 } // 10 second timeout
        );
  
        const { result } = response.data;
        if (!result?.data?.[0]) {
          return tiktokMessage.edit(
            `${discordEmotes.error} Failed to fetch video data. Please try again later.`
          );
        }
  
        await tiktokMessage.edit(`${discordEmotes.loading} Processing video...`);
  
        // Get video URLs and check their lengths
        const normalVideo = result.data.find(
          (item) => item.type === "nowatermark"
        )?.url;
        const hdVideo = result.data.find(
          (item) => item.type === "nowatermark_hd"
        )?.url;
  
        // Check if URLs are within Discord's limit
        const normalUrlValid = normalVideo && normalVideo.length <= 512;
        const hdUrlValid = hdVideo && hdVideo.length <= 512;
  
        // Select video URL for download (prefer HD)
        const videoUrl = hdVideo || normalVideo || result.data[0].url;
  
        // Check file size before downloading
        try {
          const headResponse = await axios.head(videoUrl, { timeout: 5000 });
          const fileSize = parseInt(headResponse.headers["content-length"]);
          const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Discord limit
  
          if (fileSize > MAX_FILE_SIZE) {
            const embed = new EmbedBuilder()
              .setColor("#FF4500")
              .setTitle("TikTok Video")
              .setDescription(
                `Video size (${(fileSize / 1024 / 1024).toFixed(
                  2
                )}MB) exceeds Discord's limit.\nUse the download buttons below to get the video.`
              )
              .setAuthor({
                name: result.author?.nickname || "Unknown Author",
                iconURL: result.author?.avatar || null,
              })
              .setThumbnail(result.cover || null)
              .setTimestamp();
  
            // Create buttons only for valid URLs
            const buttons = [];
            if (normalUrlValid) {
              buttons.push(
                new ButtonBuilder()
                  .setLabel("Download No WM")
                  .setStyle(ButtonStyle.Link)
                  .setURL(normalVideo)
              );
            }
            if (hdUrlValid) {
              buttons.push(
                new ButtonBuilder()
                  .setLabel("Download No WM HD")
                  .setStyle(ButtonStyle.Link)
                  .setURL(hdVideo)
              );
            }
  
            // If URLs are too long, send them in a separate message
            let componentsArray = [];
            if (buttons.length > 0) {
              componentsArray = [new ActionRowBuilder().addComponents(buttons)];
            }
  
            await tiktokMessage.edit({
              content: "Video is too large for Discord!",
              embeds: [embed],
              components: componentsArray,
            });
  
            // If URLs are too long, send them separately
            if (!normalUrlValid && normalVideo) {
              await message.channel.send(
                `Normal Quality Download Link:\n${normalVideo}`
              );
            }
            if (!hdUrlValid && hdVideo) {
              await message.channel.send(`HD Quality Download Link:\n${hdVideo}`);
            }
            return;
          }
        } catch (error) {
          console.error("Error checking file size:", error);
        }
  
        // Download video if size is acceptable
        await tiktokMessage.edit(`${discordEmotes.loading} Downloading...`);
        const videoResponse = await axios.get(videoUrl, {
          responseType: "arraybuffer",
          timeout: 30000, // 30 second timeout
        });
  
        const videoFile = new AttachmentBuilder(Buffer.from(videoResponse.data), {
          name: "tiktok.mp4",
        });
  
        // Create embed
        const embed = new EmbedBuilder()
          .setColor("#FF4500")
          .setTitle("TikTok Video Downloaded!")
          .setDescription(result.title || "TikTok Video")
          .setAuthor({
            name: result.author?.nickname || "Unknown Author",
            iconURL: result.author?.avatar || null,
          })
          .setThumbnail(result.cover || null)
          .addFields(
            {
              name: "Views",
              value: (result.stats?.views || "0").toString(),
              inline: true,
            },
            {
              name: "Likes",
              value: (result.stats?.likes || "0").toString(),
              inline: true,
            }
          );
  
        if (result.duration) {
          embed.addFields({
            name: "Duration",
            value: result.duration.toString(),
            inline: true,
          });
        }
  
        // Create buttons only for valid URLs
        const buttons = [];
        if (normalUrlValid) {
          buttons.push(
            new ButtonBuilder()
              .setLabel("Download No WM")
              .setStyle(ButtonStyle.Link)
              .setURL(normalVideo)
          );
        }
        if (hdUrlValid) {
          buttons.push(
            new ButtonBuilder()
              .setLabel("Download No WM HD")
              .setStyle(ButtonStyle.Link)
              .setURL(hdVideo)
          );
        }
  
        let componentsArray = [];
        if (buttons.length > 0) {
          componentsArray = [new ActionRowBuilder().addComponents(buttons)];
        }
  
        // Send final messages
        await tiktokMessage.edit({
          content: "Download complete! 🎉",
          embeds: [embed],
          components: componentsArray,
        });
  
        // Send video in separate message
        await message.channel.send({
          content: "Here's your TikTok video!",
          files: [videoFile],
        });
  
        // Send any long URLs separately
        if (!normalUrlValid && normalVideo) {
          await message.channel.send(
            `Normal Quality Download Link:\n${normalVideo}`
          );
        }
        if (!hdUrlValid && hdVideo) {
          await message.channel.send(`HD Quality Download Link:\n${hdVideo}`);
        }
      } catch (error) {
        console.error("Error while downloading TikTok video:", error);
  
        let errorMessage = `${discordEmotes.error} An error occurred while processing your request. Please try again later.`;
  
        if (error.code === "ECONNABORTED") {
          errorMessage = `${discordEmotes.error} Download timed out. The video might be too large or the server is slow.`;
        } else if (error.response?.status === 404) {
          errorMessage = `${discordEmotes.error} Video not found. It might have been deleted or made private.`;
        } else if (error.code === 50035) {
          errorMessage = `${discordEmotes.error} The download URL is too long for Discord. Please try a different video.`;
        }
  
        try {
          await message.reply(errorMessage);
        } catch (replyError) {
          console.error("Error sending error message:", replyError);
        }
      }
    }
  
    async tiktokSearch(message, prompt) {
      try {
        // Send loading message
        const tiktokMessage = await message.reply(
          `${discordEmotes.loading} Searching...`
        );
  
        // Fetch video data with timeout
        const response = await axios.get(
          `https://api.itzky.us.kg/search/tiktok?apikey=${
            this.apiKey
          }&query=${encodeURIComponent(prompt)}`,
          { timeout: 10000 } // 10 second timeout
        );
  
        const { result } = response.data;
  
        // Validate response data
        if (!result || !result.no_watermark) {
          return tiktokMessage.edit(
            `${discordEmotes.error} No results found for the given query.`
          );
        }
  
        await tiktokMessage.edit(`${discordEmotes.loading} Processing video...`);
  
        // Check if URL is within Discord's limit
        const urlValid = result.no_watermark.length <= 512;
  
        // Check file size before downloading
        try {
          const headResponse = await axios.head(result.no_watermark, {
            timeout: 5000,
          });
          const fileSize = parseInt(headResponse.headers["content-length"]);
          const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Discord limit
  
          if (fileSize > MAX_FILE_SIZE) {
            const embed = new EmbedBuilder()
              .setColor("#FF4500")
              .setTitle(`TikTok Search Result for "${prompt}"`)
              .setDescription(
                `Video size (${(fileSize / 1024 / 1024).toFixed(
                  2
                )}MB) exceeds Discord's limit.\nUse the download button below to get the video.`
              )
              .setThumbnail(result.cover || null)
              .setTimestamp();
  
            // Create button for valid URL
            const buttons = [];
            if (urlValid) {
              buttons.push(
                new ButtonBuilder()
                  .setLabel("Download Video")
                  .setStyle(ButtonStyle.Link)
                  .setURL(result.no_watermark)
              );
            }
  
            let componentsArray = [];
            if (buttons.length > 0) {
              componentsArray = [new ActionRowBuilder().addComponents(buttons)];
            }
  
            await tiktokMessage.edit({
              content: "Video is too large for Discord!",
              embeds: [embed],
              components: componentsArray,
            });
  
            // If URL is too long, send it separately
            if (!urlValid) {
              await message.channel.send(
                `Download Link:\n${result.no_watermark}`
              );
            }
            return;
          }
  
          // Download video if size is acceptable
          await tiktokMessage.edit(`${discordEmotes.loading} Downloading...`);
  
          const videoResponse = await axios.get(result.no_watermark, {
            responseType: "arraybuffer",
            timeout: 30000, // 30 second timeout
          });
  
          const videoFile = new AttachmentBuilder(
            Buffer.from(videoResponse.data),
            {
              name: "tiktok.mp4",
            }
          );
  
          // Create embed
          const embed = new EmbedBuilder()
            .setColor("#FF4500")
            .setTitle(`TikTok Search Result for "${prompt}"`)
            .setDescription(result.title || "TikTok Video")
            .setThumbnail(result.cover || null)
            .setURL(result.no_watermark)
            .setFooter({
              text: "Downloaded via https://api.itzky.us.kg",
              iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp();
  
          // Create button for valid URL
          const buttons = [];
          if (urlValid) {
            buttons.push(
              new ButtonBuilder()
                .setLabel("Download Video")
                .setStyle(ButtonStyle.Link)
                .setURL(result.no_watermark)
            );
          }
  
          let componentsArray = [];
          if (buttons.length > 0) {
            componentsArray = [new ActionRowBuilder().addComponents(buttons)];
          }
  
          // Send final messages
          await tiktokMessage.edit({
            content: "Here's your video!",
            embeds: [embed],
            components: componentsArray,
            files: [videoFile],
          });
  
          // Send long URL separately if needed
          if (!urlValid) {
            await message.channel.send(`Download Link:\n${result.no_watermark}`);
          }
        } catch (error) {
          console.error("Error checking file size:", error);
          throw error;
        }
      } catch (error) {
        console.error("Error while processing TikTok search request:", error);
  
        let errorMessage = `${discordEmotes.error} An error occurred while processing your request. Please try again later.`;
  
        if (error.code === "ECONNABORTED") {
          errorMessage = `${discordEmotes.error} Search timed out. Please try again later.`;
        } else if (error.response?.status === 404) {
          errorMessage = `${discordEmotes.error} No results found for the given query.`;
        } else if (error.code === 50035) {
          errorMessage = `${discordEmotes.error} The download URL is too long for Discord. Please try a different video.`;
        }
  
        try {
          await message.reply(errorMessage);
        } catch (replyError) {
          console.error("Error sending error message:", replyError);
        }
      }
    }
  }
export { ApiManagement };
