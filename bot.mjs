import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { initializeDatabase } from './src/utils.mjs';
import { chPlaying } from './src/handlers/chPlay.mjs';
import { userCommands } from './src/handlers/commands.mjs';
dotenv.config();

const BOT_TOKEN = process.env.TOKEN;
const bot = new Bot(BOT_TOKEN);

await initializeDatabase();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

await bot.api.setMyCommands([
    { command: "start", description: "Start the bot.." },
    { command: "tune", description: "Latest scrobbled track from lastfm.." },
    { command: "tunify", description: "Your Last.fm statistics and charts.." },
    { command: "recent", description: "Your recent tracks.." },
    { command: "flex", description: "Flex your Last.fm stats.." },
    { command: "top_artists", description: "Your top artists (last 7 days).." },
    { command: "top_tracks", description: "Your top tracks (last 7 days).." },
    { command: "setlastfm", description: "Your lastfm_username for scrobbling.." },
    { command: "setname", description: "Your nick_name.." },
    { command: "setchannel", description: "Your channel_id required for channels only.." },
    { command: "help", description: "Get some drugs.." },
    { command: "stats", description: "Show bot server stats.." },
    { command: "about", description: "Show information about the bot.." },
]);

userCommands(bot);

function initialize() {
    setInterval(() => chPlaying(bot), 5000);
}

initialize();

bot.start({
    drop_pending_updates: true,
});
console.log('Bot is running!');
