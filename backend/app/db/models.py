from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base


def default_uuid() -> uuid.UUID:
    return uuid.uuid4()


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    slug = Column(Text, unique=True, nullable=False)
    title = Column(Text, nullable=False)


class Model(Base):
    __tablename__ = "models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    title = Column(Text, nullable=False)
    name = Column(Text, nullable=False)  # fal-ai identifier
    description = Column(Text)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    cost_per_second = Column(Numeric(14, 4), default=0)
    audio_cost_multiplier = Column(Numeric(5, 2), default=2.0)
    cost_currency = Column(String(3), default="USD")
    cost_type = Column(Text, default="second")
    format_from = Column(Text, nullable=False)
    format_to = Column(Text, nullable=False)
    banner_image_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # new
    hint = Column(Text)
    options = Column(JSON)  # хранение опций UI
    max_file_count = Column(Numeric(10, 0))
    # демо-описания входов/выходов для построения UI и предпросмотра
    demo_input = Column(JSON)   # list[dict]
    demo_output = Column(JSON)  # list[dict]


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    name = Column(Text)
    email = Column(Text, unique=True)
    avatar_url = Column(Text)
    balance_tokens = Column(Numeric(14, 4), default=0)
    referrer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Tariff(Base):
    __tablename__ = "tariffs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    name = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    monthly_tokens = Column(Numeric(20, 0), nullable=False)
    cost_rub = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(3), default="RUB")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserTariff(Base):
    __tablename__ = "user_tariffs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    tariff_id = Column(UUID(as_uuid=True), ForeignKey("tariffs.id"))
    started_in = Column(DateTime(timezone=True))
    expired_in = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    type = Column(Text, nullable=False)  # charge,purchase,refund,promo
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(3), default="RUB")
    reference = Column(Text)
    meta = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Result(Base):
    __tablename__ = "results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    model_id = Column(UUID(as_uuid=True), ForeignKey("models.id"))
    model_name = Column(Text)
    category_id = Column(UUID(as_uuid=True))
    balance_on_start = Column(Numeric(14, 4))
    balance_on_end = Column(Numeric(14, 4))
    cost_tokens = Column(Numeric(14, 4))
    s3_url = Column(Text)
    meta = Column(JSON)
    is_ok = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # хранение структурированных объектов ввода/вывода (см. декларативную схему UI)
    input = Column(JSON)
    output = Column(JSON)


class Data(Base):
    __tablename__ = "data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    type = Column(Text, nullable=False)  # image | audio | video | text
    s3_url = Column(Text, nullable=False)
    public_s3_url = Column(Text)
    expired_in = Column(Numeric(20, 0))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserHistory(Base):
    __tablename__ = "user_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    result_id = Column(UUID(as_uuid=True), ForeignKey("results.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

