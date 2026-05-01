// ===============================
// DISCORD BOT - MIT YT-DLP (KEINE COOKIES NÖTIG)
// ===============================

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

// FFmpeg Setup
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

// AUTOCOMPLETE (vereinfacht)
client.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete() && interaction.commandName === 'play') {
        const focused = interaction.options.getFocused();
        if (focused.length < 2) return interaction.respond([]);
        
        // Einfache Vorschläge
        await interaction.respond([
            { name: `🎵 ${focused} (YouTube Suche)`, value: `ytsearch:${focused}` }
        ]);
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    // ========== PLAY mit yt-dlp ==========
    if (interaction.commandName === 'play') {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: '❌ Du musst in einem Voice-Channel sein!', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            // YouTube-Suche oder direkter Link
            let url = query;
            if (!query.includes('youtube.com') && !query.includes('youtu.be') && !query.startsWith('ytsearch:')) {
                url = `ytsearch1:${query}`;
            }

            // Titel mit yt-dlp holen (für Embed)
            let title = query;
            if (url.startsWith('ytsearch1:')) {
                const searchTerm = url.replace('ytsearch1:', '');
                const searchResult = await execPromise(`yt-dlp --get-title --no-playlist "ytsearch1:${searchTerm}"`);
                title = searchResult.stdout.trim();
                // Die eigentliche URL für den Stream
                const urlResult = await execPromise(`yt-dlp --get-url --no-playlist "ytsearch1:${searchTerm}"`);
                url = urlResult.stdout.trim();
            } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const titleResult = await execPromise(`yt-dlp --get-title --no-playlist "${url}"`);
                title = titleResult.stdout.trim();
                const urlResult = await execPromise(`yt-dlp --get-url --no-playlist "${url}"`);
                url = urlResult.stdout.trim();
            }

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: true
            });
            
            const player = createAudioPlayer();
            const resource = createAudioResource(url, { 
                inlineVolume: true 
            });
            resource.volume.setVolume(0.5);
            player.play(resource);
            connection.subscribe(player);
            
            const embed = new EmbedBuilder()
                .setTitle('🎵 Now Playing')
                .setDescription(title.substring(0, 100))
                .setColor('Green');
            
            await interaction.editReply({ embeds: [embed] });
            
            player.once(AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });
            
        } catch (error) {
            console.error('Play Fehler:', error);
            await interaction.editReply('❌ Fehler beim Abspielen! Bitte versuche es mit einem YouTube-Link.');
        }
    }

    // ========== TEST ==========
    if (interaction.commandName === 'test') {
        return interaction.reply("Bot läuft ✅");
    }

    // ========== HALLO ==========
    if (interaction.commandName === 'hallo') {
        return interaction.reply(`Hallo ${interaction.user.username}`);
    }

    // ========== GIVEAWAY ==========
    if (interaction.commandName === 'giveaway') {
        const dauer = interaction.options.getInteger('dauer');
        const preis = interaction.options.getString('preis');

        try {
            const msg = await interaction.reply({
                content: `🎉 **GIVEAWAY** 🎉\n\n🏆 Preis: **${preis}**\n⏰ Dauer: **${dauer} Minute(n)**\n\nReagiere mit 🎉 zum Teilnehmen!`,
                fetchReply: true
            });

            await msg.react("🎉");

            setTimeout(async () => {
                try {
                    const fetchedMsg = await interaction.channel.messages.fetch(msg.id);
                    const reaction = fetchedMsg.reactions.cache.get("🎉");

                    if (!reaction) {
                        await interaction.channel.send("Keine Teilnehmer 😢");
                        return fetchedMsg.delete().catch(() => {});
                    }

                    const users = await reaction.users.fetch();
                    const teilnehmer = users.filter(user => !user.bot);

                    if (teilnehmer.size === 0) {
                        await interaction.channel.send("Niemand hat teilgenommen 😢");
                        return fetchedMsg.delete().catch(() => {});
                    }

                    const winner = teilnehmer.random();
                    await interaction.channel.send(`🎉 Gewinner von **${preis}**: ${winner}`);
                    await fetchedMsg.delete().catch(() => {});

                } catch (err) {
                    console.error(err);
                }
            }, dauer * 60000);

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "Fehler beim Giveaway ❌", ephemeral: true });
        }
    }

    // ========== KICK ==========
    if (interaction.commandName === 'kick') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply("Keine Rechte ❌");
        }
        const member = interaction.options.getMember('user');
        await member.kick();
        return interaction.reply("Gekickt ✅");
    }

    // ========== BAN ==========
    if (interaction.commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply("Keine Rechte ❌");
        }
        const user = interaction.options.getUser('user');
        await interaction.guild.members.ban(user.id);
        return interaction.reply("Gebannt ✅");
    }

    // ========== CLEAR ==========
    if (interaction.commandName === 'clear') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply("Keine Rechte ❌");
        }
        const amount = interaction.options.getInteger('anzahl');
        await interaction.channel.bulkDelete(amount);
        return interaction.reply(`Gelöscht: ${amount}`);
    }

    // ========== TIMEOUT ==========
    if (interaction.commandName === 'timeout') {
        try {
            const user = interaction.options.getUser('user');
            const dauer = interaction.options.getInteger('dauer');
            const member = await interaction.guild.members.fetch(user.id);
            if (!member.moderatable) {
                return interaction.reply("Geht nicht ❌");
            }
            await member.timeout(dauer * 60000);
            return interaction.reply(`⏳ ${user.username} gemutet`);
        } catch {
            return interaction.reply("Fehler ❌");
        }
    }

    // ========== RENAME ROLE ==========
    if (interaction.commandName === 'renamerole') {
        const newName = interaction.options.getString('name');
        const role = interaction.member.roles.cache
            .filter(r => r.name !== "@everyone")
            .sort((a, b) => b.position - a.position)
            .first();
        if (!role) return interaction.reply("Keine Rolle ❌");
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply("Bot Rolle zu niedrig ❌");
        }
        try {
            await role.setName(newName);
            return interaction.reply(`Neue Rolle: ${newName} ✅`);
        } catch {
            return interaction.reply("Fehler ❌");
        }
    }

    // ========== TICKET PANEL ==========
    if (interaction.commandName === 'ticketpanel') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket')
                .setLabel('🎫 Ticket erstellen')
                .setStyle(ButtonStyle.Primary)
        );
        return interaction.reply({
            content: "🆘 **Ticket System** – Klicke auf den Button um ein Ticket zu erstellen",
            components: [row]
        });
    }
});

// ========== BUTTONS ==========
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'ticket') {
        const categoryId = "1488522141598220288";
        
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: categoryId
        });

        await channel.permissionOverwrites.edit(interaction.user, {
            SendMessages: true,
            ReadMessageHistory: true,
            ViewChannel: true
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close')
                .setLabel('🔒 Schließen')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ content: `✅ Ticket erstellt: ${channel}`, ephemeral: true });
        
        await channel.send({
            content: `🎫 **Ticket von ${interaction.user.username}**\nSupport wird sich gleich melden.`,
            components: [row]
        });
    }

    if (interaction.customId === 'close') {
        await interaction.reply("🔒 Ticket wird in 3 Sekunden geschlossen...");
        setTimeout(() => interaction.channel.delete(), 3000);
    }
});

client.login(process.env.TOKEN);
