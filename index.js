client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    try {

        if (interaction.commandName === 'test') {
            await interaction.reply('Bot funktioniert ✅');
        }

    } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp('Fehler ❌');
        } else {
            await interaction.reply('Fehler ❌');
        }
    }

});

client.login(process.env.TOKEN);
