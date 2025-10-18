from decimal import Decimal, ROUND_UP
from app.core.config import settings


def rubles_to_tokens(rub_amount: Decimal) -> int:
    tokens = (rub_amount * Decimal("120") / Decimal("100")).quantize(Decimal("1"), rounding=ROUND_UP)
    return int(tokens)


def usd_to_rub(usd_amount: Decimal) -> Decimal:
    rate = Decimal(str(settings.usd_to_rub))
    return (usd_amount * rate).quantize(Decimal("0.01"), rounding=ROUND_UP)

