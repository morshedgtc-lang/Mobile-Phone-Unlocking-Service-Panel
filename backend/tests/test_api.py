"""API Integration Tests - Run with: python -m pytest tests/ -v"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from main import app
from database.session import get_db
from database.base import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.user import User, UserRole, UserGroup
from auth.security import Security

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def setup_module(module):
    """Create a test user before tests"""
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == "test@test.com").first()
        if not user:
            user = User(
                username="testuser",
                email="test@test.com",
                hashed_password=Security.get_password_hash("Test1234!"),
                role=UserRole.SUPER_ADMIN,
                group=UserGroup.RETAIL,
                is_active=True,
                balance=100.0,
            )
            db.add(user)
            db.commit()
    finally:
        db.close()

def teardown_module(module):
    Base.metadata.drop_all(bind=engine)

class TestAPI:
    def test_health(self):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["status"] == "running"

    def test_login_success(self):
        r = client.post("/auth/login", data={"username": "test@test.com", "password": "Test1234!"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_failure(self):
        r = client.post("/auth/login", data={"username": "test@test.com", "password": "wrong"})
        assert r.status_code == 401

    def test_get_me(self):
        r = client.post("/auth/login", data={"username": "test@test.com", "password": "Test1234!"})
        token = r.json()["access_token"]
        r2 = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 200
        assert r2.json()["email"] == "test@test.com"

    def test_list_services(self):
        r = client.get("/services")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
