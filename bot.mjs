import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { initializeDatabase, saveUserData, getUserData, fetchNowPlaying, createText, getReplyMarkup } from './src/utils.mjs';
import { getSpotifyDetails } from './src/spotify.mjs';
import { getYouTubeMusicDetails } from './src/youtube.mjs';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
console.log('Bot token:', process.env.TELEGRAM_BOT_TOKEN);

// Initialize MongoDB and create necessary collections
await initializeDatabase();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Bot commands
bot.start((ctx) => {
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
        return ctx.reply("Please provide a channel ID using `/setchannel [channel ID]`.");
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
        return ctx.reply("Please provide a Last.fm username using `/setlastfm [username]`.");
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
            let details = await getSpotifyDetails(track.artistName, track.trackName) || 
                          await getYouTubeMusicDetails(track.artistName, track.trackName);

            if (!details) {
                console.error('Could not fetch details from Spotify or YouTube Music');
                continue;
            }

            const { albumCover, id } = details;
            const text = createText({ ...track, ...user });
            const replyMarkup = getReplyMarkup({ id, artistName: track.artistName });

            try {
                if (user.lastMessageId) {
                    await bot.telegram.editMessageMedia(
                        user.channelId,
                        user.lastMessageId,
                        null,
                        {
                            type: 'photo',
                            media: albumCover,
                            caption: text,
                            parse_mode: 'HTML'
                        },
                        replyMarkup
                    );
                } else {
                    const message = await bot.telegram.sendPhoto(user.channelId, albumCover, {
                        caption: text,
                        parse_mode: 'HTML',
                        ...replyMarkup
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
    setInterval(checkAndPostNowPlaying, 5000); // Check every 5 seconds
}

// Add this to log all incoming messages
bot.on('message', (ctx) => {
    console.log('Received message:', ctx.message);
});

initialize();

bot.launch().then(() => {
    console.log('Bot is running!');
});
