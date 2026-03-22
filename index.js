const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
    console.log(`Bot ist online als ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    // TEST COMMAND
    if (interaction.commandName === 'test') {
        await interaction.reply('Bot funktioniert ✅');
    }

    // HALLO COMMAND
    if (interaction.commandName === 'hallo') {
        await interaction.reply(`Hallo ${interaction.user.username} 👋`);
    }

    // RENAME ROLE COMMAND
    if (interaction.commandName === 'renamerole') {

        const newName = interaction.options.getString('name');

        // höchste Rolle vom User (außer @everyone)
        const role = interaction.member.roles.cache
            .filter(r => r.name !== "@everyone")
            .sort((a, b) => b.position - a.position)
            .first();

        if (!role) {
            return interaction.reply("Ich konnte deine Rolle nicht finden ❌");
        }

        try {
            const oldName = role.name;
            await role.setName(newName);

            await interaction.reply(`Rolle **${oldName}** → **${newName}** geändert ✅`);
        } catch (error) {
            console.error(error);
            await interaction.reply("Ich darf deine Rolle nicht ändern ❌");
        }
    }

});

client.login(process.env.TOKEN);
