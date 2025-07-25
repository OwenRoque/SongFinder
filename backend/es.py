from elasticsearch import Elasticsearch
from elasticsearch.exceptions import AuthenticationException, ConnectionError as ESConnectionError

ES_HOST = "https://localhost:9200"
ELASTIC_PASSWORD = "-rsJET6wz31YTcwvl3ft"
CA_CERTS_PATH = "./http_ca.crt"
INDEX_NAME = "songs_lyrics_fuzzy"

es = Elasticsearch(
    ES_HOST,
    ca_certs=CA_CERTS_PATH,
    basic_auth=("elastic", ELASTIC_PASSWORD),
    request_timeout=30,
    verify_certs=True
)

def search_lyrics(term, max_results=9):
    query = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match_phrase": {  # Prioriza frases exactas
                            "lyrics": {
                                "query": term,
                                "slop": 3,  # Permite hasta 3 palabras de separación
                                "boost": 2  # Da más peso a estos resultados
                            }
                        }
                    },
                    {
                        "match": {  # Búsqueda alternativa si no encuentra frases
                            "lyrics": {
                                "query": term,
                                "operator": "and",
                                "fuzziness": "AUTO"
                            }
                        }
                    }
                ]
            }
        },
        "_source": ["song_id"],  # Solo obtener ID
        "size": max_results
    }

    try:
        res = es.search(index=INDEX_NAME, body=query)
        hits = res.get("hits", {}).get("hits", [])
        song_ids = [hit["_source"]["song_id"] for hit in hits]
        return song_ids

    except AuthenticationException:
        print("❌ Error de autenticación con ES")
        return []
    except ESConnectionError:
        print("❌ No se pudo conectar a ES")
        return []
    except Exception as e:
        print(f"❌ Error inesperado en búsqueda ES: {type(e).__name__} - {str(e)}")
        return []

def search_artist(term, max_results=9):
    query = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match_phrase": {
                            "artist": {
                                "query": term,
                                "slop": 3,
                                "boost": 2
                            }
                        }
                    },
                    {
                        "match": {
                            "artist": {
                                "query": term,
                                "operator": "and",
                                "fuzziness": "AUTO"
                            }
                        }
                    }
                ]
            }
        },
        "_source": ["song_id"],  # Solo obtener ID
        "size": max_results
    }

    try:
        res = es.search(index=INDEX_NAME, body=query)
        hits = res.get("hits", {}).get("hits", [])
        song_ids = [hit["_source"]["song_id"] for hit in hits]
        return song_ids

    except AuthenticationException:
        print("❌ Error de autenticación con ES")
        return []
    except ESConnectionError:
        print("❌ No se pudo conectar a ES")
        return []
    except Exception as e:
        print(f"❌ Error inesperado en búsqueda ES: {type(e).__name__} - {str(e)}")
        return []

def search_song(term, max_results=9):
    query = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match_phrase": {
                            "title": {
                                "query": term,
                                "slop": 3,
                                "boost": 2
                            }
                        }
                    },
                    {
                        "match": {
                            "title": {
                                "query": term,
                                "operator": "and",
                                "fuzziness": "AUTO"
                            }
                        }
                    }
                ]
            }
        },
        "_source": ["song_id"],  # Solo obtener ID
        "size": max_results
    }

    try:
        res = es.search(index=INDEX_NAME, body=query)
        hits = res.get("hits", {}).get("hits", [])
        song_ids = [hit["_source"]["song_id"] for hit in hits]
        return song_ids

    except AuthenticationException:
        print("❌ Error de autenticación con ES")
        return []
    except ESConnectionError:
        print("❌ No se pudo conectar a ES")
        return []
    except Exception as e:
        print(f"❌ Error inesperado en búsqueda ES: {type(e).__name__} - {str(e)}")
        return []