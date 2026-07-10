from passlib.context import CryptContext
from config import SECRET_KEY, ALGORITHM

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class Security:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)
