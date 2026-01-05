# app/utils/rate_limit.py

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict

class RateLimiter:
    def __init__(self, max_messages: int = 10, window_seconds: int = 10):
        self.max_messages = max_messages
        self.window = timedelta(seconds=window_seconds)
        self.message_times: Dict[str, list] = defaultdict(list)
    
    def check_rate_limit(self, user_id: str) -> bool:
        now = datetime.utcnow()
        cutoff = now - self.window
        
        # Remove old messages
        self.message_times[user_id] = [
            t for t in self.message_times[user_id] 
            if t > cutoff
        ]
        
        # Check limit
        if len(self.message_times[user_id]) >= self.max_messages:
            return False
        
        self.message_times[user_id].append(now)
        return True