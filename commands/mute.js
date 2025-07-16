const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits, ThreadAutoArchiveDuration, flatten } = require("discord.js");
const ms = require("ms");
const config = require("../config");

function formatDuration(duration) {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}


module.exports = {

    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mutes (timeout) the user")
        .addUserOption(option => 
            option
            .setName("user")
            .setDescription("Mute the selected user")
            .setRequired(true))
        .addStringOption(option =>
            option
            .setName("duration")
            .setDescription("The duration of the mute (e.g. 1h, 30m, 1d). Max 28 days.")
            .setRequired(true))
        .addStringOption(option => 
            option
            .setName("reason")
            .setDescription("The reason for the mute")
        ),

    async execute(interaction){

        const targetMember = interaction.options.getMember("user");
        const muteReason = interaction.options.getString("reason") ?? "No reason provided.";
        const botInfo = await interaction.guild.members.fetch(config.clientId);
        const muteDuration = interaction.options.getString("duration");
        const muteInMs = ms(muteDuration);


        const embed = new EmbedBuilder()
            .setColor(config.red)
            .setFields({name: "", value: "I can't timeout that member"})
            .setTimestamp();
        
        if ((!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) && (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))){
            embed.setFields({name: "", value: "Missing permissions: moderate_members"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;

        } else if (targetMember === null){
            embed.setFields({name: "", value: "I can't find that member"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;

        } else if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.member.id != interaction.guild.ownerId){
            embed.setFields({name: "", value: "You can't timeout someone higher than yourself"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;

        } else if (targetMember.id === botInfo.id || targetMember.id === interaction.guild.ownerId || targetMember.roles.highest.position >= botInfo.roles.highest.position || targetMember.permissions.has(PermissionFlagsBits.Administrator)){
            await interaction.reply({embeds: [embed], flags:MessageFlags.Ephemeral});
            return;

        } else if (!muteInMs){
            embed.setFields({name: "", value: "**Invalid expiration provided**"})
            .setFooter({ text: "Format should be 30s, 1m, 6h, 2d, etc"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        }
        try {
            await interaction.deferReply();
            await targetMember.timeout(muteInMs, muteReason);
            embed.setFields({name: " ", value: `***Successfully muted ${targetMember.user.username} for ${formatDuration(muteInMs)}*** | ${muteReason}`}).setColor(config.green);
            await interaction.editReply({embeds: [embed]})

        } catch (error){
            console.error(error);
        }
            

        


    }
}