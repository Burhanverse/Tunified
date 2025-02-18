import fs from 'fs';
import path from 'path';
import { saveUserData } from '../utils.mjs';
import { exec } from 'child_process';
import util from 'util';
import prettyBytes from 'pretty-bytes';

const execPromise = util.promisify(exec);
const botStartTime = Date.now();

// Escape HTML helper
const escapeHTML = (text) => {
    return text.replace(/[<>"'’]/g, (char) => {
        switch (char) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            case '’': return '&#8217;';
            default: return char;
        }
    });
};

// Function to format uptime
const formatUptime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000) % 60;
    const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
    const hours = Math.floor(milliseconds / (1000 * 60 * 60)) % 24;
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const getBotDetails = () => {
    const packageJsonPath = path.resolve('./package.json');
    try {
        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return {
            version: packageData.version || 'Unknown',
            apivar: packageData.apivar || 'N/A',
            description: packageData.description || 'No description available.',
            author: packageData.author || 'Unknown',
            homepage: packageData.homepage || '#',
            issues: packageData.bugs?.url || '#',
            license: packageData.license || 'Unknown',
            copyright: packageData.copyright || '',
        };
    } catch (err) {
        console.error('Failed to read package.json:', err.message);
        return { version: 'Unknown' };
    }
};

export function setupUserCommands(bot) {
    bot.command('start', (ctx) => {
        ctx.reply(
            'Tunified bot fetches the currently playing song from Last.fm and shares it on Telegram.\n\n' +
            'Firstly, add the bot as Admin to your channel or group and then use the setup commands accordingly.\n' +
            'Setup Commands:\n' +
            '/lastfm - Latest scrobbled track.\n' +
            '/setname your_nickname - To be shown on the post.\n' +
            '/setlastfm lastfm_username - Last.FM username for scrobbling.\n' +
            '/setchannel channel_id - Required only for channels. Use @chatidrobot to get the ID.\n', +
            '/stats - Get server stats.\n' +
        '/about - Get information about the bot.',
            { parse_mode: 'HTML' }
        );
    });

    bot.command('help', (ctx) => {
        ctx.reply(
            'Tunified bot fetches the currently playing song from Last.fm and shares it on Telegram.\n\n' +
            'Firstly, add the bot as Admin to your channel or group and then use the setup commands accordingly.\n' +
            'Setup Commands:\n' +
            '/lastfm - Latest scrobbled track.\n' +
            '/setname your_nickname - To be shown on the post.\n' +
            '/setlastfm lastfm_username - Last.FM username for scrobbling.\n' +
            '/setchannel channel_id - Required only for channels. Use @chatidrobot to get the ID.\n', +
            '/stats - Get server stats.\n' +
        '/about - Get information about the bot.',
            { parse_mode: 'HTML' }
        );
    });

    bot.command('setname', async (ctx) => {
        if (ctx.chat.type !== 'private') {
            return ctx.reply("Please use this command in a private chat with the bot.");
        }

        const value = ctx.message.text.split(' ').slice(1).join(' ');
        const userId = ctx.from.id.toString();

        if (!value) {
            return ctx.reply("Please provide a name using `/setname [your name]`.");
        }

        await saveUserData(userId, { tgUser: value });
        return ctx.reply(`Name has been set to ${value}.`);
    });

    bot.command('setchannel', async (ctx) => {
        if (ctx.chat.type !== 'private') {
            return ctx.reply("Please use this command in a private chat with the bot.");
        }

        const value = ctx.message.text.split(' ').slice(1).join(' ');
        const userId = ctx.from.id.toString();

        if (!value) {
            return ctx.reply("Please provide a channel ID using `/setchannel`. You can use @chatidrobot to get the ID.");
        }

        await saveUserData(userId, { channelId: value });
        return ctx.reply(`Channel ID has been set to ${value}.`);
    });

    bot.command('setlastfm', async (ctx) => {
        const value = ctx.message.text.split(' ').slice(1).join(' ');
        const userId = ctx.from.id.toString();

        if (!value) {
            return ctx.reply("Please provide your Last.fm username using `/setlastfm [username]`.");
        }

        await saveUserData(userId, { lastfmUsername: value });
        return ctx.reply(`Last.fm username has been set to ${value}.`);
    });

    bot.command('stats', async (ctx) => {
        const start = Date.now();

        try {
            const botUptime = formatUptime(Date.now() - botStartTime);
            const { stdout: networkOutput } = await execPromise('cat /sys/class/net/eth0/statistics/rx_bytes /sys/class/net/eth0/statistics/tx_bytes');
            const [rxBytes, txBytes] = networkOutput.trim().split('\n').map((val) => parseInt(val, 10));
            const inbound = prettyBytes(rxBytes);
            const outbound = prettyBytes(txBytes);

            const ping = Date.now() - start;

            const stats =
                `<i><b>Bot Server Stats</b></i>\n\n` +
                `⋗ <b>Ping:</b> <i>${ping} ms</i>\n` +
                `⋗ <b>Uptime:</b> <i>${botUptime}</i>\n` +
                `⋗ <b>Inbound:</b> <i>${inbound}</i>\n` +
                `⋗ <b>Outbound:</b> <i>${outbound}</i>`;

            await ctx.reply(stats, { parse_mode: 'HTML' });

        } catch (err) {
            console.error('Error in /stats command:', err);
            await ctx.reply('<i>An error occurred while fetching server stats. Please try again later.</i>',
                { parse_mode: 'HTML' }
            );
        }
    });

    bot.command('about', async (ctx) => {
        const { version, apivar, description, author, homepage, issues, license, copyright } = getBotDetails();
        const message =
            `<b>About Bot:</b> <i>${escapeHTML(description)}</i>\n\n` +
            `⋗ <b>Client Version:</b> <i>${escapeHTML(version)}</i>\n` +
            `⋗ <b>Parser API:</b> <i>${escapeHTML(apivar)}</i>\n` +
            `⋗ <b>Author:</b> <i>${escapeHTML(author)}</i>\n` +
            `⋗ <b>Issues:</b> <i><a href="${escapeHTML(issues)}">Report Now!</a></i>\n` +
            `⋗ <b>Project Page:</b> <i><a href="${escapeHTML(homepage)}">Check Now!</a></i>\n` +
            `⋗ <b>License:</b> <i>${escapeHTML(license)}</i>\n` +
            `⋗ <b>Copyright:</b> <i>${escapeHTML(copyright)}</i>`;

        await ctx.reply(message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });
    });
}
