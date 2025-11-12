from decimal import Decimal
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.db.models import WebhookLog, Transaction, User, Job
from app.services.email_service import send_email_with_links

router = APIRouter(prefix="/webhooks", tags=["Webhooks"]) 


@router.post("/payments/{provider}")
async def payments_webhook(provider: str, request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.json()

    # логируем событие
    log = WebhookLog(event_type=f"payments:{provider}", payload=payload)
    db.add(log)
    db.commit()

    # Специальная обработка YooKassa оплаты заказа (одноразовая генерация)
    if provider == "yookassa":
        obj = payload.get("object") or {}
        status = obj.get("status") or payload.get("status")
        metadata = obj.get("metadata") or {}
        order_id = metadata.get("order_id") or payload.get("order_id")
        amount_val = None
        try:
            amount_val = obj.get("amount", {}).get("value")
        except Exception:
            amount_val = None

        if order_id and status in ("succeeded", "succeeded_with_3ds", "waiting_for_capture"):
            job = db.query(Job).filter(Job.order_id == order_id).first()
            if job:
                # обновим финансы/статус job
                if amount_val is not None:
                    try:
                        job.price_rub = Decimal(str(amount_val))
                    except Exception:
                        pass
                job.is_paid = True
                # по требованию: при оплате сразу done
                job.status = "done"
                info = job.payment_info or {}
                info.update({"yookassa": obj})
                job.payment_info = info
                db.commit()
                db.refresh(job)

                # сохраним транзакцию
                try:
                    txn = Transaction(
                        user_id=job.user_id,
                        job_id=job.id,
                        type="gateway_payment",
                        provider="yookassa",
                        status="success" if status.startswith("succeeded") else "pending",
                        amount_rub=Decimal(str(amount_val)) if amount_val is not None else None,
                        currency="RUB",
                        reference=obj.get("id"),
                        meta=payload,
                    )
                    db.add(txn)
                    db.commit()
                except Exception:
                    # не прерываем обработку, если не удалось записать транзакцию
                    db.rollback()

                # письмо с ссылкой на результат (или хотя бы на страницу с job_id)
                try:
                    links = [job.result_url] if job.result_url else []
                    if job.email:
                        send_email_with_links(recipient_email=job.email, links=links, job_id=str(job.id))
                except Exception:
                    # игнор ошибок отправки письма
                    pass

                return {"ok": True}
            else:
                # Пополнение баланса (не привязано к job): берём user_id из metadata
                user_id_meta = metadata.get("user_id")
                if user_id_meta and amount_val is not None and str(status).startswith("succeeded"):
                    user = db.query(User).filter(User.id == user_id_meta).first()
                    if user:
                        try:
                            # Рассчитаем сумму для зачисления с учетом бонуса (если передана в metadata)
                            credit_rub_val = metadata.get("credit_rub")
                            credit_rub_dec = None
                            try:
                                credit_rub_dec = Decimal(str(credit_rub_val)) if credit_rub_val is not None else Decimal(str(amount_val))
                            except Exception:
                                credit_rub_dec = Decimal(str(amount_val))
                            txn = Transaction(
                                user_id=user.id,
                                job_id=None,
                                type="gateway_payment",
                                provider="yookassa",
                                status="success",
                                amount_rub=Decimal(str(amount_val)),
                                currency="RUB",
                                reference=obj.get("id"),
                                meta=payload,
                            )
                            db.add(txn)
                            # Конвертация RUB -> токены и зачисление
                            tokens = rubles_to_tokens(credit_rub_dec)
                            user.balance_tokens = (user.balance_tokens or 0) + Decimal(tokens)
                            txn.tokens_delta = Decimal(tokens)
                            db.commit()
                        except Exception:
                            db.rollback()
                        return {"ok": True}

    # Простейшая универсальная обработка: если в payload есть userId и amountRub — записываем транзакцию (без токенов)
    user_id = payload.get("userId") or payload.get("user_id")
    amount_rub = payload.get("amountRub") or payload.get("amount_rub")
    plan = payload.get("plan")
    reference = payload.get("reference")
    if user_id and amount_rub:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            txn = Transaction(
                user_id=user.id,
                type="gateway_payment",
                provider=provider,
                status="success",
                amount_rub=Decimal(str(amount_rub)),
                currency="RUB",
                plan=plan,
                reference=reference,
                meta=payload,
            )
            db.add(txn)
            db.commit()

    return {"ok": True}

