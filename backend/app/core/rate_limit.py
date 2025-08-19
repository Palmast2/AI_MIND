import os
from slowapi import Limiter
from app.core.utils import get_user_id

REDIS_URL = os.getenv("REDIS_URL")

limiter = Limiter(key_func=get_user_id, storage_uri=REDIS_URL)