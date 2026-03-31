const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

console.log("NEUER CODE AKTIV");

// 🔥 HIER DEINE KATEGORIE ID EINSETZEN
const SUPPORT_CATEGORY_ID = "1488522141598220288";

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

    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {

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

        // GIVEAWAY (MINUTEN)
        if (interaction.commandName === 'giveaway') {

            const dauerMinuten = interaction.options.getInteger('dauer');
            const preis = interaction.options.getString('preis');

            const dauerMs = dauerMinuten * 60 * 1000;

            await interaction.deferReply();

            const message = await interaction.editReply({
                content: `🎉 **GIVEAWAY** 🎉\nPreis: **${preis}**\nReagiere mit 🎉 um teilzunehmen!\nEndet in ${dauerMinuten} Minuten.`
            });

            await message.react("🎉");

            setTimeout(async () => {
                try {
                    const fetchedMessage = await interaction.channel.messages.fetch(message.id);
                    const reaction = fetchedMessage.reactions.cache.get("🎉");

                    if (!reaction) {
                        return interaction.channel.send("Keine Teilnehmer ❌");
                    }

                    const users = await reaction.users.fetch();
                    const validUsers = users.filter(user => !user.bot);

                    if (validUsers.size === 0) {
                        return interaction.channel.send("Niemand hat teilgenommen 😢");
                    }

                    const winner = validUsers.random();

                    interaction.channel.send(`🎉 Gewinner: ${winner} hat **${preis}** gewonnen!`);
                } catch (err) {
                    console.error(err);
                    interaction.channel.send("Fehler beim Auslosen ❌");
                }
            }, dauerMs);
        }

        // TICKET PANEL
        if (interaction.commandName === 'ticketpanel') {

            const button = new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('🎫 Ticket erstellen')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            await interaction.reply({
                content: 'Klicke auf den Button um ein Ticket zu erstellen!',
                components: [row]
            });
        }
    }

    // BUTTONS
    if (interaction.isButton()) {

        // 🎫 Ticket erstellen
        if (interaction.customId === 'create_ticket') {

            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: SUPPORT_CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ]
            });

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Ticket schließen')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(closeButton);

            await interaction.reply({
                content: `Dein Ticket: ${channel}`,
                ephemeral: true
            });

            channel.send({
                content: `Hallo ${interaction.user}, beschreibe dein Problem.\nDrücke den Button um das Ticket zu schließen.`,
                components: [row]
            });
        }

        // 🔒 Ticket schließen
        if (interaction.customId === 'close_ticket') {

            await interaction.reply("Ticket wird geschlossen...");

            setTimeout(() => {
                interaction.channel.delete();
            }, 3000);
        }
    }

});

client.login(process.env.TOKEN);
