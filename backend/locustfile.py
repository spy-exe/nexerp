from __future__ import annotations

from locust import HttpUser, between, task


class NexErpApiUser(HttpUser):
    wait_time = between(0.5, 2.0)

    def on_start(self) -> None:
        with self.client.post(
            "/api/v1/auth/login",
            json={"email": "admin@demo.nexerp.local", "password": "Senha@123"},
            name="auth_login_demo",
            catch_response=True,
        ) as response:
            if response.status_code == 200:
                self.headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
                response.success()
                return
            self.headers = {}
            response.failure("Configure um usuário demo antes do teste de carga.")

    @task(5)
    def dashboard(self) -> None:
        self.client.get("/api/v1/dashboard/overview", headers=self.headers, name="dashboard_overview")

    @task(3)
    def products(self) -> None:
        self.client.get("/api/v1/products", headers=self.headers, name="products_list")

    @task(2)
    def sales(self) -> None:
        self.client.get("/api/v1/sales", headers=self.headers, name="sales_list")

    @task(1)
    def fiscal_documents(self) -> None:
        self.client.get("/api/v1/fiscal/invoices", headers=self.headers, name="fiscal_invoices")
