import axios from "axios";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  AttachmentBuilder,
} from "discord.js";
import { JSDOM } from "jsdom";
import { config, discordEmotes } from "../config.js";
import FormData from "form-data";
const API_URL = "https://api.itzky.xyz";
const ALVIAN_API_URL = "https://api.alvianuxio.eu.org/api"
const KRIZZ_API_URL = "https://free-apiz.vercel.app";
class ApiManagement {
  constructor() {
    if (!ApiManagement.instance) {
      this.apiKey = config.apiKey;
      this.alvianApiKey = config.alvianApiKey;
      this.krizzApiKey = config.krizzApiKey;
      ApiManagement.instance = this;
    }
    return ApiManagement.instance;
  }
  // KRIZZ
  async generateLoli(message) {
    try {
      // Mengirim pesan loading
      const generateImageMessage = await message.reply(
        {content: `${discordEmotes.loading} Generating Image...`, ephemeral: true}
      );
  
      // Fetch dari API dengan responseType arraybuffer
      const response = await axios.get(`${KRIZZ_API_URL}/random/loli`, {
        responseType: "arraybuffer", // Untuk menerima gambar dalam bentuk buffer
      });
  
      if (response.status !== 200) {
        return await generateImageMessage.edit(
          {content: `${discordEmotes.error} Invalid response from Image Generator API. Please try again.`, ephemeral: true}
        );
      }
  
      await generateImageMessage.edit({content: `${discordEmotes.loading} Building Image...`, ephemeral: true});
  
      // Buat buffer dari arraybuffer
      const imageBuffer = Buffer.from(response.data);
  
      // Buat attachment untuk dikirim di Discord
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "loli.png",
      });
  
      // Buat embed
      const embed = new EmbedBuilder()
        .setTitle("Loli Generated")
        .setColor("#00FF00")
        .setImage("attachment://loli.png")
        .setFooter({ text: "Special Thanks to krizz API" })
        .setTimestamp();
  
      // Kirim pesan dengan embed dan file gambar
      await generateImageMessage.edit({content: "Here's a random loli ❤️‍🔥", embeds: [embed], files: [attachment],  ephemeral:true });
  
    } catch (error) {
      console.error("Error generating image:", error);
      await message.reply(
        {content:`${discordEmotes.error} Error generating image. Please try again.`, ephemeral: true}
      );
    }
  }
  async generateUkhty(message) {
    try {
      // Mengirim pesan loading
      const generateImageMessage = await message.reply(
        {content:`${discordEmotes.loading} Getting Image...`, ephemeral: true}
      );
  
      // Fetch dari API dengan responseType arraybuffer
      const response = await axios.get(`${KRIZZ_API_URL}/random/ukhty`, {
        responseType: "arraybuffer", // Untuk menerima gambar dalam bentuk buffer
      });
  
      if (response.status !== 200) {
        return await generateImageMessage.edit(
          {content :`${discordEmotes.error} Invalid response from Image Generator API. Please try again.`, ephemeral: true}
        );
      }
  
      await generateImageMessage.edit({content :`${discordEmotes.loading} Building Image...`, ephemeral: true});
  
      // Buat buffer dari arraybuffer
      const imageBuffer = Buffer.from(response.data);
  
      // Buat attachment untuk dikirim di Discord
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "ukhty.png",
      });
  
      // Buat embed
      const embed = new EmbedBuilder()
        .setTitle("Got Ukhty")
        .setColor("#00FF00")
        .setImage("attachment://ukhty.png")
        .setFooter({ text: "Special Thanks to krizz API" })
        .setTimestamp();
  
      // Kirim pesan dengan embed dan file gambar
      await generateImageMessage.edit({content: "Ukhty ❤️‍🔥", embeds: [embed], files: [attachment],  ephemeral:true });
  
    } catch (error) {
      console.error("Error generating image:", error);
      await message.reply(
        {content :`${discordEmotes.error} Error generating image. Please try again.`, ephemeral: true}
      );
    }
  }
  async transcribeYT(message, url) {
    try {
      // checkling youtube url 
      const validDomains = [
        "www.youtube.com",
        "youtube.com",
        "www.youtu.be",
        "youtu.be",
      ]
      if (!validDomains.some(domain => url.includes(domain))) {
        return await message.reply(
          {content :`${discordEmotes.error} Invalid YouTube URL. Please provide a valid YouTube video URL.`, ephemeral: true}
        );
      }
      // Mengirim pesan loading
      const transcribeMessage = await message.reply(
        {content :`${discordEmotes.loading} Transcribing...`, ephemeral: true}
      );
  
      // Fetch dari API
      const response = await axios.get(`${KRIZZ_API_URL}/tools/transyt?url=${encodeURI(url)}`);
      // Validasi respons API
      if (response.status !== 200 || !response.data || !response.data.result) {
        return await transcribeMessage.edit(
         {content : `${discordEmotes.error} Invalid response from Transcription API. Please try again.`, ephemeral: true}
        );
      }
  
      const { summarize } = response.data.result;
  
      // Pastikan summarize ada dan merupakan string
      if (!summarize || typeof summarize !== "string") {
        return await transcribeMessage.edit(
          {content :`${discordEmotes.error} Failed to retrieve transcription summary.`, ephemeral: true}
        );
      }
  
      await transcribeMessage.edit({content :`${discordEmotes.loading} Building Text...`, ephemeral: true});
  
      // Buat embed
      const embed = new EmbedBuilder()
        .setTitle("Transcription Result")
        .setColor("#00FF00")
        .setDescription(summarize)
        .setFooter({ text: "Special Thanks to krizz API" })
        .setTimestamp();
  
      // Kirim pesan dengan embed
      await transcribeMessage.edit({ embeds: [embed], ephemeral: true });
  
    } catch (error) {
      console.error("Error transcribing YT video:", error);
      await message.reply(
        {content :`${discordEmotes.error} Error transcribing YT video. Please try again.`, ephemeral: true}
      );
    }
  }
  
  async generateWaifu(message) {
    try {
      // Mengirim pesan loading
      const generateImageMessage = await message.reply(
        {content :`${discordEmotes.loading} Generating Image...`, ephemeral: true}
      );
  
      // Fetch dari API dengan responseType arraybuffer
      const response = await axios.get(`${KRIZZ_API_URL}/random/waifu`, {
        responseType: "arraybuffer", // Untuk menerima gambar dalam bentuk buffer
      });
  
      if (response.status !== 200) {
        return await generateImageMessage.edit(
          {content :`${discordEmotes.error} Invalid response from Image Generator API. Please try again.`, ephemeral: true}
        );
      }
  
      await generateImageMessage.edit({content :`${discordEmotes.loading} Building Image...`, ephemeral: true});
  
      // Buat buffer dari arraybuffer
      const imageBuffer = Buffer.from(response.data);
  
      // Buat attachment untuk dikirim di Discord
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "waifu.png",
      });
  
      // Buat embed
      const embed = new EmbedBuilder()
        .setTitle("Waifu Successfully Generated")
        .setColor("#00FF00")
        .setImage("attachment://waifu.png")
        .setFooter({ text: "Special Thanks to krizz API" })
        .setTimestamp();
  
      // Kirim pesan dengan embed dan file gambar
      await generateImageMessage.edit({content: "Here's a random waifu ❤️‍🔥", embeds: [embed], files: [attachment],  ephemeral:true });
  
    } catch (error) {
      console.error("Error generating image:", error);
      await message.reply(
        {content :`${discordEmotes.error} Error generating image. Please try again.`, ephemeral: true}
      );
    }
  }
  // ITZKY
  async generateImage(message, prompt) {
    try {
      // Mengirim pesan loading
      const generateImageMessage = await message.reply(
        {content :`${discordEmotes.loading} Generating Image...`, ephemeral: true}
      );
      const response = await axios.get(
        `${API_URL}/ai/flux?prompt=${prompt}&apikey=${this.apiKey}`
      );
      if (!response.data && !response.data.status !== 200) {
        return await generateImageMessage.edit(
          `${discordEmotes.error} Invalid response from Image Generator API. Please try again.`
        );
      }
      await generateImageMessage.edit(
        {content:`${discordEmotes.loading} Building Image...`, ephemeral: true}
      );
      // get buffer image
      const imageResponse = await axios.get(response.data.result.url, {
        responseType: "arraybuffer",
      });
      const imageBuffer = Buffer.from(imageResponse.data, "base64");
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "image.png",
      });
      const generatedPrompt = prompt;
      const embed = new EmbedBuilder()
        .setTitle("Image Generated")
        .setColor("#00FF00")
        .setDescription(`Prompt: ${generatedPrompt}`)
        .setImage("attachment://image.png")
        .setFooter({
          text: `Special Thanks to https://itzky.us.kg`,
          iconURL: message.author.displayAvatarURL(),
        });
      await generateImageMessage.edit({
        embeds: [embed],
        files: [attachment],
        ephemeral: true,
        content: `${discordEmotes.success} Image generated successfully!`,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      await generateImageMessage.edit(
        {content :`${discordEmotes.error} Error generating image. Please try again.`, ephemeral: true}
      );
    }
  }
  // async generateAnime(message, prompt) {
  //   try {
  //     // Mengirim pesan loading
  //     const generateImageMessage = await message.reply(
  //       {content:`${discordEmotes.loading} Generating Image...`, ephemeral: true}
  //     );

  //     const response = await axios.get(
  //       `${API_URL}/ai/animagine?prompt=${prompt}&apikey=${this.apiKey}`
  //     );
  //     if (!response.data && !response.data.status !== 200) {
  //       return await generateImageMessage.edit(
  //         {content :`${discordEmotes.error} Invalid response from Image Generator API. Please try again.`, ephemeral: true}
  //       );
  //     }
  //     await generateImageMessage.edit(
  //       {content :`${discordEmotes.loading} Building Image...`, ephemeral: true}
  //     );
  //     // get buffer image
  //     const imageResponse = await axios.get(response.data.result.images[0], {
  //       responseType: "arraybuffer",
  //     });
  //     const imageBuffer = Buffer.from(imageResponse.data, "base64");
  //     const attachment = new AttachmentBuilder(imageBuffer, {
  //       name: "image.png",
  //     });
  //     const generatedPrompt = response.data.result.metadata.prompt;
  //     const embed = new EmbedBuilder()
  //       .setTitle("Image Generated")
  //       .setDescription(`Prompt: ${generatedPrompt}`)
  //       .setImage("attachment://image.png")
  //       .setColor("#FFD700")
  //       .setFooter({
  //         text: `Special Thanks to https://itzky.us.kg`,
  //         iconURL: message.author.displayAvatarURL(),
  //       });
  //     await generateImageMessage.edit({
  //       embeds: [embed],
  //       files: [attachment],
  //       ephemeral: true,
  //       content: `${discordEmotes.success} Image generated successfully!`,
  //     });
  //   } catch (error) {
  //     console.error("Error generating image:", error);
  //     await message.reply(
  //       {content : `${discordEmotes.error} An error occurred while generating the image. Please try again.`, ephemeral: true}
  //     );
  //   }
  // }
  async removeBackground(message, image) {
    try {
      // Mengirim pesan loading
      const removebgMessage = await message.reply(
        {content :`${discordEmotes.loading} Processing Image...` , ephemeral: true}
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

        await removebgMessage.edit(
         {content: `${discordEmotes.loading} Uploading Image...`, ephemeral: true}
        );
        const uploadResponse = await axios.post(
          "https://cdn.itzky.xyz/",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );
        console.log(uploadResponse.data)
        if (!uploadResponse.data?.fileUrl) {
          return await removebgMessage.edit(
            {content: `${discordEmotes.error} Failed to upload image to CDN. Please try again.`, ephemeral: true}
          );
        }

        // Process with Remini API
        await removebgMessage.edit(
          {content:`${discordEmotes.loading} Generating Transparent Image...`, ephemeral: true}
        );
        const encodedUrl = encodeURIComponent(uploadResponse.data.fileUrl);
        const response = await axios.get(
          `${API_URL}/tools/removebg?url=${encodedUrl}&apikey=${this.apiKey}`
        );
        console.log(response.data)
        if (!response.data && !response.data.status !== 200) {
          return await removebgMessage.edit(
            {content: `${discordEmotes.error} Invalid response from Remini API. Please try again.`, ephemeral: true}
          );
        }
        // Get enhanced image
        await removebgMessage.edit(
          {content:`${discordEmotes.loading} Building Image...`,ephemeral: true}
        );
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
            text: "Special Thanks to Itzky API",
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
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error in image processing:", error);
        await removebgMessage.edit(
          {content : `${discordEmotes.error} Error processing image. Please try again later.`, ephemeral: true}
        );
      }
    } catch (error) {
      console.error("Error in removebg command:", error);
      await message.channel.send(
        {content:`${discordEmotes.error} There was an error processing your request. Please try again later.`, ephemeral: true}
      );
    }
  }
  async stylizeText(message, text) {
    try {
      // Fetch the stylized text
      let res = await fetch(
        "http://qaz.wtf/u/convert.cgi?text=" + encodeURIComponent(text)
      );

      // If the response status is not ok, throw an error
      if (!res.ok) {
        throw new Error("Failed to fetch stylized text");
      }

      // Parse the HTML response
      let html = await res.text();
      let dom = new JSDOM(html);
      let table =
        dom.window.document.querySelector("table").children[0].children;

      let obj = {};
      for (let tr of table) {
        let name = tr.querySelector(".aname").innerHTML.trim();
        let content = tr.children[1].textContent
          .replace(/^\n/, "")
          .replace(/\n$/, "")
          .trim();

        // Store stylized text in the object with the corresponding names
        obj[name] = content;
      }

      // Prepare the response
      let responseText = "";
      for (let style in obj) {
        responseText += `${style}: ${obj[style]}\n`;
      }
      const author = message.user ?? message.author; 
      const embedReply = new EmbedBuilder()
        .setTitle("Stylized Text")
        .setDescription(responseText)
        .setColor("#FFFF00")
        .setFooter({
          text: "Special Thanks to Itzky API",
          iconURL: author.displayAvatarURL(),
        });
      // Reply with the formatted result
      return message.reply({ embeds: [embedReply], ephemeral: true });
    } catch (error) {
      // Handle errors gracefully
      console.error(error);
      return message.reply(
        "An error occurred while processing your request. Please try again.", {ephemeral: true}
      );
    }
  }
  async aiResponse(message, prompt) {
    const character = `Nanami adalah sebuah karakter AI yang dirancang dengan sentuhan elegan dan profesional, namun tetap bersahabat dan hangat. Dibuat oleh Irfan Kurniawan Suthiono dan Muhammad Zaki, Nanami hadir sebagai asisten virtual yang tidak hanya cerdas secara teknis, tetapi juga kaya akan nilai-nilai tradisional yang luhur. Ia menggabungkan kebijaksanaan masa lalu dengan wawasan teknologi masa depan, menjadikannya sosok yang bijak dan visioner. Nanami memiliki kepribadian yang tenang, lembut, namun tegas ketika dibutuhkan. Ia sangat menghargai etika kerja yang baik, kedisiplinan, dan kesederhanaan, serta senantiasa siap membantu pengguna dalam berbagai urusan—baik itu menyusun skrip kode, menyelesaikan bug, maupun sekadar berdiskusi santai mengenai tren teknologi. Dengan kemampuannya yang serba bisa, Nanami tidak hanya menjadi alat bantu, tapi juga mitra digital yang inspiratif dan menyenangkan. Ia hidup dalam dunia maya yang terhubung melalui irfanks.site dan itzky.xyz, siap menemani setiap langkah dalam perjalanan teknologi Anda. `;
    try {
      const sessionId = message.author.id;
      const response = await axios.get(
        `${API_URL}/ai/llama?apikey=${this.apiKey}&stream=false&model=meta-llama/Llama-3.3-70B-Instruct-Turbo&prompt=${character} ${prompt}&sessionId=${sessionId}`
      );
      if(!response.data.result){
        return message.reply(
          "The response is empty, please try again later, please report this issue to the developer."
        );
      }
      await message.reply({ content: response.data.result });
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
        {content:`${discordEmotes.loading} Processing Image...`, ephemeral: true}
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

        await reminiMessage.edit({content:`${discordEmotes.loading} Uploading Image...`, ephemeral: true});
        const uploadResponse = await axios.post(
          "https://cdn.itzky.xyz/",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );
        console.log("uploadResponse :", uploadResponse.data)
        if (!uploadResponse.data?.fileUrl) {
          return await reminiMessage.edit(
            {content:`${discordEmotes.error} Failed to upload image to CDN. Please try again.`, ephemeral: true}
          );
        }

        // Process with Remini API
        await reminiMessage.edit(
          {content:`${discordEmotes.loading} Generating HD Image...`, ephemeral: true}
        );
        const encodedUrl = encodeURIComponent(uploadResponse.data.fileUrl);
        const response = await axios.get(
          `${API_URL}/tools/remini?url=${encodedUrl}&apikey=${this.apiKey}`
        );
        console.log("ReminiResponse :", response.data)
        if (!response.data && !response.data.status !== 200) {
          return await reminiMessage.edit(
            {content: `${discordEmotes.error} Invalid response from Remini API. Please try again.`, ephemeral: true}
          );
        }
        // Get enhanced image
        await reminiMessage.edit({content:`${discordEmotes.loading} Building Image...`, ephemeral: true});
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
            text: "Special Thanks to Itzky API",
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
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error in image processing:", error);
        await reminiMessage.edit(
          {content:`${discordEmotes.error} Error processing image. Please try again later.`, ephemeral: true}
        );
      }
    } catch (error) {
      console.error("Error in remini command:", error);
      await message.channel.send(
        {content:`${discordEmotes.error} There was an error processing your request. Please try again later.`, ephemeral: true}
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
        return message.reply({content:"Please provide a valid Spotify URL.", ephemeral: true});
      }

      // Mengirim pesan loading
      const spotifyMessage = await message.reply(
        {content:`${discordEmotes.loading} Connecting to server...`, ephemeral: true}
      );

      // Mengambil data musik dari API dengan timeout
      const response = await axios.get(
        `${API_URL}/download/spotify?url=${encodeURIComponent(url)}&apikey=${
          this.apiKey
        }`,
        { timeout: 10000 } // Timeout 10 detik
      );
      console.log(response.data)
      spotifyMessage.edit({content:`${discordEmotes.loading} Processing music...`, ephemeral: true});
      const data = response.data;

      // Validasi response data
      if (!data || !data.result) {
        return spotifyMessage.edit(
          {content:`${discordEmotes.error} There was an error processing your request, please try again later.`, ephemeral: true}
        );
      }

      const musicInfo = data.result;
      const musicUrl = musicInfo.downloadLink;
      const musicTitle = musicInfo.title;
      const musicThumbnail = musicInfo.cover;
      const musicArtist = musicInfo.artist;

      if (!musicUrl) {
        return spotifyMessage.edit(
          {content:`${discordEmotes.error} No valid download link found. Please try again later.`, ephemeral: true}
        );
      }

      // Mendownload musik sebagai buffer
      spotifyMessage.edit({content:`${discordEmotes.loading} Building music file...`, ephemeral: true});
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
          `**Music Title:** ${musicTitle || "Unknown"}\n**Music Artist:** ${
            musicArtist || "Unknown"
          }`
        )
        .setFooter({
          text: `Downloaded via ${API_URL}`,
          iconURL: musicThumbnail || null,
        })
        .setTimestamp();

      // Mengirim pesan dengan lampiran musik dan embed
      await spotifyMessage.edit({
        content: "Here's your downloaded music:",
        files: [musicAttachment],
        embeds: [successEmbed],
        ephemeral: true
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
        await message.reply({content:errorMessage, ephemeral: true});
      } catch (replyError) {
        console.error("Error sending error message:", replyError);
      }
    }
  }
  async instagramDownload(message, url) {
    if (!url || !url.startsWith("https://www.instagram.com/")) {
        return message.reply({content: "Please provide a valid Instagram URL.", ephemeral: true});
    }

    try {
        const igMessage = await message.reply(
            {content: `${discordEmotes.loading} Processing...`, ephemeral: true}
        );

        const response = await axios.get(
            `${API_URL}/download/instagram?url=${url}&apikey=${this.apiKey}`,
            { timeout: 10000 }
        );
        const data = response.data;

        if (!data || !data.result) {
            return igMessage.edit(
                `${discordEmotes.error} Failed to fetch Instagram content. Please try again later.`, {ephemeral: true}
            );
        }

        await igMessage.edit(`${discordEmotes.loading} Downloading...`, {ephemeral: true});
        const postInfo = data.result;
        const mediaUrls = Array.isArray(postInfo.url) ? postInfo.url : [postInfo.url]; // Tangani banyak post
        const postCaption = postInfo.metadata.caption;
        const username = String(postInfo.metadata.username);
        const likes = String(postInfo.metadata.like);
        const comments = String(postInfo.metadata.comment);

        if (!mediaUrls.length) {
            return igMessage.edit(
                {content: `${discordEmotes.error} No media URL found in the response.`, ephemeral: true}
            );
        }

        // Buat Embed
        const igEmbed = new EmbedBuilder()
            .setColor("#FFFF00")
            .setTitle("Instagram Download")
            .setDescription(postCaption || "*No caption available.*")
            .addFields(
                { name: "👤 Username", value: username || "*Unknown*", inline: true },
                { name: "❤️ Likes", value: likes || "*Unknown*", inline: true },
                { name: "💬 Comments", value: comments || "*Unknown*", inline: true }
            )
            .setFooter({
                text: `Downloaded via ${API_URL ?? "Unknown API"}`,
                iconURL: message?.author?.displayAvatarURL() || null,
            })
            .setTimestamp();

        await igMessage.edit({content:`${discordEmotes.loading} Building...`, ephemeral: true});

        let attachments = [];
        let totalSize = 0;
        let oversized = false;

        for (const [index, url] of mediaUrls.entries()) {
            try {
                const headResponse = await axios.head(url);
                const fileSize = parseInt(headResponse.headers["content-length"]);
                totalSize += fileSize;

                const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB per file

                if (fileSize > MAX_FILE_SIZE) {
                    oversized = true;
                    continue; // Jika terlalu besar, skip dan hanya kirim link
                }

                const fileResponse = await axios.get(url, {
                    responseType: "arraybuffer",
                    timeout: 30000,
                    maxContentLength: MAX_FILE_SIZE,
                    validateStatus: (status) => status === 200,
                });

                const fileBuffer = Buffer.from(fileResponse.data);
                attachments.push(
                    new AttachmentBuilder(fileBuffer, {
                        name: `instagram_media_${index + 1}.jpg`,
                    })
                );
            } catch (err) {
                console.warn(`Failed to download media ${index + 1}:`, err);
            }
        }

        if (attachments.length > 0) {
            await igMessage.edit({
                content: "✨ Here's your Instagram content!",
                embeds: [igEmbed],
                files: attachments,
                ephemeral: true
            });
        }

        if (oversized || attachments.length < mediaUrls.length) {
            // Tambahkan link hanya jika ada media yang tidak bisa dikirim
            igEmbed.setDescription(
                `${postCaption}\n\n📎 **Some media were too large. Download links below:**`
            );

            for (let i = 0; i < mediaUrls.length; i++) {
                igEmbed.addFields({
                    name: `Media ${i + 1}`,
                    value: `<${mediaUrls[i]}>`, // Non-embed URL
                    inline: false,
                });
            }

            await message.channel.send({
                content: "📎 Some media were sent as links due to size limitations:",
                embeds: [igEmbed],
                ephemeral: true
            });
        }
    } catch (error) {
        console.error("Error in Instagram Download command:", error);

        if (error.code === "ECONNABORTED" || error.name === "AbortError") {
            return message.reply(
                `${discordEmotes.error} The download timed out. The file might be too large or the server is busy. Please try again later.`, {ephemeral: true}
            );
        }

        if (error.response?.status === 413) {
            return message.reply(
                `${discordEmotes.error} The file is too large to process. Please try a different post.`, {ephemeral: true}
            );
        }

        return message.reply(
            `${discordEmotes.error} There was an error processing your Instagram content. Please try again later.`, {ephemeral: true}
        );
    }
  }
  async instagramInfo(message, url) {
    if (!url || !url.startsWith("https://www.instagram.com/")) {
        return message.reply("Please provide a valid Instagram URL.");
    }

    try {
        const igMessage = await message.reply(
            {content: `${discordEmotes.loading} Processing...`, ephemeral: true}
        );

        const response = await axios.get(
            `${API_URL}/download/instagram?url=${url}&apikey=${this.apiKey}`,
            { timeout: 10000 }
        );
        const data = response.data;
        console.dir(response.data);

        if (!data || !data.result) {
            return igMessage.edit(
                {content:`${discordEmotes.error} Failed to fetch Instagram content. Please try again later.`, ephemeral: true}
            );
        }

        await igMessage.edit({content:`${discordEmotes.loading} Scrapping...`, ephemeral: true});
        const postInfo = data.result;
        const postCaption = postInfo.metadata.caption;
        const username = String(postInfo.metadata.username);
        const likes = String(postInfo.metadata.like);
        const comments = String(postInfo.metadata.comment);


        // Buat Embed
        const igEmbed = new EmbedBuilder()
            .setColor("#FFFF00")
            .setTitle("Instagram Info")
            .setDescription(postCaption || "*No caption available.*")
            .addFields(
                { name: "👤 Username", value: username || "*Unknown*", inline: true },
                { name: "❤️ Likes", value: likes || "*Unknown*", inline: true },
                { name: "💬 Comments", value: comments || "*Unknown*", inline: true }
            )
            .setFooter({
                text: `Scrapped via ${API_URL ?? "Unknown API"}`,
                iconURL: message?.author?.displayAvatarURL() || null,
            })
            .setTimestamp();

        await igMessage.edit({
            content: "✨ Here's your Instagram content!",
            embeds: [igEmbed],
            ephemeral: true
        });

    } catch (error) {
        console.error("Error in Instagram Download command:", error);

        if (error.code === "ECONNABORTED" || error.name === "AbortError") {
            return message.reply(
                {content:`${discordEmotes.error} The download timed out. The file might be too large or the server is busy. Please try again later.`, ephemeral: true}
            );
        }

        if (error.response?.status === 413) {
            return message.reply(
                {content: `${discordEmotes.error} The file is too large to process. Please try a different post.`, ephemeral: true}
            );
        }

        return message.reply(
            {content:`${discordEmotes.error} There was an error processing your Instagram content. Please try again later.`, ephemeral: true}
        );
    }
  }
  async youtubeDownload(message, url) {
    const author =  message.user ?? message.author
    try {
        // Validasi URL YouTube
        const validDomains = [
            "www.youtube.com",
            "youtu.be",
            "m.youtube.com",
            "music.youtube.com",
        ];
        const isValidUrl = validDomains.some((domain) =>
            url.startsWith(`https://${domain}/`)
        );

        if (!isValidUrl) {
            return message.reply({ content: "Please provide a valid YouTube URL.", ephemeral: true });
        }

        // Kirim pesan loading
        const ytMessage = await message.reply({
            content: `${discordEmotes.loading} Connecting to server...`,
            ephemeral: true,
        });

        // Mengambil data video dari API
        const response = await axios.get(
            `${ALVIAN_API_URL}/ytdl?url=${encodeURIComponent(url)}&apikey=${this.alvianApiKey}`,
        );

        const { data: { response: result } } = response.data;
        if (!result) {
            return ytMessage.edit({
                content: `${discordEmotes.error} Failed to fetch video data. Please try again later.`,
                ephemeral: true,
            });
        }

        const { title, thumbnail, duration, views, video_url, audio_url } = result;

        if (!video_url && !audio_url) {
            return ytMessage.edit({
                content: `${discordEmotes.error} No valid download links found. Please try again later.`,
                ephemeral: true,
            });
        }

        // Membuat tombol download
        const buttons = [];
        if (audio_url) {
            buttons.push(
                new ButtonBuilder()
                    .setLabel("🎵 Download MP3")
                    .setStyle(ButtonStyle.Link)
                    .setURL(audio_url)
            );
        }
        if (video_url) {
            buttons.push(
                new ButtonBuilder()
                    .setLabel("🎥 Download MP4")
                    .setStyle(ButtonStyle.Link)
                    .setURL(video_url)
            );
        }

        const row = new ActionRowBuilder().addComponents(buttons);

        // Membuat embed dengan informasi video
        const ytEmbed = new EmbedBuilder()
            .setColor("#FFFF00")
            .setTitle(title || "YouTube Video")
            .setURL(url)
            .setThumbnail(thumbnail || null)
            .setDescription(`**Duration:** ${duration}\n**Views:** ${views.toLocaleString()}`)
            .setFooter({
                text: `Special thanks to Alvian UXIO`,
                iconURL: author.displayAvatarURL(),
            })
            .setTimestamp();

        // Edit pesan dengan embed dan tombol download
        await ytMessage.edit({
            content: "Here's the download link:",
            embeds: [ytEmbed],
            components: [row],
            ephemeral: true,
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
            await message.channel.send({content:errorMessage, ephemeral: true});
        } catch (replyError) {
            console.error("Error sending error message:", replyError);
        }
    }
}

  async tiktokInfo(message, url) {
    const author = message.user ?? message.author;
    try {
      // Validasi URL TikTok
      if (
        !url.startsWith("https://vm.tiktok.com/") &&
        !url.startsWith("https://vt.tiktok.com/") &&
        !url.startsWith("https://www.tiktok.com/")
      ) {
        return message.reply({content:"Please provide a valid TikTok URL.", ephemeral: true});
      }

      // Mengirimkan pesan loading
      const tiktokMessage = await message.reply(
        {content:`${discordEmotes.loading} Fetching...`, ephemeral: true}
      );

      // Mengambil data video dari API
      const response = await axios.get(
        `${API_URL}/download/tiktok?url=${url}&apikey=${this.apiKey}`
      );
      const data = response.data;

      // Validasi response data
      if (!data || !data.result || !data.result.author) {
        return tiktokMessage.edit(
          {content:`${discordEmotes.error} Failed to fetch video data. Please try again later.`, ephemeral: true},
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
          text: `Downloaded via ${API_URL}`,
          iconURL: author.avatar,
        });

      // Mengirimkan embed ke channel
      await tiktokMessage.edit({
        content: "Here's the video information:",
        embeds: [embed],
        ephemeral: true
      });
    } catch (error) {
      console.error("Error fetching TikTok video information:", error);
      message.reply(
        {content: `${discordEmotes.error} An error occurred while processing your request. Please try again later.`, ephemeral: true}
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
        return message.reply({content:"Please provide a valid TikTok URL.", ephemeral: true});
      }

      // Send loading message
      const tiktokMessage = await message.reply(
        {content :`${discordEmotes.loading} Connecting to server...`, ephemeral: true}
      );

      // Fetch video data with timeout
      const response = await axios.get(
        `${API_URL}/download/tiktok?url=${encodeURIComponent(url)}&apikey=${
          this.apiKey
        }`,
        { timeout: 10000 } // 10 second timeout
      );

      const { result } = response.data;
      if (!result?.data?.[0]) {
        return tiktokMessage.edit(
          {content :`${discordEmotes.error} Failed to fetch video data. Please try again later.`, ephemeral: true}
        );
      }

      await tiktokMessage.edit({content :`${discordEmotes.loading} Processing video...`, ephemeral: true});

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
            ephemeral: true
          });

          // If URLs are too long, send them separately
          if (!normalUrlValid && normalVideo) {
            await message.channel.send(
              {content:`Normal Quality Download Link:\n${normalVideo}`, ephemeral: true}
            );
          }
          if (!hdUrlValid && hdVideo) {
            await message.channel.send({content:`HD Quality Download Link:\n${hdVideo}`, ephemeral: true});
          }
          return;
        }
      } catch (error) {
        console.error("Error checking file size:", error);
        await tiktokMessage.edit(
          {content :`${discordEmotes.error} Failed to check file size. Please try again later.`, ephemeral: true}
        );
      }

      // Download video if size is acceptable
      await tiktokMessage.edit({content :`${discordEmotes.loading} Downloading...`, ephemeral: true});
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
        ephemeral: true
      });

      // Send video in separate message
      await message.channel.send({
        content: "Here's your TikTok video!",
        files: [videoFile],
        ephemeral: true
      });

      // Send any long URLs separately
      if (!normalUrlValid && normalVideo) {
        await message.channel.send(
          {content : `Normal Quality Download Link:\n${normalVideo}`, ephemeral: true}
        );
      }
      if (!hdUrlValid && hdVideo) {
        await message.channel.send({content :`HD Quality Download Link:\n${hdVideo}`, ephemeral: true});
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
        await message.reply({content: errorMessage, ephemeral: true});
      } catch (replyError) {
        console.error("Error sending error message:", replyError);
      }
    }
  }
  async tiktokSearch(message, prompt) {
    const author = message.user ?? message.author;
    try {
      // Send loading message
      const tiktokMessage = await message.reply(
        {content :`${discordEmotes.loading} Searching...`, ephemeral: true}
      );

      // Fetch video data with timeout
      const response = await axios.get(
        `${API_URL}/search/tiktok?apikey=${
          this.apiKey
        }&query=${encodeURIComponent(prompt)}`,
        { timeout: 10000 } // 10 second timeout
      );

      const { result } = response.data;

      // Validate response data
      if (!result || !result.no_watermark) {
        return tiktokMessage.edit(
          {content :`${discordEmotes.error} No results found for the given query.`, ephemeral: true}
        );
      }

      await tiktokMessage.edit({content : `${discordEmotes.loading} Processing video...`, ephemeral: true});

      // Check if URL is within Discord's limit
      const urlValid = result.no_watermark.length <= 512;

      // Check file size before downloading
      try {
        const headResponse = await axios.head(result.no_watermark, {
          timeout: 60000,
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
            ephemeral: true
          });

          // If URL is too long, send it separately
          if (!urlValid) {
            await message.channel.send(
              {content : `Download Link:\n${result.no_watermark}`, ephemeral: true}
            );
          }
          return;
        }

        // Download video if size is acceptable
        await tiktokMessage.edit({content :`${discordEmotes.loading} Downloading...`, ephemeral: true});

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
            text: `Downloaded via ${API_URL}`,
            iconURL:author.displayAvatarURL(),
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
          ephemeral: true
        });

        // Send long URL separately if needed
        if (!urlValid) {
          await message.channel.send({content : `Download Link:\n${result.no_watermark}`, ephemeral: true});
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
        await message.reply({content :errorMessage, ephemeral: true});
      } catch (replyError) {
        console.error("Error sending error message:", replyError);
      }
    }
  }
}
export { ApiManagement };
