import { InlineKeyboard } from 'grammy';
import { 
    getUserTopArtists, 
    getUserTopTracks, 
    getUserRecentTracks, 
    getUserLovedTracks, 
    getUserTopAlbums, 
    getUserInfo,
    getUserWeeklyArtistChart,
    getUserWeeklyTrackChart,
    getArtistInfo,
    getTrackInfo,
    formatPeriod,
    formatNumber,
    escapeHTML
} from '../lastfm.mjs';
import { getIndividualUserData } from '../utils.mjs';

// Format top artists message
export function formatTopArtistsMessage(data, period, tgUser = null) {
    const { artists, username, total } = data;
    const displayName = tgUser || username;
    
    let message = `🎤 <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Top Artists</b> (${formatPeriod(period)})\n\n`;
    
    artists.slice(0, 10).forEach((artist, index) => {
        const playcount = formatNumber(parseInt(artist.playcount));
        message += `<b>${index + 1}.</b> <a href="${artist.url}">${escapeHTML(artist.name)}</a> - ${playcount} plays\n`;
    });
    
    message += `\n📊 Total Artists: ${formatNumber(total)}`;
    
    return message;
}

// Format top tracks message
export function formatTopTracksMessage(data, period, tgUser = null) {
    const { tracks, username, total } = data;
    const displayName = tgUser || username;
    
    let message = `🎵 <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Top Tracks</b> (${formatPeriod(period)})\n\n`;
    
    tracks.slice(0, 10).forEach((track, index) => {
        const playcount = formatNumber(parseInt(track.playcount));
        const artistName = track.artist?.name || track.artist?.['#text'] || 'Unknown Artist';
        message += `<b>${index + 1}.</b> <a href="${track.url}">${escapeHTML(track.name)}</a> by ${escapeHTML(artistName)} - ${playcount} plays\n`;
    });
    
    message += `\n📊 Total Tracks: ${formatNumber(total)}`;
    
    return message;
}

// Format recent tracks message
export function formatRecentTracksMessage(data, tgUser = null) {
    const { tracks, username, total } = data;
    const displayName = tgUser || username;
    
    let message = `🕒 <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Recent Tracks</b>\n\n`;
    
    tracks.slice(0, 10).forEach((track, index) => {
        const artistName = track.artist?.name || track.artist?.['#text'] || 'Unknown Artist';
        const isNowPlaying = track['@attr']?.nowplaying === 'true';
        const timePrefix = isNowPlaying ? '🔴 Now Playing' : `⏰ ${getRelativeTime(track.date?.uts)}`;
        
        message += `<b>${index + 1}.</b> <a href="${track.url}">${escapeHTML(track.name)}</a> by ${escapeHTML(artistName)}\n`;
        message += `   ${timePrefix}\n\n`;
    });
    
    message += `📊 Total Scrobbles: ${formatNumber(total)}`;
    
    return message;
}

// Format loved tracks message
export function formatLovedTracksMessage(data, tgUser = null) {
    const { tracks, username, total } = data;
    const displayName = tgUser || username;
    
    let message = `❤️ <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Loved Tracks</b>\n\n`;
    
    tracks.slice(0, 10).forEach((track, index) => {
        const artistName = track.artist?.name || track.artist?.['#text'] || 'Unknown Artist';
        const lovedDate = track.date ? getRelativeTime(track.date.uts) : '';
        
        message += `<b>${index + 1}.</b> <a href="${track.url}">${escapeHTML(track.name)}</a> by ${escapeHTML(artistName)}\n`;
        if (lovedDate) {
            message += `   ❤️ Loved ${lovedDate}\n\n`;
        } else {
            message += '\n';
        }
    });
    
    message += `📊 Total Loved: ${formatNumber(total)}`;
    
    return message;
}

// Format top albums message
export function formatTopAlbumsMessage(data, period, tgUser = null) {
    const { albums, username, total } = data;
    const displayName = tgUser || username;
    
    let message = `💿 <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Top Albums</b> (${formatPeriod(period)})\n\n`;
    
    albums.slice(0, 10).forEach((album, index) => {
        const playcount = formatNumber(parseInt(album.playcount));
        const artistName = album.artist?.name || album.artist?.['#text'] || 'Unknown Artist';
        message += `<b>${index + 1}.</b> <a href="${album.url}">${escapeHTML(album.name)}</a> by ${escapeHTML(artistName)} - ${playcount} plays\n`;
    });
    
    message += `\n📊 Total Albums: ${formatNumber(total)}`;
    
    return message;
}

// Format user info message
export function formatUserInfoMessage(data, tgUser = null) {
    const { user, username } = data;
    const displayName = tgUser || user.name || username;
    
    const playcount = formatNumber(parseInt(user.playcount || 0));
    const trackcount = formatNumber(parseInt(user.track_count || 0));
    const artistcount = formatNumber(parseInt(user.artist_count || 0));
    const albumcount = formatNumber(parseInt(user.album_count || 0));
    
    const registered = user.registered?.unixtime ? 
        new Date(user.registered.unixtime * 1000).toLocaleDateString() : 'Unknown';
    
    let message = `📈 <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Stats</b>\n\n`;
    
    if (user.realname) {
        message += `👤 <b>Real Name:</b> ${escapeHTML(user.realname)}\n`;
    }
    
    message += `🎵 <b>Total Scrobbles:</b> ${playcount}\n`;
    message += `🎼 <b>Unique Tracks:</b> ${trackcount}\n`;
    message += `🎤 <b>Unique Artists:</b> ${artistcount}\n`;
    message += `💿 <b>Unique Albums:</b> ${albumcount}\n`;
    message += `📅 <b>Member Since:</b> ${registered}\n`;
    
    if (user.country) {
        message += `🌍 <b>Country:</b> ${escapeHTML(user.country)}\n`;
    }
    
    if (user.age && user.age !== '0') {
        message += `🎂 <b>Age:</b> ${user.age}\n`;
    }

    return message;
}

// Format weekly chart message
export function formatWeeklyChartMessage(data, type = 'artists', tgUser = null) {
    const { username, from, to } = data;
    const items = data.artists || data.tracks;
    const displayName = tgUser || username;
    
    const startDate = from ? new Date(from * 1000).toLocaleDateString() : '';
    const endDate = to ? new Date(to * 1000).toLocaleDateString() : '';
    
    const emoji = type === 'artists' ? '🎤' : '🎵';
    const title = type === 'artists' ? 'Artists' : 'Tracks';
    
    let message = `${emoji} <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Weekly ${title}</b>\n`;
    
    if (startDate && endDate) {
        message += `📅 ${startDate} - ${endDate}\n\n`;
    } else {
        message += '\n';
    }
    
    items.slice(0, 10).forEach((item, index) => {
        const playcount = formatNumber(parseInt(item.playcount));
        
        if (type === 'artists') {
            message += `<b>${index + 1}.</b> <a href="${item.url}">${escapeHTML(item.name)}</a> - ${playcount} plays\n`;
        } else {
            const artistName = item.artist?.name || item.artist?.['#text'] || 'Unknown Artist';
            message += `<b>${index + 1}.</b> <a href="${item.url}">${escapeHTML(item.name)}</a> by ${escapeHTML(artistName)} - ${playcount} plays\n`;
        }
    });
    
    return message;
}

// Create inline keyboard for Last.fm commands
export function createLastfmKeyboard(userId) {
    return new InlineKeyboard()
        .text('🎤 Top Artists', `lastfm_topartists_${userId}`)
        .text('🎵 Top Tracks', `lastfm_toptracks_${userId}`)
        .row()
        .text('💿 Top Albums', `lastfm_topalbums_${userId}`)
        .text('❤️ Loved Tracks', `lastfm_loved_${userId}`)
        .row()
        .text('🕒 Recent', `lastfm_recent_${userId}`)
        .text('📈 Stats', `lastfm_stats_${userId}`)
        .row()
        .text('📊 Weekly Artists', `lastfm_weekly_artists_${userId}`)
        .text('📊 Weekly Tracks', `lastfm_weekly_tracks_${userId}`);
}

// Create period selection keyboard
export function createPeriodKeyboard(command, userId) {
    return new InlineKeyboard()
        .text('7 Days', `${command}_7day_${userId}`)
        .text('1 Month', `${command}_1month_${userId}`)
        .row()
        .text('3 Months', `${command}_3month_${userId}`)
        .text('6 Months', `${command}_6month_${userId}`)
        .row()
        .text('1 Year', `${command}_12month_${userId}`)
        .text('All Time', `${command}_overall_${userId}`)
        .row()
        .text('← Back', `lastfm_menu_${userId}`);
}

// Get relative time helper
function getRelativeTime(timestamp) {
    if (!timestamp) return "N/A";
    
    const now = Date.now() / 1000;
    const diffSeconds = now - parseInt(timestamp);
    
    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutes ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hours ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} days ago`;
    if (diffSeconds < 2629746) return `${Math.floor(diffSeconds / 604800)} weeks ago`;
    if (diffSeconds < 31556952) return `${Math.floor(diffSeconds / 2629746)} months ago`;
    
    return `${Math.floor(diffSeconds / 31556952)} years ago`;
}

// Main handler for Last.fm commands in groups
export async function handleLastfmCommand(bot, ctx, userId) {
    try {
        console.log(`handleLastfmCommand called with userId: ${userId}`);
        const userData = await getIndividualUserData(userId);
        console.log(`Main command userData:`, userData ? 'found' : 'not found');
        
        if (!userData?.lastfmUsername) {
            console.log(`No lastfm username found for userId: ${userId}`);
            return ctx.reply("You need to set your Last.fm username first. Send me a private message with the command: /setlastfm username");
        }

        const keyboard = createLastfmKeyboard(userId);
        console.log(`Created keyboard for userId: ${userId}`);
        
        const message = `🎧 <b>Last.fm Menu for <a href="https://www.last.fm/user/${encodeURIComponent(userData.lastfmUsername)}">${escapeHTML(userData.tgUser || userData.lastfmUsername)}</a></b>\n\nChoose what you want to see:`;

        await ctx.reply(message, {
            parse_mode: 'HTML',
            reply_markup: keyboard,
            disable_web_page_preview: true
        });

    } catch (error) {
        console.error('Error in handleLastfmCommand:', error);
        await ctx.reply("Failed to load Last.fm menu. Please try again later.");
    }
}

// Handle callback queries for Last.fm features
export async function handleLastfmCallback(bot, ctx) {
    const callbackData = ctx.callbackQuery.data;
    
    try {
        await ctx.answerCallbackQuery();

        // Parse callback data - handle different formats
        let command, period, userId;
        
        if (callbackData.startsWith('lastfm_')) {
            const parts = callbackData.split('_');
            
            if (parts.length === 3) {
                // Format: lastfm_command_userId (e.g., lastfm_topartists_12345)
                [, command, userId] = parts;
                period = null;
            } else if (parts.length === 4) {
                // Format: lastfm_command_period_userId (e.g., lastfm_topartists_7day_12345)
                // OR lastfm_weekly_type_userId (e.g., lastfm_weekly_artists_12345)
                [, command, period, userId] = parts;
                
                // Handle special case for weekly commands
                if (command === 'weekly') {
                    // period is actually the chart type (artists/tracks)
                    // keep as is
                }
            } else {
                console.error('Invalid callback data format:', callbackData);
                return;
            }
        } else {
            console.error('Invalid callback data prefix:', callbackData);
            return;
        }

        // Get user data to access tgUser
        const userData = await getIndividualUserData(userId);
        console.log(`Callback userId: ${userId}, userData:`, userData ? 'found' : 'not found');
        
        if (!userData?.lastfmUsername) {
            console.log(`No lastfm username for userId: ${userId}`);
            await ctx.editMessageText("❌ You need to set your Last.fm username first. Send me a private message with the command: /setlastfm username");
            return;
        }
        
        const tgUser = userData?.tgUser;

        switch (command) {
            case 'menu':
                // Edit message to show main menu instead of sending new message
                const keyboard = createLastfmKeyboard(userId);
                const menuMessage = `🎧 <b>Last.fm Menu for <a href="https://www.last.fm/user/${encodeURIComponent(userData.lastfmUsername)}">${escapeHTML(userData.tgUser || userData.lastfmUsername)}</a></b>\n\nChoose what you want to see:`;
                
                await ctx.editMessageText(menuMessage, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard,
                    disable_web_page_preview: true
                });
                break;

            case 'topartists':
                if (!period) {
                    const keyboard = createPeriodKeyboard('lastfm_topartists', userId);
                    await ctx.editMessageText('🎤 <b>Select time period for Top Artists:</b>', {
                        parse_mode: 'HTML',
                        reply_markup: keyboard
                    });
                } else {
                    const result = await getUserTopArtists(userId, period, 10);
                    if (result.error) {
                        await ctx.editMessageText(`❌ ${result.error}`);
                    } else {
                        const message = formatTopArtistsMessage(result.data, period, tgUser);
                        const backKeyboard = new InlineKeyboard().text('← Back to Menu', `lastfm_menu_${userId}`);
                        await ctx.editMessageText(message, {
                            parse_mode: 'HTML',
                            reply_markup: backKeyboard,
                            disable_web_page_preview: true
                        });
                    }
                }
                break;

            case 'toptracks':
                if (!period) {
                    const keyboard = createPeriodKeyboard('lastfm_toptracks', userId);
                    await ctx.editMessageText('🎵 <b>Select time period for Top Tracks:</b>', {
                        parse_mode: 'HTML',
                        reply_markup: keyboard
                    });
                } else {
                    const result = await getUserTopTracks(userId, period, 10);
                    if (result.error) {
                        await ctx.editMessageText(`❌ ${result.error}`);
                    } else {
                        const message = formatTopTracksMessage(result.data, period, tgUser);
                        const backKeyboard = new InlineKeyboard().text('← Back to Menu', `lastfm_menu_${userId}`);
                        await ctx.editMessageText(message, {
                            parse_mode: 'HTML',
                            reply_markup: backKeyboard,
                            disable_web_page_preview: true
                        });
                    }
                }
                break;

            case 'topalbums':
                if (!period) {
                    const keyboard = createPeriodKeyboard('lastfm_topalbums', userId);
                    await ctx.editMessageText('💿 <b>Select time period for Top Albums:</b>', {
                        parse_mode: 'HTML',
                        reply_markup: keyboard
                    });
                } else {
                    const result = await getUserTopAlbums(userId, period, 10);
                    if (result.error) {
                        await ctx.editMessageText(`❌ ${result.error}`);
                    } else {
                        const message = formatTopAlbumsMessage(result.data, period, tgUser);
                        const backKeyboard = new InlineKeyboard().text('← Back to Menu', `lastfm_menu_${userId}`);
                        await ctx.editMessageText(message, {
                            parse_mode: 'HTML',
                            reply_markup: backKeyboard,
                            disable_web_page_preview: true
                        });
                    }
                }
                break;

            case 'recent':
                const recentResult = await getUserRecentTracks(userId, 10);
                if (recentResult.error) {
                    await ctx.editMessageText(`❌ ${recentResult.error}`);
                } else {
                    const message = formatRecentTracksMessage(recentResult.data, tgUser);
                    const backKeyboard = new InlineKeyboard().text('← Back to Menu', `lastfm_menu_${userId}`);
                    await ctx.editMessageText(message, {
                        parse_mode: 'HTML',
                        reply_markup: backKeyboard,
                        disable_web_page_preview: true
                    });
                }
                break;

            case 'loved':
                const lovedResult = await getUserLovedTracks(userId, 10);
                if (lovedResult.error) {
                    await ctx.editMessageText(`❌ ${lovedResult.error}`);
                } else {
                    const message = formatLovedTracksMessage(lovedResult.data, tgUser);
                    const backKeyboard = new InlineKeyboard().text('← Back to Menu', `lastfm_menu_${userId}`);
                    await ctx.editMessageText(message, {
                        parse_mode: 'HTML',
                        reply_markup: backKeyboard,
                        disable_web_page_preview: true
                    });
                }
                break;

            case 'stats':
                const statsResult = await getUserInfo(userId);
                if (statsResult.error) {
                    await ctx.editMessageText(`❌ ${statsResult.error}`);
                } else {
                    const message = formatUserInfoMessage(statsResult.data, tgUser);
                    const backKeyboard = new InlineKeyboard().text('← Back to Menu', `lastfm_menu_${userId}`);
                    await ctx.editMessageText(message, {
                        parse_mode: 'HTML',
                        reply_markup: backKeyboard,
                        disable_web_page_preview: true
                    });
                }
                break;

            case 'weekly':
                const chartType = period; // 'artists' or 'tracks'
                const weeklyResult = chartType === 'artists' ? 
                    await getUserWeeklyArtistChart(userId) : 
                    await getUserWeeklyTrackChart(userId);
                
                if (weeklyResult.error) {
                    await ctx.editMessageText(`❌ ${weeklyResult.error}`);
                } else {
                    const message = formatWeeklyChartMessage(weeklyResult.data, chartType, tgUser);
                    const backKeyboard = new InlineKeyboard().text('← Back to Menu', `lastfm_menu_${userId}`);
                    await ctx.editMessageText(message, {
                        parse_mode: 'HTML',
                        reply_markup: backKeyboard,
                        disable_web_page_preview: true
                    });
                }
                break;
        }

    } catch (error) {
        console.error('Error in handleLastfmCallback:', error);
        await ctx.answerCallbackQuery("An error occurred. Please try again.");
    }
}
