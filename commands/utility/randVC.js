const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, VoiceChannelEffectSendAnimationType } = require("discord.js");
require("dotenv").config();

module.exports = {

    data: new SlashCommandBuilder()
    .setName("randomVC")
    .setDescription("Chooses a random person from VC"),

    async execute(interaction){
        await interaction.deferReply();

        const botInfo = interaction.guild.members.me ?? await interaction.guild.members.fetch(process.env.DISCORD_CLIENT_ID);
        const voiceChannel = botInfo.voice.channel;

        if (!voiceChannel){
            interaction.editReply("I am not in a VC channel.");
        };

        const members = voiceChannel.members.filter(member => !member.user.bot);

        if (members.size === 0){
            return interaction.editReply("No non-bot members could be found in my voice channel");
        }
        
        const randomMember = members.random()

        
        await interaction.editReply(`I choose **${randomMember.user.username}**!`)

    }

}
