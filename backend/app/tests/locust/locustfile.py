from locust import HttpUser, task, between
import random
import string

def random_email():
    return "testuser_" + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8)) + "@example.com"

class RegisterChatLogoutUser(HttpUser):
    weight = 1
    wait_time = between(1, 3)

    @task
    def register_chat_logout(self):
        email = random_email()
        password = "TestPassword123!"
        # Register
        response = self.client.post(
            "/api/v1/register",
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json", "Accept": "application/json"}
        )
        if response.status_code == 200:
            # Obtener csrf_access_token de las cookies
            csrf_token = response.cookies.get("csrf_access_token")
            # Chat
            chat_response = self.client.post(
                "/api/v1/chat",
                json={"user_message": "Hola"},
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-CSRF-TOKEN": csrf_token
                },
                cookies=response.cookies
            )
            # Logout
            self.client.post("/api/v1/logout", cookies=response.cookies)

class LoginChatLogoutUser(HttpUser):
    weight = 2
    wait_time = between(1, 3)
    email = "testRegisterSession@ejemplo.com"
    password = "contraseña_Session"

    def on_start(self):
        # Ensure user exists (register once)
        self.client.post(
            "/api/v1/register",
            json={"email": self.email, "password": self.password},
            headers={"Content-Type": "application/json", "Accept": "application/json"}
        )

    @task
    def login_chat_logout(self):
        # Login
        response = self.client.post(
            "/api/v1/login",
            json={"email": self.email, "password": self.password},
            headers={"Content-Type": "application/json", "Accept": "application/json"}
        )
        if response.status_code == 200:
            csrf_token = response.cookies.get("csrf_access_token")
            # Chat
            chat_response = self.client.post(
                "/api/v1/chat",
                json={"user_message": "Hola"},
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-CSRF-TOKEN": csrf_token
                },
                cookies=response.cookies
            )
            # Logout
            self.client.post("/api/v1/logout", cookies=response.cookies)