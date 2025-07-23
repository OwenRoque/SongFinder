from flask import Flask, request, jsonify
from kafka import KafkaProducer
from hdfs import InsecureClient
from datetime import datetime
import json
import shutil
import os
import subprocess

app = Flask(__name__)

# --- CONFIGURACIÓN (actualizar) ---
HDFS_HOST = "http://localhost:9870"
HDFS_USER = "hadoop"
METADATA_PATH = "/songs_metadata.json"
SPARK_UPDATE_SCRIPT = "/home/ubuntu/update_index.py"

# Kafka
producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# HDFS
hdfs_client = InsecureClient(HDFS_HOST, user=HDFS_USER)

# Metadatos en memoria
song_metadata = {}

# --- FUNCIONES ---

def load_metadata_from_hdfs():
    global song_metadata
    song_metadata = {}
    try:
        with hdfs_client.read(METADATA_PATH, encoding='utf-8') as reader:
            for line in reader:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    song_id = data.get("song_id")
                    if song_id:
                        song_metadata[song_id] = data
                except json.JSONDecodeError as je:
                    print(f"[WARN] Línea inválida en JSON: {je}")
        print(f"[INFO] Se cargaron {len(song_metadata)} canciones desde HDFS")
    except Exception as e:
        print(f"[ERROR] No se pudo cargar metadata: {e}")

def search_index(query, metadata):
    query_words = set(query.lower().split())
    results = []
    for sid, data in metadata.items():
        lyrics = data.get("lyrics", "").lower()
        if any(word in lyrics for word in query_words):
            results.append(sid)
    return results

# --- RUTAS DE EVENTOS KAFKA ---

@app.route("/event/searched", methods=["POST"])
def event_searched():
    event = request.json
    producer.send("song-searched", event)
    return jsonify({"status": "ok"})

@app.route("/event/played", methods=["POST"])
def event_played():
    event = request.json
    producer.send("song-played", event)
    return jsonify({"status": "ok"})

@app.route("/event/saved", methods=["POST"])
def event_saved():
    event = request.json
    producer.send("song-saved", event)
    return jsonify({"status": "ok"})

# --- RUTA DE BÚSQUEDA ---

@app.route("/search")
def search():
    query = request.args.get("q", "").strip().lower()
    if not query or len(query) < 2:
        return jsonify([])

    result_ids = search_index(query, song_metadata)
    results = [song_metadata[sid] for sid in result_ids if sid in song_metadata]

    return jsonify(results)

# --- RUTA DE SUBIDA DE MP3 ---

@app.route("/upload-mp3", methods=["POST"])
def upload_mp3():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    filename = file.filename
    local_path = f"/tmp/{filename}"

    try:
        file.save(local_path)
        print(f"[INFO] Archivo guardado en {local_path}")

        # Simulación de extracción de letra
        lyrics = "Letra de ejemplo extraída del mp3..."

        # Crear metadata
        metadata = {
            "song_id": filename,
            "title": filename,
            "lyrics": lyrics,
            "uploaded_at": datetime.utcnow().isoformat()
        }

        # Agregar metadata al archivo en HDFS
        metadata_line = json.dumps(metadata) + "\n"
        with hdfs_client.write(METADATA_PATH, encoding='utf-8', append=True) as writer:
            writer.write(metadata_line)
        print("[INFO] Metadata escrita en HDFS")

        # Ejecutar Spark para actualizar índice invertido
        subprocess.run(["spark-submit", SPARK_UPDATE_SCRIPT], check=True)
        print("[INFO] Spark ejecutado para actualizar índice")

        # Recargar metadatos
        load_metadata_from_hdfs()

        return jsonify({"status": "ok", "message": f"{filename} subida correctamente"})

    except Exception as e:
        print(f"[ERROR] Error al subir mp3: {e}")
        return jsonify({"error": str(e)}), 500

# --- MAIN ---

if __name__ == "__main__":
    load_metadata_from_hdfs()
    app.run(debug=True, port=5000)
