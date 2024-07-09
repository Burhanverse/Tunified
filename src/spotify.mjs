import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

async function getSpotifyDetails(artist, track) {
    try {
        await spotifyApi.clientCredentialsGrant().then(data => {
            spotifyApi.setAccessToken(data.body['access_token']);
        });

        const response = await spotifyApi.searchTracks(`track:${track} artist:${artist}`);

        if (response.body.tracks.items.length > 0) {
            const trackInfo = response.body.tracks.items[0];
            return {
                spotifyLink: trackInfo.external_urls.spotify,
                albumCover: trackInfo.album.images[0].url,
                albumName: trackInfo.album.name,
                releaseDate: trackInfo.album.release_date,
                id: trackInfo.id, // Adding track id
                artistLink: trackInfo.artists[0].external_urls.spotify // Adding artist link
            };
        }
    } catch (error) {
        console.error('Spotify API error:', error);
    }

    return null;
}

export { getSpotifyDetails };
