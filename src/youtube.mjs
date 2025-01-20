import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function getYouTubeMusicDetails(artist, track) {
    const searchString = `${artist} ${track}`;
    const options = {
        method: 'GET',
        url: 'http://127.0.0.1:8080/search',
        params: { query: searchString }
    };

    try {
        const { data } = await axios.request(options);

        const firstResult = data.results[0];

        const modifiedThumbnailUrl = firstResult.thumbnails[0].url.replace(/w60-h60/, 'w1080-h1080');

        return {
            id: firstResult.videoId,
            albumCover: modifiedThumbnailUrl,
        };
    } catch (error) {
        console.error('YouTube Music API error:', error);
        return null;
    }
}

export { getYouTubeMusicDetails };
