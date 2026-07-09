from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

Base = declarative_base()


def enum_values(enum_cls):
    """Return enum member values for SQLAlchemy Enum storage (keeps .value consistent across DBs)."""
    return [member.value for member in enum_cls]


class GUID(TypeDecorator):
    """Portable UUID type: native PostgreSQL UUID in production, CHAR(36) on SQLite/others."""

    impl = CHAR
    cache_ok = True

    def __init__(self, as_uuid=True, **kwargs):
        self.as_uuid = as_uuid
        super().__init__(**kwargs)

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)
