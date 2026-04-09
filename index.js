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
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.once("ready", () => {
    console.log(`Bot ist online als ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

    // ===== COMMANDS =====
    if (interaction.isChatInputCommand()) {

        await interaction.deferReply();

        // TEST
        if (interaction.commandName === 'test') {
            return interaction.editReply("Bot funktioniert ✅");
        }

        // HALLO
        if (interaction.commandName === 'hallo') {
            return interaction.editReply(`Hallo ${interaction.user.username} 👋`);
        }

        // POLL
        if (interaction.commandName === 'poll') {

            const frage = interaction.options.getString('frage');
            const option1 = interaction.options.getString('option1');
            const option2 = interaction.options.getString('option2');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('vote1').setLabel(option1).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('vote2').setLabel(option2).setStyle(ButtonStyle.Success)
            );

            return interaction.editReply({
                content: `📊 ${frage}`,
                components: [row]
            });
        }

        // RENAME ROLE
        if (interaction.commandName === 'renamerole') {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.editReply("Keine Rechte ❌");
    }

    const newName = interaction.options.getString('name');

    const role = interaction.member.roles.cache
        .filter(r => r.name !== "@everyone")
        .sort((a, b) => b.position - a.position)
        .first();

    if (!role) {
        return interaction.editReply("Keine Rolle gefunden ❌");
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply("Meine Rolle ist zu niedrig ❌");
    }

    try {
        await role.setName(newName);
        return interaction.editReply(`Rolle wurde zu "${newName}" geändert ✅`);
    } catch (err) {
        console.error(err);
        return interaction.editReply("Fehler beim Umbenennen ❌");
    }
}

        // GIVEAWAY
        if (interaction.commandName === 'giveaway') {

            const dauer = interaction.options.getInteger('dauer');
            const preis = interaction.options.getString('preis');

            const msg = await interaction.editReply(
                `🎉 Giveaway für **${preis}**\nReagiere mit 🎉 (${dauer} Minuten)`
            );

            await msg.react("🎉");

            setTimeout(async () => {
                try {
                    const fetched = await interaction.fetchReply();
                    const reaction = fetched.reactions.cache.get("🎉");

                    if (!reaction) return interaction.channel.send("Keine Teilnehmer");

                    const users = await reaction.users.fetch();
                    const valid = users.filter(u => !u.bot);

                    if (valid.size === 0) {
                        return interaction.channel.send("Niemand hat teilgenommen");
                    }

                    const winner = valid.random();
                    interaction.channel.send(`🎉 Gewinner: ${winner}`);
                } catch (err) {
                    console.error(err);
                }
            }, dauer * 60000);
        }

        // TICKET PANEL
        if (interaction.commandName === 'ticketpanel') {

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket')
                    .setLabel('🎫 Ticket erstellen')
                    .setStyle(ButtonStyle.Primary)
            );

            return interaction.editReply({
                content: "Klicke für Ticket",
                components: [row]
            });
        }

        // 🔨 KICK
        if (interaction.commandName === 'kick') {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.editReply("Keine Rechte ❌");
            }

            const member = interaction.options.getMember('user');
            await member.kick();

            return interaction.editReply("User gekickt ✅");
        }

        // 🔨 BAN
        if (interaction.commandName === 'ban') {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.editReply("Keine Rechte ❌");
            }

            const user = interaction.options.getUser('user');
            await interaction.guild.members.ban(user.id);

            return interaction.editReply("User gebannt ✅");
        }

        // 🔨 TIMEOUT
        if (interaction.commandName === 'timeout') {

    try {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.editReply("Keine Rechte ❌");
        }

        const user = interaction.options.getUser('user');
        const dauer = interaction.options.getInteger('dauer');

        const member = await interaction.guild.members.fetch(user.id);

        if (!member) {
            return interaction.editReply("User nicht gefunden ❌");
        }

        if (!member.moderatable) {
            return interaction.editReply("Ich darf diesen User nicht timeouten ❌");
        }

        await member.timeout(dauer * 60000);

        return interaction.editReply(`⏳ ${user.username} wurde für ${dauer} Minuten gemutet`);

    } catch (err) {
        console.error(err);
        return interaction.editReply("Fehler beim Timeout ❌");
    }
}

        // 🔨 CLEAR
        if (interaction.commandName === 'clear') {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.editReply("Keine Rechte ❌");
            }

            const amount = interaction.options.getInteger('anzahl');

            await interaction.channel.bulkDelete(amount);

            return interaction.editReply(`Gelöscht: ${amount}`);
        }
    }

    // ===== BUTTONS =====
    if (interaction.isButton()) {

        // POLL BUTTONS
        if (interaction.customId === 'vote1') {
            return interaction.reply({ content: "Du hast Option 1 gewählt", ephemeral: true });
        }

        if (interaction.customId === 'vote2') {
            return interaction.reply({ content: "Du hast Option 2 gewählt", ephemeral: true });
        }

        // TICKET
        if (interaction.customId === 'ticket') {

            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: SUPPORT_CATEGORY_ID
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close')
                    .setLabel('🔒 Schließen')
                    .setStyle(ButtonStyle.Danger)
            );

            await interaction.reply({ content: `Ticket: ${channel}`, ephemeral: true });

            channel.send({
                content: "Support wird sich melden",
                components: [row]
            });
        }

        // CLOSE TICKET
        if (interaction.customId === 'close') {
            await interaction.reply("Ticket wird geschlossen...");
            setTimeout(() => interaction.channel.delete(), 3000);
        }
    }

});

client.login(process.env.TOKEN);
