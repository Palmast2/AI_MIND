from fastapi_jwt_auth import AuthJWT
from slowapi.util import get_remote_address

def get_user_id(request):
    try:
        token = request.cookies.get("access_token_cookie")
        if token:
            Authorize = AuthJWT()
            Authorize._token = token
            user_id = Authorize.get_jwt_subject()
            if user_id:
                return user_id
    except Exception:
        pass
    # Si no hay JWT, usa la IP como fallback
    return get_remote_address(request)