const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", () => {
    console.log(`Bot ist online als ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    // TEST
    if (interaction.commandName === 'test') {
        await interaction.reply('Bot funktioniert ✅');
    }

    // HALLO
    if (interaction.commandName === 'hallo') {
        await interaction.reply(`Hallo ${interaction.user.username} 👋`);
    }

    // RENAME ROLE
    if (interaction.commandName === 'renamerole') {

        const newName = interaction.options.getString('name');

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

    // GIVEAWAY
    if (interaction.commandName === 'giveaway') {

        const dauer = interaction.options.getInteger('dauer');
        const preis = interaction.options.getString('preis');

        const message = await interaction.reply({
            content: `🎉 **GIVEAWAY** 🎉\nPreis: **${preis}**\nReagiere mit 🎉 um teilzunehmen!\nEndet in ${dauer} Sekunden.`,
            fetchReply: true
        });

        await message.react("🎉");

        setTimeout(async () => {
            const fetchedMessage = await message.fetch();
            const users = await fetchedMessage.reactions.cache.get("🎉").users.fetch();

            const validUsers = users.filter(user => !user.bot);

            if (validUsers.size === 0) {
                return interaction.channel.send("Niemand hat teilgenommen 😢");
            }

            const winner = validUsers.random();

            interaction.channel.send(`🎉 Gewinner: ${winner} hat **${preis}** gewonnen!`);
        }, dauer * 1000);
    }

});

client.login(process.env.TOKEN);
