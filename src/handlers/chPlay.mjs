import { getUserData, saveUserData, fetchNowPlaying, createText, getReplyMarkup } from '../utils.mjs';
import { getYouTubeMusicDetails } from '../youtube.mjs';

export async function chPlaying(bot) {
    const users = await getUserData();
    if (!users || !Array.isArray(users)) {
        console.error("No users found or users is not an array");
        return;
    }
    for (const user of users) {
        try {
            const track = await fetchNowPlaying(user.userId);
            if (track) {
                let details = await getYouTubeMusicDetails(track.artistName, track.trackName, track.albumName);

                if (!details) {
                    console.error('Could not fetch details from YouTube Music');
                    continue;
                }

                const { albumCover, id } = details;
                const text = createText({ ...track, ...user });
                const replyMarkup = getReplyMarkup({ id, artistName: track.artistName });

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
            }
        } catch (error) { }
    }
}
