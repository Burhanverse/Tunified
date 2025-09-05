#!/usr/bin/env python3

from ytmusicapi import YTMusic
import json
import sys
import re
import logging
from typing import Dict, List, Optional, Any

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

class YTMusicSearcher:
    def __init__(self):
        try:
            self.ytmusic = YTMusic()
        except Exception as e:
            logger.error(f"Failed to initialize YTMusic: {e}")
            self.ytmusic = None
    
    def normalize_query(self, query: str) -> str:
        """Normalize search query for better matching while preserving Unicode"""
        query = re.sub(r'[^\w\s\-\u00C0-\u017F\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]', ' ', query, flags=re.UNICODE)
        query = re.sub(r'\s+', ' ', query).strip()
        return query
    
    def extract_best_thumbnail(self, thumbnails: List[Dict]) -> Optional[str]:
        """Extract the best quality thumbnail URL"""
        if not thumbnails:
            return None
        
        sorted_thumbnails = sorted(
            thumbnails, 
            key=lambda x: (x.get('width', 0) * x.get('height', 0)), 
            reverse=True
        )
        
        best_thumbnail = sorted_thumbnails[0]
        thumbnail_url = best_thumbnail.get('url', '')
        
        if thumbnail_url:
            thumbnail_url = re.sub(r'w\d+-h\d+', 'w1080-h1080', thumbnail_url)
            if 'mqdefault' in thumbnail_url:
                thumbnail_url = thumbnail_url.replace('mqdefault', 'maxresdefault')
            elif 'hqdefault' in thumbnail_url:
                thumbnail_url = thumbnail_url.replace('hqdefault', 'maxresdefault')
        
        return thumbnail_url
    
    def parse_search_components(self, query: str) -> Dict[str, str]:
        """Try to parse track, artist, and album from the search query"""
        components = {
            'track': '',
            'artist': '',
            'album': '',
            'full_query': query.strip()
        }

        components['full_query'] = self.normalize_query(query)
        
        return components
    
    def search_with_fallbacks(self, query: str) -> List[Dict[str, Any]]:
        """Search with multiple strategies for better accuracy"""
        components = self.parse_search_components(query)
        search_query = components['full_query']
        
        search_strategies = [
            {'filter': 'songs', 'limit': 8},  
            {'filter': 'videos', 'limit': 5},   
            {'filter': None, 'limit': 3}          
        ]
        
        for strategy in search_strategies:
            try:
                filter_type = strategy.get('filter')
                limit = strategy.get('limit', 5)
                
                results = self.ytmusic.search(
                    search_query, 
                    filter=filter_type, 
                    limit=limit
                )
                
                if results and len(results) > 0:
                    music_results = [
                        r for r in results 
                        if r.get('videoId') and r.get('title') and 
                        not r.get('resultType') in ['playlist', 'channel', 'podcast']
                    ]
                    
                    if music_results:
                        return music_results
                    
            except Exception as e:
                logger.warning(f"Search strategy {strategy} failed: {e}")
                continue
        
        return []
    
    def score_result_relevance(self, result: Dict, original_query: str) -> float:
        """Enhanced scoring for track + artist + album queries"""
        score = 0.0
        query_lower = original_query.lower()
        query_words = set(query_lower.split())
        
        title = result.get('title', '').lower()
        if title:
            if query_lower in title or title in query_lower:
                score += 0.6
            
            title_words = set(title.split())
            word_overlap = len(query_words.intersection(title_words))
            if query_words:
                score += (word_overlap / len(query_words)) * 0.4
        
        artists = result.get('artists', [])
        if artists:
            artist_names = ' '.join([artist.get('name', '') for artist in artists]).lower()
            if artist_names:
                artist_words = set(artist_names.split())
                artist_overlap = len(query_words.intersection(artist_words))
                if query_words:
                    score += (artist_overlap / len(query_words)) * 0.3
                
                for artist in artists:
                    artist_name = artist.get('name', '').lower()
                    if artist_name and artist_name in query_lower:
                        score += 0.2
        
        album_info = result.get('album')
        if album_info and isinstance(album_info, dict):
            album_name = album_info.get('name', '').lower()
            if album_name:
                album_words = set(album_name.split())
                album_overlap = len(query_words.intersection(album_words))
                if query_words:
                    score += (album_overlap / len(query_words)) * 0.15
        
        if len(title) > 100:
            score *= 0.9
        
        if result.get('duration_seconds'):
            score += 0.05
            
        return min(score, 1.0)
    
    def search_ytmusic(self, query: str) -> Dict[str, Any]:
        """Enhanced search function with better accuracy and cover art"""
        try:
            if not self.ytmusic:
                return {"error": "YTMusic API not initialized"}
            
            if not query or len(query.strip()) < 2:
                return {"error": "Query too short"}
            
            components = self.parse_search_components(query)
            logger.info(f"Searching for: {components['full_query']}")
            
            results = self.search_with_fallbacks(query)
            
            if not results:
                return {"results": [], "message": f"No results found for: {query}"}
            
            scored_results = []
            for result in results:
                score = self.score_result_relevance(result, query)
                scored_results.append((score, result))
            
            scored_results.sort(key=lambda x: x[0], reverse=True)
            
            processed_results = []
            for score, result in scored_results[:5]:
                try:
                    video_id = result.get('videoId')
                    if not video_id:
                        continue
                    
                    thumbnails = result.get('thumbnails', [])
                    best_thumbnail = self.extract_best_thumbnail(thumbnails)
                    
                    artists_info = result.get('artists', [])
                    artist_names = []
                    if artists_info:
                        artist_names = [artist.get('name', '') for artist in artists_info if artist.get('name')]
                    
                    processed_result = {
                        "videoId": video_id,
                        "title": result.get('title', ''),
                        "artists": artist_names,
                        "thumbnail": best_thumbnail,
                        "thumbnails": thumbnails,
                        "relevanceScore": round(score, 3),
                        "duration": result.get('duration_seconds'),
                        "album": result.get('album', {}).get('name') if result.get('album') else None,
                        "resultType": result.get('resultType', 'song')
                    }
                    
                    processed_results.append(processed_result)
                    
                except Exception as e:
                    logger.warning(f"Error processing result: {e}")
                    continue
            
            return {
                "results": processed_results,
                "query": query,
                "totalFound": len(results),
                "searchStrategy": "enhanced_track_artist_album"
            }
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return {"error": f"Search failed: {str(e)}"}

def search_ytmusic(query: str) -> Dict[str, Any]:
    """Wrapper function for backward compatibility"""
    searcher = YTMusicSearcher()
    result = searcher.search_ytmusic(query)
    
    if "results" in result and result["results"]:
        first_result = result["results"][0]
        return {
            "results": [{
                "videoId": first_result["videoId"],
                "thumbnails": first_result.get("thumbnails", []),
                "title": first_result.get("title", ""),
                "artists": first_result.get("artists", []),
                "thumbnail": first_result.get("thumbnail"),
                "album": first_result.get("album")
            }]
        }
    
    return result

if __name__ == "__main__":
    import locale
    locale.setlocale(locale.LC_ALL, '')
    
    if len(sys.argv) < 2:
        error_response = {"error": "No search query provided", "usage": "python api.py '<search_query>'"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(0) 
    
    try:
        query = " ".join(sys.argv[1:]) if len(sys.argv) > 2 else sys.argv[1]
        if isinstance(query, bytes):
            query = query.decode('utf-8')
    except UnicodeDecodeError as e:
        error_response = {"error": f"Unicode decode error: {str(e)}"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(0)
    
    if len(query.strip()) < 1 or not query.strip():
        error_response = {"error": "Search query is empty"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(0)
    
    try:
        result = search_ytmusic(query.strip())
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
    except Exception as e:
        error_response = {"error": f"Unexpected error: {str(e)}"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(0)