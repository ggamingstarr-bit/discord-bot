const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

console.log("BOT STARTET...");

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

    // ===== SLASH COMMANDS =====
    if (interaction.isChatInputCommand()) {

        // TEST
        if (interaction.commandName === 'test') {
            return interaction.reply('Bot funktioniert ✅');
        }

        // HALLO
        if (interaction.commandName === 'hallo') {
            return interaction.reply(`Hallo ${interaction.user.username} 👋`);
        }

        // 📊 POLL
        if (interaction.commandName === 'poll') {

            const frage = interaction.options.getString('frage');
            const option1 = interaction.options.getString('option1');
            const option2 = interaction.options.getString('option2');

            const button1 = new ButtonBuilder()
                .setCustomId('vote_1')
                .setLabel(option1)
                .setStyle(ButtonStyle.Primary);

            const button2 = new ButtonBuilder()
                .setCustomId('vote_2')
                .setLabel(option2)
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(button1, button2);

            return interaction.reply({
                content: `📊 **Umfrage**\n${frage}`,
                components: [row]
            });
        }

        // 👑 RENAME ROLE
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

                return interaction.reply(`Rolle **${oldName}** → **${newName}** geändert ✅`);
            } catch (error) {
                console.error(error);
                return interaction.reply("Ich darf deine Rolle nicht ändern ❌");
            }
        }

        // 🎉 GIVEAWAY
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
                    interaction.channel.send("Fehler ❌");
                }
            }, dauerMs);
        }

        // 🎫 TICKET PANEL
        if (interaction.commandName === 'ticketpanel') {

            const button = new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('🎫 Ticket erstellen')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            return interaction.reply({
                content: 'Klicke auf den Button um ein Ticket zu erstellen!',
                components: [row]
            });
        }

        // 🔨 KICK
        if (interaction.commandName === 'kick') {

            if (!interaction.member.permissions.has("KickMembers")) {
                return interaction.reply({ content: "❌ Keine Berechtigung", ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);

            if (!member) return interaction.reply("User nicht gefunden ❌");

            await member.kick();
            return interaction.reply(`✅ ${user.username} wurde gekickt`);
        }

        // 🔨 BAN
        if (interaction.commandName === 'ban') {

            if (!interaction.member.permissions.has("BanMembers")) {
                return interaction.reply({ content: "❌ Keine Berechtigung", ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            await interaction.guild.members.ban(user.id);

            return interaction.reply(`✅ ${user.username} wurde gebannt`);
        }

        // 🔨 TIMEOUT
        if (interaction.commandName === 'timeout') {

            if (!interaction.member.permissions.has("ModerateMembers")) {
                return interaction.reply({ content: "❌ Keine Berechtigung", ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const dauer = interaction.options.getInteger('dauer');

            const member = interaction.guild.members.cache.get(user.id);

            await member.timeout(dauer * 60 * 1000);

            return interaction.reply(`⏳ ${user.username} wurde für ${dauer} Minuten gemutet`);
        }

        // 🔨 CLEAR
        if (interaction.commandName === 'clear') {

            if (!interaction.member.permissions.has("ManageMessages")) {
                return interaction.reply({ content: "❌ Keine Berechtigung", ephemeral: true });
            }

            const amount = interaction.options.getInteger('anzahl');

            await interaction.channel.bulkDelete(amount);

            return interaction.reply({ content: `🧹 ${amount} Nachrichten gelöscht`, ephemeral: true });
        }
    }

    // ===== BUTTONS =====
    if (interaction.isButton()) {

        // POLL
        if (interaction.customId === 'vote_1') {
            return interaction.reply({ content: "Du hast Option 1 gewählt ✅", ephemeral: true });
        }

        if (interaction.customId === 'vote_2') {
            return interaction.reply({ content: "Du hast Option 2 gewählt ✅", ephemeral: true });
        }

        // TICKET ERSTELLEN
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
                content: `Hallo ${interaction.user}, beschreibe dein Problem.`,
                components: [row]
            });
        }

        // TICKET SCHLIESSEN
        if (interaction.customId === 'close_ticket') {

            await interaction.reply("Ticket wird geschlossen...");

            setTimeout(() => {
                interaction.channel.delete();
            }, 3000);
        }
    }

});

client.login(process.env.TOKEN);
