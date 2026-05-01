const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
require('dotenv').config();

const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.once('ready', () => {
    console.log(`✅ Online als ${client.user.tag}`);
});

// Autocomplete
client.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete() && interaction.commandName === 'play') {
        const focused = interaction.options.getFocused();
        if (focused.length < 2) return interaction.respond([]);
        
        const results = await play.search(focused, { limit: 5 });
        await interaction.respond(results.map(song => ({ name: song.title.substring(0, 100), value: song.url })));
    }

    if (!interaction.isChatInputCommand()) return;

    // PLAY Command
    if (interaction.commandName === 'play') {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: '❌ Du musst in einem Voice-Channel sein!', ephemeral: true });

        await interaction.deferReply();
        
        try {
            const search = await play.search(query, { limit: 1 });
            if (!search.length) return interaction.editReply('❌ Kein Song gefunden!');
            
            const song = search[0];
            const stream = await play.stream(song.url);
            
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: true
            });
            
            const player = createAudioPlayer();
            const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
            resource.volume = 0.5;
            player.play(resource);
            connection.subscribe(player);
            
            const embed = new EmbedBuilder()
                .setTitle('🎵 Now Playing')
                .setDescription(song.title)
                .setURL(song.url)
                .setColor('Green');
            
            await interaction.editReply({ embeds: [embed] });
            
            player.once(AudioPlayerStatus.Idle, () => connection.destroy());
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Fehler beim Abspielen!');
        }
    }

    // TEST
    if (interaction.commandName === 'test') return interaction.reply('Bot läuft ✅');
    
    // HALLO
    if (interaction.commandName === 'hallo') return interaction.reply(`Hallo ${interaction.user.username}`);
    
    // GIVEAWAY
    if (interaction.commandName === 'giveaway') {
        const dauer = interaction.options.getInteger('dauer');
        const preis = interaction.options.getString('preis');
        const msg = await interaction.reply({ content: `🎉 **GIVEAWAY** 🎉\n\n🏆 Preis: **${preis}**\n⏰ Dauer: **${dauer} Minuten**\n\nReagiere mit 🎉!`, fetchReply: true });
        await msg.react('🎉');
        setTimeout(async () => {
            const fetched = await interaction.channel.messages.fetch(msg.id);
            const reaction = fetched.reactions.cache.get('🎉');
            if (!reaction) return interaction.channel.send('Keine Teilnehmer 😢');
            const users = await reaction.users.fetch();
            const teilnehmer = users.filter(u => !u.bot);
            if (!teilnehmer.size) return interaction.channel.send('Niemand hat teilgenommen 😢');
            const winner = teilnehmer.random();
            await interaction.channel.send(`🎉 Gewinner von **${preis}**: ${winner}`);
            await fetched.delete();
        }, dauer * 60000);
    }
    
    // KICK
    if (interaction.commandName === 'kick') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return interaction.reply('Keine Rechte ❌');
        const member = interaction.options.getMember('user');
        await member.kick();
        return interaction.reply('Gekickt ✅');
    }
    
    // BAN
    if (interaction.commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return interaction.reply('Keine Rechte ❌');
        const user = interaction.options.getUser('user');
        await interaction.guild.members.ban(user.id);
        return interaction.reply('Gebannt ✅');
    }
    
    // CLEAR
    if (interaction.commandName === 'clear') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return interaction.reply('Keine Rechte ❌');
        const amount = interaction.options.getInteger('anzahl');
        await interaction.channel.bulkDelete(amount);
        return interaction.reply(`Gelöscht: ${amount}`);
    }
    
    // TIMEOUT
    if (interaction.commandName === 'timeout') {
        const user = interaction.options.getUser('user');
        const dauer = interaction.options.getInteger('dauer');
        const member = await interaction.guild.members.fetch(user.id);
        if (!member.moderatable) return interaction.reply('Geht nicht ❌');
        await member.timeout(dauer * 60000);
        return interaction.reply(`⏳ ${user.username} gemutet`);
    }
    
    // RENAME ROLE
    if (interaction.commandName === 'renamerole') {
        const newName = interaction.options.getString('name');
        const role = interaction.member.roles.cache.filter(r => r.name !== '@everyone').sort((a, b) => b.position - a.position).first();
        if (!role) return interaction.reply('Keine Rolle ❌');
        if (role.position >= interaction.guild.members.me.roles.highest.position) return interaction.reply('Bot Rolle zu niedrig ❌');
        await role.setName(newName);
        return interaction.reply(`Neue Rolle: ${newName} ✅`);
    }
    
    // TICKET PANEL
    if (interaction.commandName === 'ticketpanel') {
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket').setLabel('🎫 Ticket erstellen').setStyle(ButtonStyle.Primary));
        return interaction.reply({ content: '🆘 **Ticket System**', components: [row] });
    }
});

client.login(process.env.TOKEN);
