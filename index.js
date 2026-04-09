const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder
} = require('discord.js');

const play = require('play-dl');

console.log("BOT STARTET...");

// 🔧 NUR DAS HIER BRAUCHST DU NOCH
const SUPPORT_CATEGORY_ID = "1488522141598220288";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

client.once("ready", () => {
    console.log(`Online als ${client.user.tag}`);
});


// =========================
// 👋 AUTO ROLE (NEU – erstellt eigene Rolle)
// =========================
client.on('guildMemberAdd', async member => {

    try {
        const role = await member.guild.roles.create({
            name: member.user.username, // 👈 Rolle = Username
            reason: 'Auto Role'
        });

        await member.roles.add(role);

        console.log(`Rolle erstellt für ${member.user.tag}`);

    } catch (err) {
        console.error(err);
    }
});


// =========================
// 🧹 AUTO DELETE
// =========================
client.on('messageCreate', message => {
    if (message.author.bot) {
        setTimeout(() => {
            message.delete().catch(() => {});
        }, 60000);
    }
});


// =========================
// 🎯 COMMANDS
// =========================
client.on('interactionCreate', async interaction => {

    if (interaction.isChatInputCommand()) {

        await interaction.deferReply();

        // TEST
        if (interaction.commandName === 'test') {
            return interaction.editReply("Bot läuft ✅");
        }

        // HALLO
        if (interaction.commandName === 'hallo') {
            return interaction.editReply(`Hallo ${interaction.user.username}`);
        }

        // RENAME ROLE
        if (interaction.commandName === 'renamerole') {

            const newName = interaction.options.getString('name');

            const role = interaction.member.roles.cache
                .filter(r => r.name !== "@everyone")
                .sort((a, b) => b.position - a.position)
                .first();

            if (!role) return interaction.editReply("Keine Rolle ❌");

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.editReply("Bot Rolle zu niedrig ❌");
            }

            try {
                await role.setName(newName);
                return interaction.editReply(`Neue Rolle: ${newName} ✅`);
            } catch {
                return interaction.editReply("Fehler ❌");
            }
        }

        // TIMEOUT
        if (interaction.commandName === 'timeout') {

            try {
                const user = interaction.options.getUser('user');
                const dauer = interaction.options.getInteger('dauer');

                const member = await interaction.guild.members.fetch(user.id);

                if (!member.moderatable) {
                    return interaction.editReply("Geht nicht ❌");
                }

                await member.timeout(dauer * 60000);

                return interaction.editReply(`⏳ ${user.username} gemutet`);
            } catch {
                return interaction.editReply("Fehler ❌");
            }
        }

        // 🎵 PLAY
        if (interaction.commandName === 'play') {

            const query = interaction.options.getString('song');
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                return interaction.editReply("Du musst im Voice sein ❌");
            }

            const stream = await play.stream(query);

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });

            const player = createAudioPlayer();
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            player.play(resource);
            connection.subscribe(player);

            const embed = new EmbedBuilder()
                .setTitle("🎵 Now Playing")
                .setDescription(query)
                .setColor("Green");

            player.on(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

            return interaction.editReply({ embeds: [embed] });
        }

        // KICK
        if (interaction.commandName === 'kick') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.editReply("Keine Rechte ❌");
            }
            const member = interaction.options.getMember('user');
            await member.kick();
            return interaction.editReply("Gekickt ✅");
        }

        // BAN
        if (interaction.commandName === 'ban') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.editReply("Keine Rechte ❌");
            }
            const user = interaction.options.getUser('user');
            await interaction.guild.members.ban(user.id);
            return interaction.editReply("Gebannt ✅");
        }

        // CLEAR
        if (interaction.commandName === 'clear') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.editReply("Keine Rechte ❌");
            }
            const amount = interaction.options.getInteger('anzahl');
            await interaction.channel.bulkDelete(amount);
            return interaction.editReply(`Gelöscht: ${amount}`);
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
                content: "Ticket erstellen",
                components: [row]
            });
        }
    }

    // =========================
    // 🔘 BUTTONS
    // =========================
    if (interaction.isButton()) {

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

        if (interaction.customId === 'close') {
            await interaction.reply("Schließe...");
            setTimeout(() => interaction.channel.delete(), 3000);
        }
    }

});

client.login(process.env.TOKEN);
