from pyhive import hive
import json
from difflib import get_close_matches
from config import HDFS_HOST, HIVE_PORT, HIVE_USER

def get_connection():
    return hive.Connection(
        host=HDFS_HOST,
        port=HIVE_PORT,
        username=HIVE_USER,
        database="default",
        auth="NOSASL"
    )

def query_hive(sql):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql)
    return cursor.fetchall()

# def get_song_ids_by_word(table, word):
#     # Busqueda exacta
#     sql_exact = f"SELECT song_ids FROM {table} WHERE word = '{word}'"
#     results_exact = query_hive(sql_exact)
#     song_ids = set()
#
#     for row in results_exact:
#         try:
#             ids = json.loads(row[0].replace("'", '"'))
#             song_ids.update(ids)
#         except:
#             pass
#     # Si no hay resultados exactos, intentar busqueda aproximada
#         if not song_ids:
#             # Obtener todas las palabras del índice
#             results_all = query_hive(f"SELECT DISTINCT word FROM {table}")
#             all_words = [row[0] for row in results_all]
#
#             # Buscar las mas cercanas
#             matches = get_close_matches(word, all_words, n=6, cutoff=cutoff)
#             if matches:
#                 similar_word = matches[0]
#                 sql_approx = f"SELECT song_ids FROM {table} WHERE word = '{similar_word}'"
#                 results_approx = query_hive(sql_approx)
#                 for row in results_approx:
#                     try:
#                         ids = json.loads(row[0].replace("'", '"'))
#                         song_ids.update(ids)
#                     except Exception:
#                         pass
#     return song_ids

def get_song_metadata(song_ids, page=1, page_size=9):
    if not song_ids:
        return []

    ids_str = ",".join(f"'{sid}'" for sid in song_ids)
    sql = f"SELECT * FROM songs_metadata WHERE id IN ({ids_str})"
    results = query_hive(sql)
    keys = ["id", "name", "album_name", "artists", "danceability", "energy", "liveness", "valence", "duration_ms", "lyrics"]
    songs = []
    for row in results:
        song = dict(zip(keys, row))
        print(song)
        raw_artists = song.get("artists")
        if raw_artists:
            raw_artists = raw_artists.strip()
            # Caso 1: Parece una lista (['Artista 1', 'Artista 2'])
            if raw_artists.startswith("[") and raw_artists.endswith("]"):
                try:
                    song["artists"] = json.loads(raw_artists.replace("'", '"'))
                except json.JSONDecodeError:
                    song["artists"] = [raw_artists]  # fallback: trata como string plano
            # Caso 2: es un string plano, lo convertimos a lista de uno
            else:
                song["artists"] = [raw_artists]
        else:
            song["artists"] = []
        songs.append(song)

    return songs