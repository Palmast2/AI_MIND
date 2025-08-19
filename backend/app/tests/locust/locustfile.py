from locust import HttpUser, task, between

class PublicUser(HttpUser):
    wait_time = between(1, 2)

    @task
    def login(self):
        self.client.post(
            "/api/v1/login",
            json={"email": "usuario@ejemplo.com", "password": "contraseña_segura"}
        )