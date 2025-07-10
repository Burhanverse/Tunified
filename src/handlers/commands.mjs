import fs from 'fs';
import path from 'path';
import util from 'util';
import { exec } from 'child_process';
import prettyBytes from 'pretty-bytes';
import { getIndividualUserData, saveUserData } from '../utils.mjs';
import { sendNowPlaying, refreshNowPlaying } from './gcPlay.mjs';
import { handleLastfmCommand, handleLastfmCallback } from './lastfmFeatures.mjs';
import { 
  handleTopArtistsCommand, 
  handleTopTracksCommand, 
  handleRecentTracksCommand, 
  handleFlexCommand,
  checkLastfmUser,
  getUserIdFromContext,
  isGroupCommand
} from './quickCommands.mjs';

const execPromise = util.promisify(exec);
const botStartTime = Date.now();

// Safe reaction helper function
const safeReact = async (ctx, emoji) => {
  try {
    await ctx.react(emoji);
  } catch (error) {
    // Silently fail if reaction is not supported or permissions are insufficient
    console.log(`Could not react with ${emoji}: ${error.description || error.message}`);
  }
};

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

export function userCommands(bot) {
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`, err.error);
  });

  bot.command(['start', 'help'], async (ctx) => {
    await safeReact(ctx, "😍");
    const content =
      '<i>Tunified bot fetches the currently playing song from Last.fm and shares it on Telegram.</i>\n\n' +
      '<i>Firstly, add the bot as Admin to your channel or group and then use the setup commands accordingly.</i>\n\n' +
      '<b>Available Commands:</b>\n' +
      '/lastfm - <i>Latest scrobbled track.</i>\n' +
      '/fm - <i>Alias for lastfm command.</i>\n' +
      '/tune - <i>Alias for lastfm command.</i>\n' +
      '/tunify - <i>Your Last.fm statistics and charts.</i>\n' +
      '/top_artists - <i>Your top artists (last 7 days).</i>\n' +
      '/top_tracks - <i>Your top tracks (last 7 days).</i>\n' +
      '/recent - <i>Your recent tracks.</i>\n' +
      '/flex - <i>Flex your Last.fm stats with profile picture.</i>\n' +
      '/setname your_nickname - <i>To be shown on the post.</i>\n' +
      '/setlastfm lastfm_username - <i>Last.FM username required for scrobbling.</i>\n' +
      '/setchannel channel_id - <i>Required only for channels. Use @chatidrobot to get the ID.</i>\n' +
      '/stats - <i>Get server stats.</i>\n' +
      '/help - <i>Show this help message.</i>\n' +
      '/about - <i>Get information about the bot.</i>';

    await ctx.reply(content, { parse_mode: 'HTML' });
  });

  bot.command('setname', async (ctx) => {
    await safeReact(ctx, "⚡");
    
    const value = ctx.message.text.split(' ').slice(1).join(' ');
    const userId = ctx.from.id.toString();

    if (!value) {
      return ctx.reply("Please provide a name using `/setname [your name]`.");
    }

    await saveUserData(userId, { tgUser: value });
    return ctx.reply(`Name has been set to ${value}.`);
  });

  bot.command('setchannel', async (ctx) => {
    await safeReact(ctx, "⚡");
    
    const value = ctx.message.text.split(' ').slice(1).join(' ');
    const userId = ctx.from.id.toString();

    if (!value) {
      return ctx.reply("Please provide a channel ID using `/setchannel`. You can use @chatidrobot to get the ID.");
    }

    await saveUserData(userId, { channelId: value });
    return ctx.reply(`Channel ID has been set to ${value}.`);
  });

  bot.command('setlastfm', async (ctx) => {
    await safeReact(ctx, "⚡");
    
    const value = ctx.message.text.split(' ').slice(1).join(' ');
    const userId = ctx.from.id.toString();

    if (!value) {
      return ctx.reply("Please provide your Last.fm username using `/setlastfm [username]`.");
    }

    await saveUserData(userId, { lastfmUsername: value });
    return ctx.reply(`Last.fm username has been set to ${value}.`);
  });

  bot.command(['tune', 'fm', 'lastfm'], async (ctx) => {
    await safeReact(ctx, "🔥");

    const userId = (ctx.from?.id || ctx.channelPost?.sender_chat?.id)?.toString();
    if (!userId) {
      await ctx.reply("Could not identify sender.");
      return;
    }

    if (!['group', 'supergroup'].includes(ctx.chat.type)) return;

    try {
      const userData = await getIndividualUserData(userId);
      if (!userData?.lastfmUsername) {
        return ctx.reply(`You need to set your Last.fm username first. Use the command: /setlastfm username`);
      }

      const result = await sendNowPlaying(bot, ctx.chat.id, userId, true);

      if (result.error) {
        return ctx.reply(result.error);
      }
    } catch (error) {
      console.error('Error handling /lastfm command:', error);
      ctx.reply("Failed to fetch current track. Please try again later.");
    }
  });

  bot.command('tunify', async (ctx) => {
    await safeReact(ctx, "⚡");

    const userId = getUserIdFromContext(ctx);
    if (!userId) {
      await ctx.reply("Could not identify sender.");
      return;
    }

    if (!['group', 'supergroup'].includes(ctx.chat.type)) return;

    try {
      await handleLastfmCommand(bot, ctx, userId);
    } catch (error) {
      console.error('Error handling /tunify command:', error);
      ctx.reply("Failed to load Last.fm menu. Please try again later.");
    }
  });

  bot.command('top_artists', async (ctx) => {
    await safeReact(ctx, "⚡");

    const userId = getUserIdFromContext(ctx);
    if (!userId) {
      await ctx.reply("Could not identify sender.");
      return;
    }

    if (!isGroupCommand(ctx)) return;

    if (await checkLastfmUser(ctx, userId)) {
      await handleTopArtistsCommand(ctx, userId);
    }
  });

  bot.command('top_tracks', async (ctx) => {
    await safeReact(ctx, "⚡");

    const userId = getUserIdFromContext(ctx);
    if (!userId) {
      await ctx.reply("Could not identify sender.");
      return;
    }

    if (!isGroupCommand(ctx)) return;

    if (await checkLastfmUser(ctx, userId)) {
      await handleTopTracksCommand(ctx, userId);
    }
  });

  bot.command('recent', async (ctx) => {
    await safeReact(ctx, "⚡");

    const userId = getUserIdFromContext(ctx);
    if (!userId) {
      await ctx.reply("Could not identify sender.");
      return;
    }

    if (!isGroupCommand(ctx)) return;

    if (await checkLastfmUser(ctx, userId)) {
      await handleRecentTracksCommand(ctx, userId);
    }
  });

  bot.command('flex', async (ctx) => {
    await safeReact(ctx, "⚡");

    const userId = getUserIdFromContext(ctx);
    if (!userId) {
      await ctx.reply("Could not identify sender.");
      return;
    }

    if (!isGroupCommand(ctx)) return;

    if (await checkLastfmUser(ctx, userId)) {
      await handleFlexCommand(ctx, userId);
    }
  });

  bot.command('stats', async (ctx) => {
    await safeReact(ctx, "👌");
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
    await safeReact(ctx, "👌");
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

  bot.on('callback_query:data', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    
    // Handle refresh callbacks
    if (callbackData.startsWith('refresh_')) {
      const [action, userId] = callbackData.split('_');
      const messageId = ctx.callbackQuery.message.message_id;
      await refreshNowPlaying(bot, ctx.chat.id, userId, messageId);
      await ctx.answerCallbackQuery();
    }
    // Handle Last.fm feature callbacks
    else if (callbackData.startsWith('lastfm_')) {
      await handleLastfmCallback(bot, ctx);
    }
  });
}
