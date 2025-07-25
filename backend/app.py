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
CORS(app, origins=["http://127.0.0.1:3000"], supports_credentials=True)  # Permitir peticiones desde el frontend
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

    resp = make_response(redirect("http://127.0.0.1:3000"))
    resp.set_cookie("spotify_access_token", access_token, httponly=True, samesite="Lax", max_age=3600, path="/")
    resp.set_cookie("spotify_user_id", user_info["id"], max_age=3600, path="/")
    resp.set_cookie("spotify_name", user_info.get("display_name", ""), max_age=3600, path="/")
    resp.set_cookie("spotify_image", user_info.get("images", [{}])[0].get("url", ""), max_age=3600, path="/")

    return resp

@app.route("/me")
def me():
    # print("Cookies recibidas:", request.cookies)

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

def get_additional_metadata(track_id):
    global access_token
    if not track_id or not access_token:
        return {"cover": "", "popularity": 0, "release_date": ""}

    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    url = f"https://api.spotify.com/v1/tracks/{track_id}"
    try:
        resp = requests.get(url, headers=headers, timeout=50)
        if resp.status_code != 200:
            return {"cover": "", "popularity": 0, "release_date": ""}
        data = resp.json()

        cover = data.get("album", {}).get("images", [{}])[0].get("url", "")
        popularity = data.get("popularity", 0)
        release_date = data.get("album", {}).get("release_date", "")
        return {
            "cover": cover,
            "popularity": popularity,
            "release_date": release_date
        }
    except Exception:
        return {"message": Exception}

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
        spotify_data = get_additional_metadata(song_id)
        # Armar objeto tipo Song (según la interfaz frontend)
        song_obj = {
            "id": song.get("id"),
            "name": song.get("name"),
            "album_name": song.get("album_name", ""),
            "cover": spotify_data["cover"],
            "artists": song.get("artists", []),
            "popularity": spotify_data["popularity"],
            "release_date": spotify_data["release_date"],
            "danceability": song.get("danceability"),
            "energy": song.get("energy"),
            "liveness": song.get("liveness"),
            "valence": song.get("valence"),
            "loudness": song.get("loudness"),
            "speechiness": song.get("speechiness"),
            "acousticness": song.get("acousticness"),
            "instrumentalness": song.get("instrumentalness"),
            "duration": song.get("duration_ms"),
            "lyrics": song.get("lyrics", "")
        }
        songs.append(song_obj)
    return jsonify(songs)

# @app.route("/upload-mp3", methods=["POST"])
# async def upload_song(file: UploadFile = File(...)):
#     try:
#         filename = file.filename
#         local_path = f"/tmp/{filename}"
#         with open(local_path, "wb") as f:
#             shutil.copyfileobj(file.file, f)
#
#         print(f"[INFO] MP3 guardado localmente como {local_path}")
#
#         # Extraer letra - Simulación
#         lyrics = "Letra de ejemplo extraída del mp3..."
#
#         # Guardar metadata local temporal
#         metadata = {
#             "song_id": filename,
#             "title": filename,
#             "lyrics": lyrics,
#             "uploaded_at": datetime.utcnow().isoformat()
#         }
#
#         # Subir a HDFS
#         metadata_line = json.dumps(metadata) + "\n"
#         with hdfs_client.write(METADATA_PATH, encoding='utf-8', append=True) as writer:
#             writer.write(metadata_line)
#
#         print("[INFO] Metadata agregada a HDFS")
#
#         # Ejecutar Spark para actualizar índice invertido
#         subprocess.run(["spark-submit", SPARK_UPDATE_SCRIPT], check=True)
#         print("[INFO] Spark job ejecutado con éxito")
#
#         # Recargar metadatos actualizados
#         load_metadata_from_hdfs()
#
#         return {"status": "ok", "message": f"{filename} subida correctamente"}
#
#     except Exception as e:
#         print(f"[ERROR] Error en /upload-mp3: {e}")
#         return JSONResponse(status_code=500, content={"error": str(e)})


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
