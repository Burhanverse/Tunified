from flask import Flask, request, jsonify
from ytmusicapi import YTMusic
from waitress import serve

app = Flask(__name__)
ytmusic = YTMusic()

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    try:
        results = ytmusic.search(query, filter='songs')
        if not results:
            return jsonify({"results": []})

        response = []
        for result in results:
            response.append({
                "videoId": result["videoId"],
                "title": result["title"],
                "artists": [{"name": artist["name"], "id": artist["id"]} for artist in result.get("artists", [])],
                "album": result.get("album", {}),
                "thumbnails": result.get("thumbnails", []),
                "duration": result.get("duration"),
            })

        return jsonify({"results": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
	serve(app, host='0.0.0.0', port=8080)