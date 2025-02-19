import { Bot } from 'grammy';
import dotenv from 'dotenv';
import { initializeDatabase } from './src/utils.mjs';
import { chPlaying } from './src/handlers/chPlay.mjs';
import { userCommands } from './src/handlers/commands.mjs';
dotenv.config();

const BOT_TOKEN = process.env.TOKEN;
const bot = new Bot(BOT_TOKEN);
console.log('Bot token:', BOT_TOKEN);

await initializeDatabase();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

userCommands(bot);

function initialize() {
    setInterval(() => chPlaying(bot), 5000);
}

initialize();

bot.start();
console.log('Bot is running!');
