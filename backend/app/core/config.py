from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("backend/.env", ".env"), env_file_encoding="utf-8", extra="ignore")

    # Core
    environment: str = Field(default="local")

    # DB / Queue
    database_url: str = Field(default="postgresql://neurolib:neurolib@postgres:5432/neurolibrary", alias="DATABASE_URL")
    redis_url: str = Field(default="redis://redis:6379/0", alias="REDIS_URL")

    # S3
    s3_endpoint_url: str | None = Field(default=None, alias="S3_ENDPOINT_URL")
    s3_access_key_id: str | None = Field(default=None, alias="S3_ACCESS_KEY_ID")
    s3_secret_access_key: str | None = Field(default=None, alias="S3_SECRET_ACCESS_KEY")
    s3_bucket_name: str | None = Field(default=None, alias="S3_BUCKET_NAME")
    s3_region_name: str | None = Field(default=None, alias="S3_REGION_NAME")

    # Payments
    yookassa_shop_id: str | None = Field(default=None, alias="YOOKASSA_SHOP_ID")
    yookassa_api_key: str | None = Field(default=None, alias="YOOKASSA_API_KEY")

    # OAuth
    oauth_yandex_client_id: str | None = Field(default=None, alias="OAUTH_YANDEX_CLIENT_ID")
    oauth_yandex_client_secret: str | None = Field(default=None, alias="OAUTH_YANDEX_CLIENT_SECRET")
    oauth_google_client_id: str | None = Field(default=None, alias="OAUTH_GOOGLE_CLIENT_ID")
    oauth_google_client_secret: str | None = Field(default=None, alias="OAUTH_GOOGLE_CLIENT_SECRET")
    oauth_vk_client_id: str | None = Field(default=None, alias="OAUTH_VK_CLIENT_ID")
    oauth_vk_client_secret: str | None = Field(default=None, alias="OAUTH_VK_CLIENT_SECRET")

    # JWT
    jwt_secret_key: str = Field(default="dev-secret", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=60, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")

    # Email
    smtp_server: str | None = Field(default=None, alias="SMTP_SERVER")
    smtp_port: int | None = Field(default=None, alias="SMTP_PORT")
    smtp_username: str | None = Field(default=None, alias="SMTP_USERNAME")
    smtp_password: str | None = Field(default=None, alias="SMTP_PASSWORD")

    # URLs
    frontend_return_url_base: str | None = Field(default=None, alias="FRONTEND_RETURN_URL_BASE")
    backend_public_base_url: str | None = Field(default=None, alias="BACKEND_PUBLIC_BASE_URL")

    # Misc
    telegram_bot_token: str | None = Field(default=None, alias="TELEGRAM_BOT_TOKEN")
    telegram_ref_check_secret: str | None = Field(default=None, alias="TELEGRAM_REF_CHECK_SECRET")

    # Pricing
    usd_to_rub: float = Field(default=100.0, alias="USD_TO_RUB")


settings = Settings()

