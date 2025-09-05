const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const MusicQueue = require("../../music/GuildMusicQueue");
const queueManager = require("../../music/queueManager");
const config = require("../../config");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Returns the queue list"),

    async execute(interaction){
        await interaction.deferReply();
        let queue = queueManager.get(interaction.guild.id);
        if (!queue){
            queue = new MusicQueue(interaction.guild.id, interaction);
            queueManager.set(interaction.guild.id, queue);
        };

        songList = queue.getSongList();

        console.log(songList);
        
        answer = `#1 ${songList[0].title}`

        for (let i = 1; i < songList.length; i++){
            answer = answer + `#${i} ${songList[i].length}`
        }

        // await interaction.reply("Testing");

        if (!songList){
            await interaction.editReply("The queue is empty!");
        } else {
            await interaction.editReply(songList[0].title);
        }

    }

};