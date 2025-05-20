#!/usr/bin/env python3

from ytmusicapi import YTMusic
import json
import sys

def search_ytmusic(query):
    try:
        ytmusic = YTMusic()
        results = ytmusic.search(query, filter='songs')
        if results and len(results) > 0:
            return {"results": [{"videoId": results[0]["videoId"], "thumbnails": results[0].get("thumbnails", [])}]}
        else:
            return {"results": []}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No search query provided"}))
        sys.exit(1)
    
    query = sys.argv[1]
    result = search_ytmusic(query)
    print(json.dumps(result))