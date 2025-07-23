from kafka import KafkaConsumer
import json

def consume_events(topic_name):
    consumer = KafkaConsumer(
        topic_name,
        bootstrap_servers='localhost:9092',
        auto_offset_reset='earliest',
        group_id=f'{topic_name}-group',
        value_deserializer=lambda v: json.loads(v.decode('utf-8'))
    )
    print(f"Listening on {topic_name}...")

    for msg in consumer:
        event = msg.value
        print(f"Received from {topic_name}: {event}")
        # Aquí podrías guardar en base de datos, HDFS, o sumar al contador

if __name__ == "__main__":
    from threading import Thread
    for topic in ['song-searched', 'song-played', 'song-saved']:
        Thread(target=consume_events, args=(topic,), daemon=True).start()

    input("Presiona Enter para finalizar...\n")
