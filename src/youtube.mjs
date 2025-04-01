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

        if (!data.coverArt || typeof data.coverArt !== 'string' || data.coverArt === "") {
            console.error('No valid cover art found in response:', data);
            return { albumCover: 'https://raw.githubusercontent.com/Burhanverse/assets/refs/heads/main/error-404.jpg' };
        }

        const modifiedThumbnailUrl = data.coverArt.replace(/w60-h60/, 'w1080-h1080');

        return {
            albumCover: modifiedThumbnailUrl
        };
    } catch (error) {
        console.error('YouTube Music API error:', error);
        return { albumCover: 'https://raw.githubusercontent.com/Burhanverse/assets/refs/heads/main/error-404.jpg' };
    }
}

export { getYouTubeMusicDetails };