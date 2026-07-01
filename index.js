const origLog = console.log;
console.log = () => { };
require('dotenv').config();
console.log = origLog;

process.removeAllListeners('warning');

const { Client: BotClient, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { Client: UserClient } = require('discord.js-selfbot-v13');

const bot = new BotClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const userClient = new UserClient({
    checkUpdate: false
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const DC_TOKEN = process.env.DC_TOKEN || null;
let ALLOWED_ID = process.env.ALLOWED_ID || null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const purple = '\x1b[35m';
const reset = '\x1b[0m';

console.clear();
console.log(purple + `
 ███████╗ ██████╗██╗      █████╗ ██╗      ██████╗ ███████╗███████╗██████╗ 
 ╚══███╔╝██╔════╝██║     ██╔══██╗██║     ██╔═══██╗██╔════╝██╔════╝██╔══██╗
   ███╔╝ ██║     ██║     ███████║██║     ██║   ██║█████╗  █████╗  ██████╔╝
  ███╔╝  ██║     ██║     ██╔══██║██║     ██║   ██║██╔══╝  ██╔══╝  ██╔══██╗
 ███████╗╚██████╗███████╗██║  ██║███████╗╚██████╔╝███████╗███████╗██║  ██║
 ╚══════╝ ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝
` + reset);

bot.once('ready', () => {
    console.log(purple + `Bot logged in as ${bot.user.tag}` + reset);
});

if (DC_TOKEN) {
    userClient.login(DC_TOKEN).then(() => {
        console.log(purple + `User Client logged in from ENV as ${userClient.user.tag}` + reset);
    }).catch(() => console.error("Invalid DC_TOKEN provided in environment variables."));
} else {
    console.log(purple + `DC_TOKEN not found in ENV. Waiting for !settoken command.` + reset);
}

if (!ALLOWED_ID) {
    console.log(purple + `ALLOWED_ID not found in ENV. Waiting for an admin to use !setid command.` + reset);
}

userClient.on('ready', () => {
    console.log(purple + `User Client successfully logged in as ${userClient.user.tag}` + reset);
});

bot.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!ALLOWED_ID) {
        if (message.content.toLowerCase().startsWith('!setid')) {
            if (!message.guild) return message.reply("Please run this command in a server.");
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply("❌ You must have **Administrator** permissions to claim this bot.");
            }
            ALLOWED_ID = message.author.id;
            await message.reply(`✅ <@${ALLOWED_ID}> has been claimed as the bot owner! You can now use all commands.`);
        } else {
            if (message.content.startsWith('!')) {
                return message.reply("⚠️ Bot owner not set. An Administrator must use `!setid` to claim the bot first.");
            }
        }
        return;
    }

    if (message.author.id !== ALLOWED_ID) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === '!help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle("Z Cloner - Commands")
            .setColor('#800080')
            .setDescription(
                `**!help** - Shows this help menu\n` +
                `**!setid** - (Admin only, if ALLOWED_ID is empty) Claims the bot\n` +
                `**!settoken <token>** - Provide the user account token if DC_TOKEN is not set\n` +
                `**!clone <source_id> <target_id>** - Start the server cloning process`
            )
            .setFooter({ text: 'Z Cloner V2' });

        return message.channel.send({ embeds: [helpEmbed] });
    }

    if (command === '!settoken') {
        if (userClient.isReady()) {
            return message.reply("✅ User client is already logged in! No need to set a token.");
        }

        const token = args[0];
        if (!token) {
            return message.reply("❌ Please provide a token. Usage: `!settoken <your_user_token>`");
        }

        try {
            await userClient.login(token);
            if (message.deletable) await message.delete().catch(() => { });
            await message.author.send("✅ **Z Cloner:** User Client successfully logged in as `" + userClient.user.tag + "`");
            await message.channel.send("✅ User client logged in! Check your DMs. (Your message containing the token was deleted for security).");
        } catch (e) {
            await message.reply("❌ Failed to log in. Make sure the user token is valid.");
        }
    }

    if (command === '!clone') {
        if (!userClient.isReady()) {
            const missingTokenEmbed = new EmbedBuilder()
                .setTitle("⚠️ User Account Token Required")
                .setColor('#FF0000')
                .setDescription(
                    `The user client is not logged in. I need a user account to read the source server.\n\n` +
                    `Please use \`!settoken <token>\` to provide your user account token, or set \`DC_TOKEN\` in your Railway environment variables.`
                );

            return message.channel.send({ embeds: [missingTokenEmbed] });
        }

        if (args.length < 2) {
            return message.reply("Usage: `!clone <source_server_id> <target_server_id>`");
        }

        const sourceId = args[0];
        const targetId = args[1];

        if (sourceId === targetId) {
            return message.reply("Source and Target server IDs cannot be the same.");
        }

        const sourceGuild = userClient.guilds.cache.get(sourceId);
        if (!sourceGuild) {
            return message.reply("❌ I can't access the source server from the user account. Make sure the user account is in that server.");
        }

        const targetGuild = bot.guilds.cache.get(targetId);
        if (!targetGuild) {
            return message.reply("❌ The bot is not in the target server.");
        }

        const botMember = await targetGuild.members.fetch(bot.user.id);
        if (!botMember.permissions.has('Administrator')) {
            return message.reply("❌ The bot does not have Administrator permission in the target server.");
        }

        const highestRolePos = Math.max(...targetGuild.roles.cache.map(r => r.position));
        if (botMember.roles.highest.position < highestRolePos) {
            return message.reply("❌ The bot's role is not at the top of the role list. Please go to Server Settings -> Roles, and drag the bot's role to the very top.");
        }

        const embed = new EmbedBuilder()
            .setTitle("Z Cloner Setup")
            .setDescription(`Cloning from **${sourceGuild.name}** to **${targetGuild.name}**\n\n` +
                `**1.** Delete Existing Channels\n` +
                `**2.** Delete Existing Roles\n` +
                `**3.** Delete Emojis\n` +
                `**4.** Clone Channels\n` +
                `**5.** Clone Roles\n` +
                `**6.** Clone Emojis\n` +
                `**7.** Clone Messages (All Messages)\n` +
                `**8.** Clone Server Info (Name & Icon)`)
            .setColor('#800080');

        let options = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false };

        const createRow = (startIndex, endIndex) => {
            const row = new ActionRowBuilder();
            for (let i = startIndex; i <= endIndex; i++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`opt_${i}`)
                        .setLabel(`${i}`)
                        .setStyle(options[i] ? ButtonStyle.Success : ButtonStyle.Danger)
                );
            }
            return row;
        };

        const row1 = createRow(1, 4);
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('opt_5').setLabel('5').setStyle(options[5] ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('opt_6').setLabel('6').setStyle(options[6] ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('opt_7').setLabel('7').setStyle(options[7] ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('opt_8').setLabel('8').setStyle(options[8] ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('start_clone').setLabel('Start Cloning').setStyle(ButtonStyle.Primary)
            );

        const replyMsgs = await message.channel.send({ embeds: [embed], components: [row1, row2] });

        const collector = replyMsgs.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 300000
        });

        collector.on('collect', async i => {
            if (i.customId.startsWith('opt_')) {
                const optNum = parseInt(i.customId.split('_')[1]);
                options[optNum] = !options[optNum];

                const newRow1 = createRow(1, 4);
                const newRow2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('opt_5').setLabel('5').setStyle(options[5] ? ButtonStyle.Success : ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('opt_6').setLabel('6').setStyle(options[6] ? ButtonStyle.Success : ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('opt_7').setLabel('7').setStyle(options[7] ? ButtonStyle.Success : ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('opt_8').setLabel('8').setStyle(options[8] ? ButtonStyle.Success : ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('start_clone').setLabel('Start Cloning').setStyle(ButtonStyle.Primary)
                    );

                await i.update({ components: [newRow1, newRow2] });
            } else if (i.customId === 'start_clone') {
                collector.stop('started');
                await i.update({ components: [] });
                await message.channel.send("Starting cloning process in 3 seconds...");
                await delay(3000);
                startCloningProcess(message, sourceGuild, targetGuild, options);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'started') {
                replyMsgs.edit({ content: "Cloning menu timed out.", components: [] }).catch(() => { });
            }
        });
    }
});

async function startCloningProcess(message, sourceGuild, targetGuild, opts) {
    let logChannelId = message.channel.id;
    let logGuildId = message.guild?.id;

    async function sendLog(text) {
        try {
            const currentChannel = bot.channels.cache.get(logChannelId);
            if (logGuildId === targetGuild.id && opts[1]) {
                if (currentChannel) {
                    await currentChannel.send({ content: text }).catch(() => { });
                } else {
                    await message.author.send(`[Z Cloner Log] ${text}`).catch(() => { });
                }
            } else {
                if (currentChannel) {
                    await currentChannel.send({ content: text }).catch(() => { });
                } else {
                    await message.author.send(`[Z Cloner Log] ${text}`).catch(() => { });
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    await sendLog("Starting deletion process...");

    if (opts[1]) {
        const channels = targetGuild.channels.cache.filter(ch => ch.deletable);
        for (const [id, channel] of channels) {
            try {
                if (channel.id === logChannelId) continue;
                await channel.delete();
                await delay(1500);
            } catch { }
        }
        if (channels.has(logChannelId)) {
            const currentChannel = bot.channels.cache.get(logChannelId);
            if (currentChannel && currentChannel.deletable) {
                await message.author.send("Channel deleted. Continuing logs here...").catch(() => { });
                await currentChannel.delete().catch(() => { });
            }
        }
    }

    if (opts[2]) {
        const roles = targetGuild.roles.cache.filter(role => role.name !== '@everyone' && !role.managed && role.editable);
        for (const [id, role] of roles) {
            try {
                await role.delete();
                await delay(1500);
            } catch { }
        }
    }

    if (opts[3]) {
        const emojis = targetGuild.emojis.cache.filter(e => e.deletable);
        for (const [id, emoji] of emojis) {
            try {
                await emoji.delete();
                await delay(1500);
            } catch { }
        }
    }

    await sendLog("Cleanup complete. Starting cloning...");

    // ========== CLONE SERVER INFO (NAME & ICON) ==========
    if (opts[8]) {
        try {
            await sendLog("⚙️ Cloning Server Info (Name & Icon)...");
            const iconURL = sourceGuild.iconURL({ extension: 'png', size: 1024 });
            const editPayload = { name: sourceGuild.name };
            
            if (iconURL) {
                // Fetch the image and convert to base64 so Discord accepts it
                const response = await fetch(iconURL);
                const buffer = await response.arrayBuffer();
                const base64Icon = Buffer.from(buffer).toString('base64');
                editPayload.icon = `data:image/png;base64,${base64Icon}`;
            }
            
            await targetGuild.edit(editPayload);
            await sendLog(`✅ Server name and icon updated to match ${sourceGuild.name}!`);
            await delay(1500);
        } catch (e) {
            await sendLog(`⚠️ Failed to clone server info: ${e.message}`);
        }
    }

    const roleMapping = new Map();
    const channelMapping = new Map();

    if (opts[5]) {
        const targetEveryone = targetGuild.roles.everyone;
        const sourceEveryone = sourceGuild.roles.everyone;
        if (targetEveryone && sourceEveryone) {
            roleMapping.set(sourceEveryone.id, targetEveryone.id);
        }

        const rolesToClone = Array.from(sourceGuild.roles.cache.values())
            .filter(role => role.name !== '@everyone' && !role.managed)
            .sort((a, b) => b.position - a.position);

        for (const role of rolesToClone) {
            try {
                const newRole = await targetGuild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions.bitfield.toString(),
                    mentionable: role.mentionable,
                    reason: 'Z Cloner'
                });
                roleMapping.set(role.id, newRole.id);
                await sendLog(`Created Role: ${role.name}`);
                await delay(1500);
            } catch (e) {
                await sendLog(`⚠️ Failed to create role: ${role.name}`);
            }
        }
    }

    const mapOverwrites = (overwrites) => {
        const newOverwrites = [];
        for (const ow of overwrites.values()) {
            if (ow.type === 'role' || ow.type === 0) {
                const targetRoleId = roleMapping.get(ow.id);
                if (targetRoleId) {
                    newOverwrites.push({
                        id: targetRoleId,
                        allow: ow.allow.bitfield.toString(),
                        deny: ow.deny.bitfield.toString(),
                    });
                }
            }
        }
        return newOverwrites;
    };

    if (opts[4] || opts[7]) {
        const categoryMapping = new Map();

        const categories = Array.from(sourceGuild.channels.cache.values())
            .filter(ch => ch.type === 'GUILD_CATEGORY' || ch.type === 4)
            .sort((a, b) => a.position - b.position);

        for (const category of categories) {
            try {
                const newCat = await targetGuild.channels.create({
                    name: category.name,
                    type: 4,
                    position: category.position,
                    permissionOverwrites: mapOverwrites(category.permissionOverwrites.cache)
                });
                categoryMapping.set(category.id, newCat.id);
                await sendLog(`Created Category: ${category.name}`);
                await delay(1500);
            } catch (e) {
                await sendLog(`⚠️ Failed to create category: ${category.name}`);
            }
        }

        const textChannels = Array.from(sourceGuild.channels.cache.values())
            .filter(ch => ch.type === 'GUILD_TEXT' || ch.type === 0 || ch.type === 'GUILD_NEWS' || ch.type === 5)
            .sort((a, b) => a.position - b.position);

        for (const channel of textChannels) {
            try {
                const parentId = channel.parentId ? categoryMapping.get(channel.parentId) : null;
                const newChannel = await targetGuild.channels.create({
                    name: channel.name,
                    type: 0,
                    parent: parentId,
                    topic: channel.topic || '',
                    nsfw: channel.nsfw || false,
                    position: channel.position,
                    permissionOverwrites: mapOverwrites(channel.permissionOverwrites.cache)
                });
                channelMapping.set(channel.id, newChannel.id);
                await sendLog(`Created Text Channel: ${channel.name}`);
                await delay(1500);
            } catch (e) {
                await sendLog(`⚠️ Failed to create text channel: ${channel.name}`);
            }
        }

        const voiceChannels = Array.from(sourceGuild.channels.cache.values())
            .filter(ch => ch.type === 'GUILD_VOICE' || ch.type === 2)
            .sort((a, b) => a.position - b.position);

        for (const channel of voiceChannels) {
            try {
                const parentId = channel.parentId ? categoryMapping.get(channel.parentId) : null;
                const newChannel = await targetGuild.channels.create({
                    name: channel.name,
                    type: 2,
                    parent: parentId,
                    bitrate: Math.min(channel.bitrate || 64000, targetGuild.maximumBitrate || 96000),
                    userLimit: channel.userLimit || 0,
                    position: channel.position,
                    permissionOverwrites: mapOverwrites(channel.permissionOverwrites.cache)
                });
                channelMapping.set(channel.id, newChannel.id);
                await sendLog(`Created Voice Channel: ${channel.name}`);
                await delay(1500);
            } catch (e) {
                await sendLog(`⚠️ Failed to create voice channel: ${channel.name}`);
            }
        }
    }

    if (opts[6]) {
        let maxEmojis = 50;
        if (targetGuild.premiumTier === 1) maxEmojis = 100;
        else if (targetGuild.premiumTier === 2) maxEmojis = 150;
        else if (targetGuild.premiumTier === 3) maxEmojis = 250;

        const currentStatic = targetGuild.emojis.cache.filter(e => !e.animated).size;
        const currentAnimated = targetGuild.emojis.cache.filter(e => e.animated).size;

        const availableStatic = Math.max(0, maxEmojis - currentStatic);
        const availableAnimated = Math.max(0, maxEmojis - currentAnimated);

        const sourceStatic = Array.from(sourceGuild.emojis.cache.filter(e => !e.animated).values()).slice(0, availableStatic);
        const sourceAnimated = Array.from(sourceGuild.emojis.cache.filter(e => e.animated).values()).slice(0, availableAnimated);

        const emojisToClone = [...sourceStatic, ...sourceAnimated];

        if (emojisToClone.length === 0) {
            await sendLog("⚠️ No available emoji slots in target server. Skipping emoji cloning.");
        } else {
            for (const emoji of emojisToClone) {
                try {
                    const createPromise = targetGuild.emojis.create({ attachment: emoji.url, name: emoji.name });
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('RATE_LIMIT_HANG')), 15000));

                    await Promise.race([createPromise, timeoutPromise]);
                    await sendLog(`Created Emoji: ${emoji.name}`);
                    await delay(1500);
                } catch (e) {
                    if (e.message === 'RATE_LIMIT_HANG' || e.code === 429) {
                        await sendLog("⚠️ Emoji upload limit hit (Discord Rate Limit)! I can't clone any more emojis. Skipping the rest...");
                        break;
                    }
                    if (e.code === 30014 || String(e).includes('Maximum number of emojis reached')) {
                        await sendLog("⚠️ Maximum emoji slots reached! Skipping remaining emojis...");
                        break;
                    }
                    await sendLog(`⚠️ Failed to copy emoji: ${emoji.name}`);
                }
            }
        }
    }

    if (opts[7]) {
        await sendLog("📋 Starting message cloning (ALL messages)... This may take a VERY long time depending on server size.");
        
        const sourceTextChannels = Array.from(sourceGuild.channels.cache.values())
            .filter(ch => ch.type === 'GUILD_TEXT' || ch.type === 0 || ch.type === 'GUILD_NEWS' || ch.type === 5);

        for (const sourceChannel of sourceTextChannels) {
            const targetChannelId = channelMapping.get(sourceChannel.id);
            if (!targetChannelId) continue;

            const targetChannel = await bot.channels.fetch(targetChannelId).catch(() => null);
            if (!targetChannel) continue;

            try {
                const webhook = await targetChannel.createWebhook({
                    name: 'Z Cloner',
                    reason: 'Cloning messages'
                });

                let totalMessagesCloned = 0;

                await sendLog(`🔍 Scanning #${sourceChannel.name} to find start of history...`);
                let oldestId = undefined;
                while (true) {
                    const batch = await sourceChannel.messages.fetch({ limit: 100, before: oldestId });
                    if (batch.size === 0) break;
                    oldestId = batch.last().id;
                    await delay(1000);
                }

                if (!oldestId) {
                    await sendLog(`ℹ️ No messages found in #${sourceChannel.name}. Skipping.`);
                    continue;
                }

                await sendLog(`⏳ Cloning messages in #${sourceChannel.name}...`);
                let cursorId = oldestId;
                
                while (true) {
                    const batch = await sourceChannel.messages.fetch({ limit: 100, after: cursorId });
                    if (batch.size === 0) break;

                    const sortedMessages = Array.from(batch.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

                    for (const msg of sortedMessages) {
                        if (msg.system) continue;

                        const webhookPayload = {
                            username: msg.author.username,
                            avatarURL: msg.author.displayAvatarURL({ extension: 'png', size: 1024 }),
                            content: msg.content || '',
                            embeds: msg.embeds || []
                        };

                        if (msg.attachments.size > 0) {
                            webhookPayload.files = msg.attachments.map(att => ({ attachment: att.url, name: att.name }));
                        }

                        if (!webhookPayload.content && (!webhookPayload.files || webhookPayload.files.length === 0) && webhookPayload.embeds.length === 0) continue;

                        await webhook.send(webhookPayload).catch(() => {});
                        await delay(500);
                    }

                    totalMessagesCloned += sortedMessages.length;
                    cursorId = sortedMessages[sortedMessages.length - 1].id;
                    await delay(1000);
                }

                await sendLog(`✅ Cloned ${totalMessagesCloned} messages in #${sourceChannel.name}`);
                await delay(2000); 
            } catch (e) {
                await sendLog(`⚠️ Failed to fully clone messages in #${sourceChannel.name}: ${e.message}`);
            }
        }
    }

    await message.author.send("Z Cloner — Cloning completed successfully! ✅");
}

bot.login(BOT_TOKEN).catch(() => console.error("Invalid Bot Token"));
