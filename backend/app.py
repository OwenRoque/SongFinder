from flask import Flask, request, jsonify, make_response, redirect
from flask_cors import CORS
from config import HDFS_HOST, HDFS_PORT, HDFS_USER
from kafka import KafkaProducer
from hdfs import InsecureClient
from datetime import datetime
from es import search_song, search_artist, search_lyrics
from spotify_auth import get_auth_url, get_access_token
from db import get_song_metadata
import json
import shutil
import os
import subprocess
import requests
import pandas as pd

SPARK_UPDATE_SCRIPT = "/aqui/mp3-processing.py"

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)  # Permitir peticiones desde el frontend
access_token = None

songs_df = pd.read_csv("./songs_with_attributes_and_lyrics.csv")
songs_df["album_name"] = songs_df["album_name"].fillna("-")

hdfs_client = InsecureClient(f"http://{HDFS_HOST}:{HDFS_PORT}", user=HDFS_USER)

# temporal eliminar por hive:
def get_song_meta(song_ids):
    if not song_ids:
        return []

    filtered = songs_df[songs_df["id"].isin(song_ids)]

    results = []
    for _, row in filtered.iterrows():
        song = row.to_dict()

        # Asegurar formato de `artists` como lista
        raw_artists = song.get("artists", "")
        if isinstance(raw_artists, str):
            raw_artists = raw_artists.strip()
            if raw_artists.startswith("[") and raw_artists.endswith("]"):
                try:
                    song["artists"] = json.loads(raw_artists.replace("'", '"'))
                except json.JSONDecodeError:
                    song["artists"] = [raw_artists]
            else:
                song["artists"] = [raw_artists]
        else:
            song["artists"] = []

        results.append(song)

    return results

# --- RUTA DE SUBIDA DE MP3 ---
# @app.route("/upload-mp3", methods=["POST"])
# TODO

@app.route("/login")
def login():
    return redirect(get_auth_url())

@app.route("/logout")
def logout():
    response = make_response(jsonify({"message": "Logged out"}))
    response.delete_cookie("spotify_user_id")
    response.delete_cookie("spotify_name")
    response.delete_cookie("spotify_image")
    response.delete_cookie("spotify_access_token")
    return response

def get_user_profile(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("https://api.spotify.com/v1/me", headers=headers)
    if response.status_code == 200:
        return response.json()
    return None

@app.route("/callback")
def callback():
    global access_token
    code = request.args.get("code")
    access_token = get_access_token(code)

    user_info = get_user_profile(access_token)
    if not user_info:
        return "❌ Error al obtener perfil de usuario."

    resp = make_response(redirect("http://localhost:3000"))
    resp.set_cookie("spotify_access_token", access_token, httponly=True, samesite="Lax", max_age=3600)
    resp.set_cookie("spotify_user_id", user_info["id"], max_age=3600)
    resp.set_cookie("spotify_name", user_info.get("display_name", ""), max_age=3600)
    resp.set_cookie("spotify_image", user_info.get("images", [{}])[0].get("url", ""), max_age=3600)
    return resp

@app.route("/me")
def me():
    user_id = request.cookies.get("spotify_user_id")
    name = request.cookies.get("spotify_name")
    image = request.cookies.get("spotify_image")
    if not user_id:
        return jsonify({"error": "No autorizado"}), 401
    return jsonify({
        "id": user_id,
        "name": name,
        "image": image
    })

def get_artwork(track_id):
    global access_token
    if not track_id or not access_token:
        return ""

    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    url = f"https://api.spotify.com/v1/tracks/{track_id}"
    try:
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code != 200:
            return ""
        data = resp.json()
        return data.get("album", {}).get("images", [{}])[0].get("url", "")
    except Exception:
        return ""

@app.route("/search")
def search():
    query = request.args.get("q", "").strip().lower()
    search_type = request.args.get("type", "")  # song, artist, lyrics

    if search_type == "song":
        result_ids = search_song(query)
    elif search_type == "artist":
        result_ids = search_artist(query)
    elif search_type == "lyrics":
        result_ids = search_lyrics(query)
    else:
        result_ids = []
    # Resultados crudos
    # raw_results = get_song_metadata(result_ids)
    raw_results = get_song_meta(result_ids)

    songs = []
    for song in raw_results:
        song_id = song.get("id", "")
        # Obtener portada desde Spotify
        cover_url = get_artwork(song_id)
        # Armar objeto tipo Song (según la interfaz frontend)
        song_obj = {
            "id": song.get("id"),
            "name": song.get("name"),
            "album_name": song.get("album_name", ""),
            "cover": cover_url,
            "artists": song.get("artists", []),
            "danceability": song.get("danceability"),
            "energy": song.get("energy"),
            "liveness": song.get("liveness"),
            "valence": song.get("valence"),
            "duration": song.get("duration_ms"),
            "lyrics": song.get("lyrics", "")
        }
        songs.append(song_obj)
    return jsonify(songs)

# Kafka
# producer = KafkaProducer(
#     bootstrap_servers='{HDFS_HOST}:{KAFKA_HOST}',
#     value_serializer=lambda v: json.dumps(v).encode('utf-8')
# )
#
# # --- RUTAS DE EVENTOS KAFKA ---
# @app.route("/event/searched", methods=["POST"])
# def event_searched():
#     event = request.json
#     producer.send("song-searched", event)
#     return jsonify({"status": "ok"})
#
# @app.route("/event/played", methods=["POST"])
# def event_played():
#     event = request.json
#     producer.send("song-played", event)
#     return jsonify({"status": "ok"})
#
# @app.route("/event/saved", methods=["POST"])
# def event_saved():
#     event = request.json
#     producer.send("song-saved", event)
#     return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
