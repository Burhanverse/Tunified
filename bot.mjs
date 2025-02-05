import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { initializeDatabase, saveUserData, getUserData, fetchNowPlaying, createText, getReplyMarkup } from './src/utils.mjs';
import { getYouTubeMusicDetails } from './src/youtube.mjs';

dotenv.config();

const BOT_TOKEN = process.env.TOKEN;
const bot = new Bot(BOT_TOKEN);
console.log('Bot token:', BOT_TOKEN);

await initializeDatabase();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Bot commands
bot.command('start', (ctx) => {
    ctx.reply(
        'Tunified bot fetches the currently playing song from Last.fm and posts details about the song to a specified channel.\n\n' +
        'Firstly Add the bot as Admin to your channnel and then use the setup cmds accordingly,\n' +
        'Setup Commands:\n' +
        '/setname your_nickname - To be shown on the post.\n' +
        '/setchannel channel_id - Use @chatidrobot to get ID.\n' +
        '/setlastfm lastfm_username - Last.FM usrname for scrobbling.',
        { parse_mode: 'HTML' }
    );
});

// Command to set the user's name
bot.command('setname', async (ctx) => {
    const value = ctx.message.text.split(' ').slice(1).join(' ');
    const userId = ctx.from.id.toString();
    console.log('Received /setname command from user:', userId);

    if (!value) {
        return ctx.reply("Please provide a name using `/setname [your name]`.");
    }

    console.log('Saving user data:', { userId, tgUser: value });
    await saveUserData(userId, { tgUser: value });
    return ctx.reply(`Name has been set to ${value}.`);
});

// Command to set the user's channel ID
bot.command('setchannel', async (ctx) => {
    const value = ctx.message.text.split(' ').slice(1).join(' ');
    const userId = ctx.from.id.toString();
    console.log('Received /setchannel command from user:', userId);

    if (!value) {
        return ctx.reply("Please provide a channel ID using `/setchannel` you cam Use @chatidrobot to get ID.");
    }
    console.log('Saving user data:', { userId, channelId: value });
    await saveUserData(userId, { channelId: value });
    return ctx.reply(`Channel ID has been set to ${value}.`);
});

// Command to set the user's Last.fm username
bot.command('setlastfm', async (ctx) => {
    const value = ctx.message.text.split(' ').slice(1).join(' ');
    const userId = ctx.from.id.toString();
    console.log('Received /setlastfm command from user:', userId);

    if (!value) {
        return ctx.reply("Please provide your Last.fm username using `/setlastfm [username]`.");
    }

    console.log('Saving user data:', { userId, lastfmUsername: value });
    await saveUserData(userId, { lastfmUsername: value });
    return ctx.reply(`Last.fm username has been set to ${value}.`);
});

async function checkAndPostNowPlaying() {
    const users = await getUserData();
    if (!users || !Array.isArray(users)) {
        console.error("No users found or users is not an array");
        return;
    }
    for (const user of users) {
        const track = await fetchNowPlaying(user.userId);
        if (track) {
            let details = await getYouTubeMusicDetails(track.artistName, track.trackName);

            if (!details) {
                console.error('Could not fetch details from YouTube Music');
                continue;
            }

            const { albumCover, id } = details;
            const text = createText({ ...track, ...user });
            const replyMarkup = getReplyMarkup({ id, artistName: track.artistName });

            try {
                if (user.lastMessageId) {
                    await bot.api.editMessageMedia(
                        user.channelId,
                        user.lastMessageId,
                        {
                            type: 'photo',
                            media: albumCover,
                            caption: text,
                            parse_mode: 'HTML'
                        },
                        { reply_markup: replyMarkup.reply_markup }
                    );
                } else {
                    const message = await bot.api.sendPhoto(user.channelId, albumCover, {
                        caption: text,
                        parse_mode: 'HTML',
                        reply_markup: replyMarkup.reply_markup
                    });

                    await saveUserData(user.userId, { lastMessageId: message.message_id });
                }
            } catch (error) {
                console.error("Error posting to Telegram:", error);
            }
        }
    }
}

function initialize() {
    setInterval(checkAndPostNowPlaying, 5000);
}

bot.on('message', (ctx) => {
    console.log('Received message:', ctx.message);
});

initialize();

bot.start();
console.log('Bot is running!');
