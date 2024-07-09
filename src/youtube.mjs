import ytdl from 'ytdl-core';
import dotenv from 'dotenv';

dotenv.config();

async function getYouTubeMusicDetails(artist, track) {
    const searchString = `${artist} ${track}`;
    try {
        const videoInfo = await ytdl.getInfo(`ytsearch1:${searchString}`);
        const videoDetails = videoInfo.videoDetails;

        return {
            youtubeMusicLink: `https://music.youtube.com/watch?v=${videoDetails.videoId}`,
            albumCover: videoDetails.thumbnails[0].url,
            albumName: videoDetails.title,
            releaseDate: videoDetails.uploadDate,
            artistLink: `https://music.youtube.com/search?q=${artist}` // Adding artist search link
        };
    } catch (error) {
        console.error('YouTube Music API error:', error);
        return null;
    }
}

export { getYouTubeMusicDetails };
