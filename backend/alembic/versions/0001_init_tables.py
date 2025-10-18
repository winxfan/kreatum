"""
init tables
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001_init_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")

    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.Text(), nullable=False, unique=True),
        sa.Column("title", sa.Text(), nullable=False),
    )

    op.create_table(
        "models",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id")),
        sa.Column("cost_per_second", sa.Numeric(14, 4), server_default="0"),
        sa.Column("audio_cost_multiplier", sa.Numeric(5, 2), server_default="2.0"),
        sa.Column("cost_currency", sa.String(3), server_default="USD"),
        sa.Column("cost_type", sa.Text(), server_default="second"),
        sa.Column("format_from", sa.Text(), nullable=False),
        sa.Column("format_to", sa.Text(), nullable=False),
        sa.Column("banner_image_url", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text()),
        sa.Column("email", sa.Text(), unique=True),
        sa.Column("avatar_url", sa.Text()),
        sa.Column("balance_tokens", sa.Numeric(14, 4), server_default="0"),
        sa.Column("referrer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "tariffs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("monthly_tokens", sa.Numeric(20, 0), nullable=False),
        sa.Column("cost_rub", sa.Numeric(14, 2), nullable=False),
        sa.Column("currency", sa.String(3), server_default="RUB"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "user_tariffs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("tariff_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tariffs.id")),
        sa.Column("started_in", sa.DateTime(timezone=True)),
        sa.Column("expired_in", sa.DateTime(timezone=True)),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
    )

    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("currency", sa.String(3), server_default="RUB"),
        sa.Column("reference", sa.Text()),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("model_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("models.id")),
        sa.Column("model_name", sa.Text()),
        sa.Column("category_id", postgresql.UUID(as_uuid=True)),
        sa.Column("balance_on_start", sa.Numeric(14, 4)),
        sa.Column("balance_on_end", sa.Numeric(14, 4)),
        sa.Column("cost_tokens", sa.Numeric(14, 4)),
        sa.Column("s3_url", sa.Text()),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("is_ok", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "user_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("result_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("results.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )


def downgrade() -> None:
    op.drop_table("user_history")
    op.drop_table("results")
    op.drop_table("transactions")
    op.drop_table("user_tariffs")
    op.drop_table("tariffs")
    op.drop_table("users")
    op.drop_table("models")
    op.drop_table("categories")

