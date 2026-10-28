import asyncio
import json
import logging
from typing import Optional
from aiokafka import AIOKafkaConsumer
from app.config.kafka_config import KAFKA_BOOTSTRAP_SERVERS, KAFKA_CHAT_TOPIC, KAFKA_CONSUMER_GROUP
from app.utils.supabase_client import supabase

logger = logging.getLogger(__name__)

class KafkaConsumerService:
    def __init__(self):
        self.consumer: Optional[AIOKafkaConsumer] = None
        self.running: bool = False
        self.task: Optional[asyncio.Task] = None

    async def start(self):
        try:
            self.consumer = AIOKafkaConsumer(
                KAFKA_CHAT_TOPIC,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                group_id=KAFKA_CONSUMER_GROUP,
                auto_offset_reset="earliest",
                value_deserializer=lambda x: json.loads(x.decode("utf-8")) if x else None
            )
            await self.consumer.start()
            self.running = True
            self.task = asyncio.create_task(self._consume_loop())
            logger.info("✅ Kafka Consumer started successfully.")
        except Exception as e:
            logger.error(f"❌ Failed to start Kafka Consumer: {str(e)}")

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
        if self.consumer:
            await self.consumer.stop()
            logger.info("🧹 Kafka Consumer stopped.")

    async def _consume_loop(self):
        while self.running:
            try:
                msg = await self.consumer.getone()
                if not msg or not msg.value:
                    continue

                payload = msg.value
                logger.info(f"📥 Consumer received message for chat '{msg.key.decode('utf-8') if msg.key else ''}'")

                # Persist message to Supabase DB via RPC send_message_rpc
                chat_id = payload.get("chat_id")
                sender_id = payload.get("sender_id")
                content = payload.get("content")
                metadata = payload.get("metadata") or {"type": "text", "payload": {}}

                if chat_id and sender_id and content:
                    supabase.rpc(
                        "send_message_rpc",
                        {
                            "p_chat_id": chat_id,
                            "p_sender_id": sender_id,
                            "p_content": content,
                            "p_metadata": metadata
                        }
                    ).execute()
                    logger.info(f"💾 Successfully written chat message to DB for chat {chat_id}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"❌ Error in Kafka consumer loop: {str(e)}")
                await asyncio.sleep(1)

kafka_consumer = KafkaConsumerService()
