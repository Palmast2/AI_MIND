import requests

BASE_URL = "https://api.aimind.portablelab.work"

def test_register_login_chat_logout():
    # Registro
    email = "testuser_pytest@example.com"
    password = "TestPassword123!"
    r = requests.post(f"{BASE_URL}/api/v1/register", json={"email": email, "password": password})
    assert r.status_code == 200

    # Login
    r = requests.post(f"{BASE_URL}/api/v1/login", json={"email": email, "password": password})
    assert r.status_code == 200
    cookies = r.cookies
    csrf_token = cookies.get("csrf_access_token")

    # Chat
    headers = {
        "X-CSRF-TOKEN": csrf_token,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    r = requests.post(f"{BASE_URL}/api/v1/chat", json={"user_message": "Hola"}, headers=headers, cookies=cookies)
    assert r.status_code == 200

    # Logout
    r = requests.post(f"{BASE_URL}/api/v1/logout", cookies=cookies)
    assert r.status_code == 200