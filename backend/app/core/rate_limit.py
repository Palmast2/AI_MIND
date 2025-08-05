from slowapi import Limiter
from app.core.utils import get_user_id

limiter = Limiter(key_func=get_user_id, storage_uri="redis://localhost:6379")