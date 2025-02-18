import { saveUserData } from '../utils.mjs';

export function setupUserCommands(bot) {
    bot.command('start', (ctx) => {
        ctx.reply(
            'Tunified bot fetches the currently playing song from Last.fm and posts details about the song to a specified channel.\n\n' +
            'Firstly Add the bot as Admin to your channel and then use the setup cmds accordingly,\n' +
            'Setup Commands:\n' +
            '/setname your_nickname - To be shown on the post.\n' +
            '/setchannel channel_id - Use @chatidrobot to get ID.\n' +
            '/setlastfm lastfm_username - Last.FM username for scrobbling.',
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
            return ctx.reply("Please provide a channel ID using `/setchannel`. You can use @chatidrobot to get ID.");
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
}