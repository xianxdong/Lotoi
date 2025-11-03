const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits} = require("discord.js");
const config = require("../../config.json");
require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("ban the user from the server")
        .addUserOption(option => 
            option
            .setName("user")
            .setDescription("ban the selected user")
            .setRequired(true))
        .addStringOption(option =>
            option
            .setName("reason")
            .setDescription("The reason for the ban")
        ),
    async execute(interaction){
        const targetMember = interaction.options.getMember("user");
        const banReason = interaction.options.getString("reason") ?? "No reason provided.";
        const botInfo = interaction.guild.members.me ?? await interaction.guild.members.fetch(process.env.DISCORD_CLIENT_ID);
        const embed = new EmbedBuilder()
            .setColor(config.red)
            .setFields({name: " ", value: `I can't ban that member`})
            .setTimestamp();

        if (!(interaction.member.permissions.has(PermissionFlagsBits.Administrator)) && !(interaction.member.permissions.has(PermissionFlagsBits.BanMembers))){
            embed.setFields({name: " ", value: `Missing permissions: ban_members`});
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral});
            return;

        } else if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.member.id != interaction.guild.ownerId){
            embed.setFields({name: " ", value: `You can't ban someone higher than yourself`});
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        
        } else if (targetMember.id === botInfo.id || targetMember.id === interaction.guild.ownerId || targetMember.roles.highest.position >= botInfo.roles.highest.position){
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        
        }
        try {
            await interaction.deferReply();
            embed.setFields({name: " ", value: `***${targetMember.user.username} has been banned.*** | ${banReason}`}).setColor(config.green);
            await interaction.guild.members.ban(targetMember.id, {reason: `${banReason}`});
            await interaction.editReply({ embeds: [embed]});
            
        } catch (error) {
            await interaction.editReply("An unknown error occurred!");
            console.error(error);
        };
    }
};
