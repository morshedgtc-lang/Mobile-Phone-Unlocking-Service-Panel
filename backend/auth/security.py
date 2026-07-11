import logging

logger = logging.getLogger(__name__)

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
    logger.info("Password hashing: argon2/bcrypt loaded")
except Exception as e:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    logger.warning(f"argon2 unavailable, falling back to bcrypt: {e}")


class Security:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification failed: {e}")
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)
