const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");


module.exports = {

    data: new SlashCommandBuilder()
        .setName("userlist")
        .setDescription("Returns the list of members joined on the server"),
    async execute(interaction){
        // console.log(interaction.guild.members.fetch())
        const members = await interaction.guild.members.fetch();
        const membersIDS = Array.from(members.keys());
        // let memberIdList = []
        let memberNameList = []

        for (i = 0; i < membersIDS.length; i++){
            const memberNames = await interaction.guild.members.fetch(membersIDS[i]);
            // memberIdList.push(membersIDS[i]);
            memberNameList.push(memberNames.user.username.toLowerCase());
        };
        // console.log(memberIdList);
        // console.log(`Unsorted: ${memberNameList}`);
        memberNameList.sort()
        // console.log(members)

        // console.log(`Sorted: ${memberNameList}`);

        await interaction.deferReply();
        await interaction.editReply(`${memberNameList.join("\n")}`);
        
    }
};