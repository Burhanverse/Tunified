# YouTube Music Search API

A Flask-based RESTful API for searching YouTube Music tracks, powered by Waitress WSGI server.

## Features

- 🎵 Fast YouTube Music search with multiple fallback strategies
- 🖼️ High-quality thumbnail extraction and optimization
- 🎯 Enhanced relevance scoring for track + artist + album queries
- 🚀 Production-ready with Waitress WSGI server
- 🔄 CORS support for cross-origin requests
- 📊 Health check endpoint for monitoring
- 🔍 Both simple and detailed search endpoints

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Or install manually:**
   ```bash
   pip install flask waitress flask-cors ytmusicapi
   ```

## Usage

### Starting the Server

**Method 1: Direct Python execution**
```bash
python3 server.py
```

**Method 2: Using the startup script**
```bash
./start_server.sh
```

**Method 3: Using the main project script**
```bash
# From project root
./start_all.sh
```

The server will start on `http://127.0.0.1:8080` by default.

### Environment Variables

- `HOST`: Server host (default: `127.0.0.1`)
- `PORT`: Server port (default: `8080`)

### API Endpoints

#### Health Check
```
GET /health
```

**Response:**
```json
{
    "status": "healthy",
    "service": "YouTube Music Search API",
    "version": "1.0.0"
}
```

#### Simple Search
```
GET /search?q=<query>
POST /search
```

**GET Parameters:**
- `q`: Search query (required)

**POST Body:**
```json
{
    "query": "Bohemian Rhapsody Queen A Night at the Opera"
}
```

**Response:**
```json
{
    "results": [
        {
            "videoId": "bSnlKl_PoQU",
            "title": "Bohemian Rhapsody",
            "artists": ["Queen"],
            "thumbnail": "https://lh3.googleusercontent.com/...",
            "thumbnails": [...],
            "album": "A Night At The Opera (Deluxe Edition 2011 Remaster)"
        }
    ]
}
```

#### Detailed Search
```
GET /search/detailed?q=<query>
POST /search/detailed
```

**Response includes additional metadata:**
```json
{
    "results": [
        {
            "videoId": "bSnlKl_PoQU",
            "title": "Bohemian Rhapsody",
            "artists": ["Queen"],
            "thumbnail": "https://lh3.googleusercontent.com/...",
            "thumbnails": [...],
            "album": "A Night At The Opera (Deluxe Edition 2011 Remaster)",
            "relevanceScore": 0.95,
            "duration": 354,
            "resultType": "song"
        }
    ],
    "query": "Bohemian Rhapsody Queen A Night at the Opera",
    "totalFound": 5,
    "searchStrategy": "enhanced_track_artist_album"
}
```

## Search Features

### Multi-Strategy Search
The API uses multiple search strategies with fallbacks:
1. Songs filter (primary)
2. Videos filter (secondary)
3. General search (fallback)

### Enhanced Relevance Scoring
Results are scored based on:
- Title matching (60% weight)
- Artist matching (30% weight)
- Album matching (15% weight)
- Track duration bonus (+5%)

### Thumbnail Optimization
Automatically enhances thumbnail URLs for better quality:
- Upgrades to 1080x1080 resolution when possible
- Replaces low-quality defaults with high-quality versions

### Query Normalization
- Unicode support for international characters
- Special character filtering
- Whitespace normalization

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing query)
- `404`: Endpoint not found
- `500`: Internal Server Error

Error responses include descriptive messages:
```json
{
    "error": "Query parameter 'q' or 'query' is required"
}
```

## Integration with Node.js

The API is designed to work seamlessly with the existing Node.js bot:

```javascript
import { getYouTubeMusicDetails } from './src/youtube.mjs';

const result = await getYouTubeMusicDetails('Queen', 'Bohemian Rhapsody', 'A Night at the Opera');
console.log(result);
```

## Performance

- **Waitress WSGI Server**: Production-ready, multi-threaded
- **Connection Pooling**: Efficient resource management
- **Timeout Handling**: 15-second request timeout
- **Error Recovery**: Graceful fallback strategies

## Development

### Testing the API

```bash
# Health check
curl http://127.0.0.1:8080/health

# Search test
curl "http://127.0.0.1:8080/search?q=Bohemian%20Rhapsody%20Queen"

# Detailed search test
curl "http://127.0.0.1:8080/search/detailed?q=Yesterday%20Beatles"
```

### Logging

- Only errors are logged by default
- Werkzeug logs are suppressed in production
- Use environment variable `FLASK_ENV=development` for debug mode

## Migration from CLI Script

This Flask API replaces the previous `api.py` CLI script with these benefits:

1. **Better Performance**: No process spawning overhead
2. **Connection Reuse**: Persistent YouTube Music API connection
3. **Concurrent Requests**: Handle multiple searches simultaneously
4. **Better Error Handling**: Proper HTTP status codes and error messages
5. **Health Monitoring**: Built-in health check endpoint
6. **CORS Support**: Ready for web applications

The Node.js integration (`youtube.mjs`) has been updated to use HTTP requests instead of spawning Python processes, providing much better performance and reliability.
