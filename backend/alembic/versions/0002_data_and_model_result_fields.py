"""
Add Data table and fields to Model and Result
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0002_data_and_model_result_fields"
down_revision = "0001_init_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # models additions
    op.add_column("models", sa.Column("hint", sa.Text()))
    op.add_column("models", sa.Column("options", postgresql.JSONB(astext_type=sa.Text())))
    op.add_column("models", sa.Column("max_file_count", sa.Numeric(10, 0)))

    # results additions
    op.add_column("results", sa.Column("input", postgresql.JSONB(astext_type=sa.Text())))
    op.add_column("results", sa.Column("output", postgresql.JSONB(astext_type=sa.Text())))

    # data table
    op.create_table(
        "data",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("s3_url", sa.Text(), nullable=False),
        sa.Column("public_s3_url", sa.Text()),
        sa.Column("expired_in", sa.Numeric(20, 0)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )


def downgrade() -> None:
    op.drop_table("data")
    op.drop_column("results", "output")
    op.drop_column("results", "input")
    op.drop_column("models", "max_file_count")
    op.drop_column("models", "options")
    op.drop_column("models", "hint")
