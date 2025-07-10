import { handleLastfmCommand } from './lastfmFeatures.mjs';
import { sendNowPlaying } from './gcPlay.mjs';
import { getIndividualUserData } from '../utils.mjs';
import { 
    getUserTopArtists, 
    getUserTopTracks, 
    getUserRecentTracks, 
    getUserLovedTracks, 
    getUserTopAlbums, 
    getUserInfo,
    formatPeriod,
    formatNumber,
    escapeHTML
} from '../lastfm.mjs';

// Quick commands for specific Last.fm features (can be added to commands.mjs)

// Command for top artists with default period
export async function handleTopArtistsCommand(ctx, userId, period = '7day') {
    try {
        const userData = await getIndividualUserData(userId);
        const result = await getUserTopArtists(userId, period, 5);
        if (result.error) {
            return ctx.reply(`❌ ${result.error}`);
        }

        const { artists, username } = result.data;
        const displayName = userData?.tgUser || username;
        let message = `🎤 <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Top Artists</b> (${formatPeriod(period)})\n\n`;
        
        artists.forEach((artist, index) => {
            const playcount = formatNumber(parseInt(artist.playcount));
            message += `<b>${index + 1}.</b> ${escapeHTML(artist.name)} - ${playcount} plays\n`;
        });

        await ctx.reply(message, { 
            parse_mode: 'HTML',
            disable_web_page_preview: true 
        });
    } catch (error) {
        console.error('Error in handleTopArtistsCommand:', error);
        await ctx.reply("Failed to fetch top artists. Please try again later.");
    }
}

// Command for top tracks with default period
export async function handleTopTracksCommand(ctx, userId, period = '7day') {
    try {
        const userData = await getIndividualUserData(userId);
        const result = await getUserTopTracks(userId, period, 5);
        if (result.error) {
            return ctx.reply(`❌ ${result.error}`);
        }

        const { tracks, username } = result.data;
        const displayName = userData?.tgUser || username;
        let message = `🎵 <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Top Tracks</b> (${formatPeriod(period)})\n\n`;
        
        tracks.forEach((track, index) => {
            const playcount = formatNumber(parseInt(track.playcount));
            const artistName = track.artist?.name || track.artist?.['#text'] || 'Unknown Artist';
            message += `<b>${index + 1}.</b> ${escapeHTML(track.name)} by ${escapeHTML(artistName)} - ${playcount} plays\n`;
        });

        await ctx.reply(message, { 
            parse_mode: 'HTML',
            disable_web_page_preview: true 
        });
    } catch (error) {
        console.error('Error in handleTopTracksCommand:', error);
        await ctx.reply("Failed to fetch top tracks. Please try again later.");
    }
}

// Command for recent tracks
export async function handleRecentTracksCommand(ctx, userId) {
    try {
        const userData = await getIndividualUserData(userId);
        const result = await getUserRecentTracks(userId, 5);
        if (result.error) {
            return ctx.reply(`❌ ${result.error}`);
        }

        const { tracks, username } = result.data;
        const displayName = userData?.tgUser || username;
        let message = `🕒 <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Recent Tracks</b>\n\n`;
        
        tracks.forEach((track, index) => {
            const artistName = track.artist?.name || track.artist?.['#text'] || 'Unknown Artist';
            const isNowPlaying = track['@attr']?.nowplaying === 'true';
            const status = isNowPlaying ? '🔴 Now Playing' : '⏸️ Recently played';
            
            message += `<b>${index + 1}.</b> ${escapeHTML(track.name)} by ${escapeHTML(artistName)}\n`;
            message += `   ${status}\n\n`;
        });

        await ctx.reply(message, { 
            parse_mode: 'HTML',
            disable_web_page_preview: true 
        });
    } catch (error) {
        console.error('Error in handleRecentTracksCommand:', error);
        await ctx.reply("Failed to fetch recent tracks. Please try again later.");
    }
}

// Command for flex feature with profile picture and complete stats
export async function handleFlexCommand(ctx, userId) {
    try {
        const result = await getUserInfo(userId);
        if (result.error) {
            return ctx.reply(`❌ ${result.error}`);
        }

        const { user, username } = result.data;
        const userData = await getIndividualUserData(userId);
        
        // Get user's profile picture from Last.fm
        const profileImage = user.image?.find(img => img.size === 'large' || img.size === 'extralarge')?.['#text'] || 
                           user.image?.find(img => img.size === 'medium')?.['#text'] || 
                           user.image?.[0]?.['#text'];

        const playcount = formatNumber(parseInt(user.playcount || 0));
        const trackcount = formatNumber(parseInt(user.track_count || 0));
        const artistcount = formatNumber(parseInt(user.artist_count || 0));
        const albumcount = formatNumber(parseInt(user.album_count || 0));
        
        const registered = user.registered?.unixtime ? 
            new Date(user.registered.unixtime * 1000).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }) : 'Unknown';

        const displayName = userData.tgUser || user.realname || user.name || username;
        
        let caption = `🎵 <b>Total Scrobbles:</b> ${playcount}\n`;
        caption += `🎼 <b>Unique Tracks:</b> ${trackcount}\n`;
        caption += `🎤 <b>Unique Artists:</b> ${artistcount}\n`;
        caption += `💿 <b>Unique Albums:</b> ${albumcount}\n`;
        caption += `📅 <b>Member Since:</b> ${registered}\n\n`;
        
        if (user.country) {
            caption += `🌍 <b>Country:</b> ${escapeHTML(user.country)}\n`;
        }
        
        caption += `🔗 <b>Profile:</b> <a href="https://www.last.fm/user/${encodeURIComponent(username)}">Visit Last.fm</a>\n\n`;
        caption += `<a href="https://burhanverse.t.me">𝘗𝘳𝘫𝘬𝘵:𝘚𝘪𝘥.</a>`;

        // Send with profile picture if available
        if (profileImage && profileImage !== '') {
            try {
                await ctx.replyWithPhoto(profileImage, {
                    caption: caption,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            } catch (photoError) {
                console.log('Failed to send with profile picture, sending text only:', photoError.message);
                // Fallback to text message if photo fails
                await ctx.reply(caption, { 
                    parse_mode: 'HTML',
                    disable_web_page_preview: true 
                });
            }
        } else {
            // No profile picture available, send text message with emoji header
            const flexMessage = `💪🎧 <b>${escapeHTML(displayName)}'s Last.fm Flex</b>\n\n` +
                              `🎵 <b>Total Scrobbles:</b> ${playcount}\n` +
                              `🎼 <b>Unique Tracks:</b> ${trackcount}\n` +
                              `🎤 <b>Unique Artists:</b> ${artistcount}\n` +
                              `💿 <b>Unique Albums:</b> ${albumcount}\n` +
                              `📅 <b>Member Since:</b> ${registered}\n\n` +
                              (user.country ? `🌍 <b>Country:</b> ${escapeHTML(user.country)}\n` : '') +
                              `🔗 <b>Profile:</b> <a href="https://www.last.fm/user/${encodeURIComponent(username)}">Visit Last.fm</a>\n\n` +
                              `<a href="https://burhanverse.t.me">𝘗𝘳𝘫𝘬𝘵:𝘚𝘪𝘥.</a>`;
            
            await ctx.reply(flexMessage, { 
                parse_mode: 'HTML',
                disable_web_page_preview: true 
            });
        }
    } catch (error) {
        console.error('Error in handleFlexCommand:', error);
        await ctx.reply("Failed to load your Last.fm flex. Please try again later.");
    }
}

// Command for loved tracks
export async function handleLovedTracksCommand(ctx, userId) {
    try {
        const userData = await getIndividualUserData(userId);
        const result = await getUserLovedTracks(userId, 5);
        if (result.error) {
            return ctx.reply(`❌ ${result.error}`);
        }

        const { tracks, username, total } = result.data;
        const displayName = userData?.tgUser || username;
        let message = `❤️ <b><a href="https://www.last.fm/user/${encodeURIComponent(username)}">${escapeHTML(displayName)}</a>'s Loved Tracks</b>\n\n`;
        
        tracks.forEach((track, index) => {
            const artistName = track.artist?.name || track.artist?.['#text'] || 'Unknown Artist';
            message += `<b>${index + 1}.</b> ${escapeHTML(track.name)} by ${escapeHTML(artistName)}\n`;
        });

        message += `\n📊 Total Loved: ${formatNumber(total)}`;

        await ctx.reply(message, { 
            parse_mode: 'HTML',
            disable_web_page_preview: true 
        });
    } catch (error) {
        console.error('Error in handleLovedTracksCommand:', error);
        await ctx.reply("Failed to fetch loved tracks. Please try again later.");
    }
}

// Utility function to check if user can use Last.fm commands
export async function checkLastfmUser(ctx, userId) {
    const userData = await getIndividualUserData(userId);
    if (!userData?.lastfmUsername) {
        await ctx.reply("You need to set your Last.fm username first. Use the command: /setlastfm username");
        return false;
    }
    return true;
}

// Utility function to get user ID from context
export function getUserIdFromContext(ctx) {
    return ctx.from?.id?.toString();
}

// Check if command is used in group
export function isGroupCommand(ctx) {
    return ['group', 'supergroup'].includes(ctx.chat.type);
}
