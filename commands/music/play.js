const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const config = require("../../config");
const MusicQueue = require("../../music/GuildMusicQueue");
const queueManager = require("../../music/queueManager");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Plays music in a voice channel")
        .addStringOption(option =>
            option
                .setName("url")
                .setDescription("Paste in the youtube music URL")
                .setRequired(true)
        ),

    async execute(interaction){
        const botInfo = interaction.guild.members.me ?? await interaction.guild.members.fetch(process.env.DISCORD_CLIENT_ID);

        const urlLink = interaction.options.getString("url");
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setColor(config.red)
            .setFields({ name: "", value: "Please join a vc" });

        // User must be in a VC
        if (interaction.member.voice.channelId === null){
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        // If the bot is already in a different VC, block
        if (botInfo.voice.channelId && botInfo.voice.channelId !== interaction.member.voice.channelId){
            embed.setFields({ name: "", value: "You are not in the same VC channel as the bot" });
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        const channel = interaction.member.voice.channel;
        const botPermission = botInfo.permissionsIn(channel);

        if (!botPermission.has(PermissionFlagsBits.ViewChannel)){
            embed.setFields({ name: "", value: "Cannot join vc. Missing permissions: ViewChannel" });
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        if (!botPermission.has(PermissionFlagsBits.Connect)){
            embed.setFields({ name: "", value: "Cannot join vc. Missing permissions: Connect" });
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        if (!botPermission.has(PermissionFlagsBits.Speak)){
            embed.setFields({ name: "", value: "Cannot speak in vc. Missing permissions: Speak" });
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        if (channel.userLimit && channel.userLimit > 0 && channel.members.size >= channel.userLimit && !botPermission.has(PermissionFlagsBits.MoveMembers)) {
            embed.setFields({ name: "", value: "The voice channel is full. Missing permissions to join: MoveMembers" });
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            return;
        }

        try {
            await interaction.deferReply();

            const voiceChannelId = interaction.member.voice.channelId;
            const textChannelId = interaction.channel.id;

            // Queue management as before
            let queue = queueManager.get(interaction.guild.id);
            if (!queue){
                queue = new MusicQueue(interaction.guild.id, interaction);
                queueManager.set(interaction.guild.id, queue);
            }

            // Ensure Moonlink player is connected (returns player or null)
            const player = await queue.ensureConnection({
                voiceChannelId,
                textChannelId,
                setDeaf: true,
                botMember: botInfo
            });

            if (!player){
                embed.setFields({ name: "", value: "Failed to connect to VC" });
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const musicSuccess = await queue.addSong(urlLink, interaction);

            if (!musicSuccess){
                embed.setFields({ name: "", value: "Invalid link provided." });
                await interaction.editReply({ embeds: [embed] });
                return;
            };

            const songList = queue.getSongList();

            if (songList.length > 0){
                const song = songList[songList.length - 1];
                embed
                    .setFields({ name: "", value: `[${song.title}](${song.songUrl}) **-** \`[${song.duration}]\`` })
                    .setColor(config.green)
                    .setAuthor({ name: `Added song to queue #${songList.length}`, iconURL: interaction.user.avatarURL() });
            } else if (songList.length === 0){
                const song = queue.getCurrentSong();
                embed
                    .setFields({ name: "", value: `[${song.title}](${song.songUrl}) **-** \`[${song.duration}]\`` })
                    .setColor(config.green)
                    .setAuthor({ name: `Added song to queue`, iconURL: interaction.user.avatarURL() });
            };

            await interaction.editReply({ embeds: [embed] });

        } catch (error){
            console.error(error);
            await interaction.editReply("Error something went wrong. Please try again");
        };
    },
};