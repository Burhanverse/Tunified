import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { initializeDatabase } from './src/utils.mjs';
import { checkAndPostNowPlaying } from './src/handlers/nowPlaying.mjs';
import { setupUserCommands } from './src/handlers/userCommands.mjs';
import { setupGroupCommands } from './src/handlers/group.mjs';

dotenv.config();

const BOT_TOKEN = process.env.TOKEN;
const bot = new Bot(BOT_TOKEN);
console.log('Bot token:', BOT_TOKEN);

await initializeDatabase();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

setupUserCommands(bot);
setupGroupCommands(bot);

function initialize() {
    setInterval(() => checkAndPostNowPlaying(bot), 5000);
}

bot.on('message', (ctx) => {
    console.log('Received message:', ctx.message);
});

initialize();

bot.start();
console.log('Bot is running!');
export { checkAndPostNowPlaying };
