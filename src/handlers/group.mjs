import { sendNowPlaying } from './gcPlay.mjs';

export function setupGroupCommands(bot) {
    bot.command('lastfm', async (ctx) => {
        const userId = ctx.from.id.toString();
        const chatType = ctx.chat.type;

        if (!['group', 'supergroup'].includes(chatType)) return;

        try {
            const result = await sendNowPlaying(bot, ctx.chat.id, userId, true);

            if (result.error) {
                return ctx.reply(result.error);
            }
        } catch (error) {
            console.error('Error handling /lastfm command:', error);
            ctx.reply("Failed to fetch current track. Please try again later.");
        }
    });
}