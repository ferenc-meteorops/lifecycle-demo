"""add status column to items

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-08 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("items", sa.Column("status", sa.String(50), server_default="active", nullable=False))


def downgrade() -> None:
    op.drop_column("items", "status")
