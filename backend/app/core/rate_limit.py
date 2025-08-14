import os
from slowapi import Limiter
from app.core.utils import get_user_id

USE_REDIS = os.getenv("USE_REDIS", "false").lower() == "true"

storage_uri = "redis://localhost:6379" if USE_REDIS else "memory://"

limiter = Limiter(
    key_func=get_user_id,
    storage_uri=storage_uri
)
