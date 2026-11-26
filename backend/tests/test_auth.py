import pytest

from apps.categories.models import Category


@pytest.mark.django_db
def test_health_endpoint_returns_ok(api_client):
    res = api_client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["service"] == "financial-control-api"


@pytest.mark.django_db
def test_auth_me_blocks_unauthenticated_with_401(api_client):
    res = api_client.get("/api/auth/me")
    assert res.status_code == 401
    assert "message" in res.json()


@pytest.mark.django_db
def test_register_creates_user_default_categories_and_returns_jwt(api_client):
    res = api_client.post(
        "/api/auth/register",
        {
            "name": "Maria Silva",
            "email": "Maria@FinPulse.dev",
            "password": "password123",
        },
        format="json",
    )
    assert res.status_code == 201
    body = res.json()
    assert isinstance(body["accessToken"], str)
    assert body["user"]["email"] == "maria@finpulse.dev"
    assert body["user"]["name"] == "Maria Silva"
    assert "createdAt" in body["user"]
    assert Category.objects.filter(user_id=body["user"]["id"]).count() == 6


@pytest.mark.django_db
def test_register_duplicate_email_returns_409(api_client, user):
    res = api_client.post(
        "/api/auth/register",
        {
            "name": "Outro",
            "email": user.email,
            "password": "password123",
        },
        format="json",
    )
    assert res.status_code == 409
    assert "message" in res.json()


@pytest.mark.django_db
def test_login_returns_jwt_and_me_works(api_client, user):
    login_res = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "secret123"},
        format="json",
    )
    assert login_res.status_code == 200
    body = login_res.json()
    assert isinstance(body["accessToken"], str)
    assert body["user"]["email"] == user.email

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {body['accessToken']}")
    me_res = api_client.get("/api/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["user"]["id"] == str(user.id)


@pytest.mark.django_db
def test_login_invalid_password_returns_401(api_client, user):
    res = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": "wrong"},
        format="json",
    )
    assert res.status_code == 401
    assert "message" in res.json()
