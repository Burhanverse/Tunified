#!/usr/bin/env python3
"""
Enhanced YouTube Music API for Tunified Bot

This module provides improved search functionality for YouTube Music tracks,
with enhanced cover art quality and better search accuracy.

Features:
- Multiple search strategies for better accuracy
- Enhanced thumbnail quality extraction
- Relevance scoring for better results
- Comprehensive error handling
- Backward compatibility with existing code

Usage:
    python api.py "Artist Name Song Title"

Returns JSON with video ID, thumbnails, and enhanced metadata.
"""

from ytmusicapi import YTMusic
import json
import sys
import re
import logging
from typing import Dict, List, Optional, Any

# Configure logging
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
        # Preserve Unicode letters, numbers, spaces, hyphens and common punctuation
        # Includes: Latin, Cyrillic, Arabic, Chinese/Japanese/Korean, and other scripts
        query = re.sub(r'[^\w\s\-\u00C0-\u017F\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]', ' ', query, flags=re.UNICODE)
        # Remove multiple spaces
        query = re.sub(r'\s+', ' ', query).strip()
        return query
    
    def extract_best_thumbnail(self, thumbnails: List[Dict]) -> Optional[str]:
        """Extract the best quality thumbnail URL"""
        if not thumbnails:
            return None
        
        # Sort thumbnails by size (width * height) in descending order
        sorted_thumbnails = sorted(
            thumbnails, 
            key=lambda x: (x.get('width', 0) * x.get('height', 0)), 
            reverse=True
        )
        
        best_thumbnail = sorted_thumbnails[0]
        thumbnail_url = best_thumbnail.get('url', '')
        
        # Enhance thumbnail quality by modifying URL parameters
        if thumbnail_url:
            # Replace size parameters for maximum quality
            thumbnail_url = re.sub(r'w\d+-h\d+', 'w1080-h1080', thumbnail_url)
            # Ensure we get the highest quality version
            if 'mqdefault' in thumbnail_url:
                thumbnail_url = thumbnail_url.replace('mqdefault', 'maxresdefault')
            elif 'hqdefault' in thumbnail_url:
                thumbnail_url = thumbnail_url.replace('hqdefault', 'maxresdefault')
        
        return thumbnail_url
    
    def search_with_fallbacks(self, query: str) -> List[Dict[str, Any]]:
        """Search with multiple strategies for better accuracy"""
        search_strategies = [
            {'filter': 'songs', 'limit': 5},
            {'filter': 'videos', 'limit': 3},
            {'filter': None, 'limit': 3}  # General search
        ]
        
        normalized_query = self.normalize_query(query)
        
        for strategy in search_strategies:
            try:
                filter_type = strategy.get('filter')
                limit = strategy.get('limit', 5)
                
                results = self.ytmusic.search(
                    normalized_query, 
                    filter=filter_type, 
                    limit=limit
                )
                
                if results and len(results) > 0:
                    return results
                    
            except Exception as e:
                logger.warning(f"Search strategy {strategy} failed: {e}")
                continue
        
        return []
    
    def score_result_relevance(self, result: Dict, original_query: str) -> float:
        """Score result relevance based on query match"""
        score = 0.0
        query_lower = original_query.lower()
        
        # Check title match
        title = result.get('title', '').lower()
        if title:
            if query_lower in title:
                score += 0.5
            # Check for word matches
            query_words = set(query_lower.split())
            title_words = set(title.split())
            word_overlap = len(query_words.intersection(title_words))
            score += (word_overlap / len(query_words)) * 0.3
        
        # Check artist match (if available)
        artists = result.get('artists', [])
        if artists:
            artist_names = ' '.join([artist.get('name', '') for artist in artists]).lower()
            query_words = set(query_lower.split())
            artist_words = set(artist_names.split())
            word_overlap = len(query_words.intersection(artist_words))
            score += (word_overlap / len(query_words)) * 0.2
        
        return score
    
    def search_ytmusic(self, query: str) -> Dict[str, Any]:
        """Enhanced search function with better accuracy and cover art"""
        try:
            if not self.ytmusic:
                return {"error": "YTMusic API not initialized"}
            
            if not query or len(query.strip()) < 2:
                return {"error": "Query too short"}
            
            # Search with fallback strategies
            results = self.search_with_fallbacks(query)
            
            if not results:
                return {"results": [], "message": "No results found"}
            
            # Score and sort results by relevance
            scored_results = []
            for result in results:
                score = self.score_result_relevance(result, query)
                scored_results.append((score, result))
            
            # Sort by score (descending)
            scored_results.sort(key=lambda x: x[0], reverse=True)
            
            # Process top results
            processed_results = []
            for score, result in scored_results[:3]:  # Top 3 results
                try:
                    video_id = result.get('videoId')
                    if not video_id:
                        continue
                    
                    thumbnails = result.get('thumbnails', [])
                    best_thumbnail = self.extract_best_thumbnail(thumbnails)
                    
                    processed_result = {
                        "videoId": video_id,
                        "title": result.get('title', ''),
                        "artists": [artist.get('name', '') for artist in result.get('artists', [])],
                        "thumbnail": best_thumbnail,
                        "thumbnails": thumbnails,  # Keep original for compatibility
                        "relevanceScore": score,
                        "duration": result.get('duration_seconds'),
                        "album": result.get('album', {}).get('name') if result.get('album') else None
                    }
                    
                    processed_results.append(processed_result)
                    
                except Exception as e:
                    logger.warning(f"Error processing result: {e}")
                    continue
            
            return {
                "results": processed_results,
                "query": query,
                "totalFound": len(results)
            }
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return {"error": f"Search failed: {str(e)}"}

def search_ytmusic(query: str) -> Dict[str, Any]:
    """Wrapper function for backward compatibility"""
    searcher = YTMusicSearcher()
    result = searcher.search_ytmusic(query)
    
    # Transform to maintain backward compatibility
    if "results" in result and result["results"]:
        # Keep the same structure as before but with enhanced data
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
    # Ensure proper Unicode handling
    import locale
    locale.setlocale(locale.LC_ALL, '')
    
    if len(sys.argv) < 2:
        error_response = {"error": "No search query provided", "usage": "python api.py '<search_query>'"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(0)  # Changed to 0 to prevent Node.js from throwing
    
    # Handle multiple arguments as a single query with proper Unicode handling
    try:
        query = " ".join(sys.argv[1:]) if len(sys.argv) > 2 else sys.argv[1]
        # Ensure query is properly decoded
        if isinstance(query, bytes):
            query = query.decode('utf-8')
    except UnicodeDecodeError as e:
        error_response = {"error": f"Unicode decode error: {str(e)}"}
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(0)
    
    # Validate query length (using character count, not byte count)
    if len(query.strip()) < 1 or not query.strip():  # Allow single characters but not empty
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