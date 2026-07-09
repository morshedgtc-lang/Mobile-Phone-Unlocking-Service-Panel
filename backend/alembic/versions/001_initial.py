"""initial migration - placeholder

Run `alembic upgrade head` once PostgreSQL is available.
Or in production: `alembic upgrade head` via Railway deploy script.
"""
revision = "001"
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

def upgrade():
    pass

def downgrade():
    pass
