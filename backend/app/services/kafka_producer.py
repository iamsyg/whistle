import json
import logging
from typing import Any, Dict, Optional
from aiokafka import AIOKafkaProducer
from app.config.kafka_config import KAFKA_BOOTSTRAP_SERVERS, KAFKA_CHAT_TOPIC

logger = logging.getLogger(__name__)

class KafkaProducerService:
    def __init__(self):
        self.producer: Optional[AIOKafkaProducer] = None

    async def start(self):
        try:
            self.producer = AIOKafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None
            )
            await self.producer.start()
            logger.info("✅ Kafka Producer started successfully.")
        except Exception as e:
            logger.error(f"❌ Failed to start Kafka Producer: {str(e)}")
            self.producer = None

    async def stop(self):
        if self.producer:
            await self.producer.stop()
            logger.info("🧹 Kafka Producer stopped.")

    async def send_chat_message(self, chat_id: str, message_data: Dict[str, Any]):
        if not self.producer:
            logger.warning("⚠️ Kafka Producer is not connected. Message skipped.")
            return

        try:
            await self.producer.send_and_wait(
                topic=KAFKA_CHAT_TOPIC,
                key=chat_id,
                value=message_data
            )
            logger.info(f"📤 Sent chat message event to Kafka topic '{KAFKA_CHAT_TOPIC}' for chat '{chat_id}'")
        except Exception as e:
            logger.error(f"❌ Failed to publish message to Kafka: {str(e)}")

kafka_producer = KafkaProducerService()
