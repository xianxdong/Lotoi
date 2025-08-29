const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits, ThreadAutoArchiveDuration, flatten } = require("discord.js");
const ms = require("ms");
const config = require("../../config");
require("dotenv").config();


module.exports = {

    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Unmutes the selected user")
        .addUserOption(option => 
            option
            .setName("user")
            .setDescription("unmutes the user")
            .setRequired(true))
        .addStringOption(option =>
            option
            .setName("reason")
            .setDescription("The reason for the unmute")
        ),

    async execute(interaction){

        const targetMember = interaction.options.getMember("user");
        const reason = interaction.options.getString("reason") ?? "No reason provided."
        const botInfo = await interaction.guild.members.fetch(process.env.DISCORD_CLIENT_ID);
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setColor(config.red);

        if ((!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) && (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers))){
            embed.setFields({name: "", value: "Missing permission: moderate_members"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;

        } else if (targetMember === null){
            embed.setFields({name: "", value: "I can't find that member"});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;

        } else if (targetMember.communicationDisabledUntilTimestamp === null){
            embed.setFields({name: "", value: `I can't unmuted ${targetMember.user.username}, they are not muted`});
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;

        } else if (targetMember.roles.highest.position >= botInfo.roles.highest.position){
            embed.setFields({name: "", value: "I can't unmute that member"})
            await interaction.reply({embeds: [embed], flags: MessageFlags.Ephemeral});
            return;
        }
        try {
            await interaction.deferReply();
            await targetMember.timeout(null);
            embed.setFields({name: "", value: `***Successfully unmuted ${targetMember.user.username}*** | ${reason}`}).setColor(config.green);
            await interaction.editReply({embeds: [embed]});

        } catch (error){
            console.error(error);
        };
    }
};