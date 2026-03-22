const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
    console.log(`Bot ist online als ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    console.log("Command bekommen:", interaction.commandName);

    if (interaction.commandName === 'test') {
        await interaction.reply('Bot funktioniert ✅');
    }

});

client.login(process.env.TOKEN);
