## OpenAPI спецификация (Swagger) для backend‑сервера живых фото

Ниже — спецификация OpenAPI 3.1.0 в формате YAML. Клиент (бот на python-telegram-bot) будет использовать эти ручки. Базовый URL задаётся переменной окружения `SERVER_URL` (например, `https://kreatum.ru/api`). Аутентификация — по заголовку `X-API-Key`.

```yaml
openapi: 3.1.0
info:
  title: Live Photo Bot Backend API
  version: 1.0.0
  description: |
    Backend API для Telegram-бота «Оживи фото». Сервер управляет пользователями, балансом,
    транзакциями, заданиями (jobs), отзывами, рефералами и розыгрышами.
    Клиент — только бот, авторизация через X-API-Key.

servers:
  - url: https://kreatum.ru/api
    description: Production

security:
  - ApiKeyAuth: []

tags:
  - name: Users
  - name: Data
  - name: Jobs
  - name: Payments
  - name: Transactions
  - name: Referrals
  - name: Reviews
  - name: Subscriptions
  - name: Lotteries
  - name: Tariffs
  - name: Webhooks

paths:
  /api/v1/users/register-or-login:
    post:
      tags: [Users]
      summary: Регистрация/логин по Telegram (идемпотентно)
      description: Создаёт пользователя при первом заходе или возвращает существующего.
      operationId: usersRegisterOrLogin
      parameters:
        - $ref: '#/components/parameters/IdempotencyKey'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [telegramId]
              properties:
                telegramId:
                  type: string
                username:
                  type: string
                anonUserId:
                  type: string
                refCode:
                  type: string
                  description: Реферальный код пригласившего (опционально)
      responses:
        '200':
          description: Пользователь
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /api/v1/users/{userId}:
    get:
      tags: [Users]
      summary: Получить пользователя по id
      operationId: usersGetById
      parameters:
        - $ref: '#/components/parameters/UserId'
      responses:
        '200':
          description: Пользователь
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /api/v1/users/{userId}/consent:
    patch:
      tags: [Users]
      summary: Обновить статус согласия на обработку ПД
      operationId: usersUpdateConsent
      parameters:
        - $ref: '#/components/parameters/UserId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [consentPd]
              properties:
                consentPd:
                  type: boolean
      responses:
        '200':
          description: Обновлённый пользователь
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /api/v1/users/{userId}/balance:
    get:
      tags: [Users]
      summary: Получить баланс пользователя
      operationId: usersGetBalance
      parameters:
        - $ref: '#/components/parameters/UserId'
      responses:
        '200':
          description: Баланс
          content:
            application/json:
              schema:
                type: object
                properties:
                  balanceTokens:
                    type: number
                    format: decimal

  /api/v1/data:
    post:
      tags: [Data]
      summary: Загрузка данных (multipart)
      description: Принимает файл фото/видео/аудио с типом. Альтернатива — presign.
      operationId: dataUploadMultipart
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file, type]
              properties:
                file:
                  type: string
                  format: binary
                type:
                  type: string
                  enum: [image, video, text, audio]
      responses:
        '201':
          description: Создан Data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Data'

  /api/v1/data/presign:
    post:
      tags: [Data]
      summary: Получить presigned URL для загрузки в S3
      operationId: dataGetPresign
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [type, fileName, contentType]
              properties:
                type:
                  type: string
                  enum: [image, video, text, audio]
                fileName:
                  type: string
                contentType:
                  type: string
      responses:
        '200':
          description: URL и временный объект
          content:
            application/json:
              schema:
                type: object
                properties:
                  dataId:
                    type: string
                    format: uuid
                  uploadUrl:
                    type: string
                  expiresInSeconds:
                    type: integer
                  fields:
                    type: object

  /api/v1/data/{dataId}/confirm:
    post:
      tags: [Data]
      summary: Подтвердить успешную загрузку файла
      operationId: dataConfirmUpload
      parameters:
        - $ref: '#/components/parameters/DataId'
      responses:
        '200':
          description: Готовый объект Data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Data'

  /api/v1/jobs:
    post:
      tags: [Jobs]
      summary: Создать задание (резерв токенов)
      description: |
        Создаёт заказ на оживление/реставрацию. Если баланс >= стоимости — резервируются токены.
      operationId: jobsCreate
      parameters:
        - $ref: '#/components/parameters/IdempotencyKey'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [userId, serviceType, input]
              properties:
                userId:
                  type: string
                  format: uuid
                serviceType:
                  type: string
                  enum: [animate, restore]
                description:
                  type: string
                  maxLength: 300
                input:
                  type: array
                  items:
                    $ref: '#/components/schemas/IOObject'
      responses:
        '201':
          description: Заказ создан
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Job'
    get:
      tags: [Jobs]
      summary: Список заданий пользователя
      operationId: jobsList
      parameters:
        - in: query
          name: userId
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Массив задач
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Job'

  /api/v1/jobs/{jobId}:
    get:
      tags: [Jobs]
      summary: Получить задание
      operationId: jobsGet
      parameters:
        - $ref: '#/components/parameters/JobId'
      responses:
        '200':
          description: Объект задания
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Job'

  /api/v1/jobs/{jobId}/cancel:
    post:
      tags: [Jobs]
      summary: Отменить задание (снять резерв)
      operationId: jobsCancel
      parameters:
        - $ref: '#/components/parameters/JobId'
      responses:
        '200':
          description: Обновлённый Job
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Job'

  /api/v1/payments/intents:
    post:
      tags: [Payments]
      summary: Создать платёж (инвойс) для пополнения
      description: Возвращает ссылку/параметры для оплаты. Начисление через webhook.
      operationId: paymentsCreateIntent
      parameters:
        - $ref: '#/components/parameters/IdempotencyKey'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [userId, amountRub]
              properties:
                userId:
                  type: string
                  format: uuid
                amountRub:
                  type: number
                  format: decimal
                provider:
                  type: string
                  enum: [yookassa, stripe, telegram]
                plan:
                  type: string
                  description: tariff id/label (optional)
      responses:
        '201':
          description: Параметры оплаты
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentIntent'

  /api/v1/transactions:
    get:
      tags: [Transactions]
      summary: История транзакций пользователя
      operationId: transactionsList
      parameters:
        - in: query
          name: userId
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Массив транзакций
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Transaction'

  /api/v1/subscriptions/check-channel:
    post:
      tags: [Subscriptions]
      summary: Проверить подписку пользователя на канал и начислить бонус
      operationId: subscriptionsCheckChannel
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [userId, telegramId, channelUsername]
              properties:
                userId:
                  type: string
                  format: uuid
                telegramId:
                  type: string
                channelUsername:
                  type: string
      responses:
        '200':
          description: Результат проверки
          content:
            application/json:
              schema:
                type: object
                properties:
                  isMember:
                    type: boolean
                  bonusGranted:
                    type: boolean
                  balanceTokens:
                    type: number
                    format: decimal

  /api/v1/reviews/check:
    post:
      tags: [Reviews]
      summary: Проверить отзыв в канале и начислить награду (1 раз)
      operationId: reviewsCheck
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [userId]
              properties:
                userId:
                  type: string
                  format: uuid
                messageLink:
                  type: string
                  description: Ссылка на сообщение (если автопоиск невозможен)
      responses:
        '200':
          description: Статус проверки
          content:
            application/json:
              schema:
                type: object
                properties:
                  found:
                    type: boolean
                  bonusGranted:
                    type: boolean
                  balanceTokens:
                    type: number
                    format: decimal

  /api/v1/referrals/link:
    get:
      tags: [Referrals]
      summary: Получить реферальную ссылку
      operationId: referralsGetLink
      parameters:
        - in: query
          name: userId
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Ссылка
          content:
            application/json:
              schema:
                type: object
                properties:
                  refLink:
                    type: string

  /api/v1/referrals/stats:
    get:
      tags: [Referrals]
      summary: Статистика по рефералам
      operationId: referralsStats
      parameters:
        - in: query
          name: userId
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Статистика
          content:
            application/json:
              schema:
                type: object
                properties:
                  totalInvited:
                    type: integer
                  invitedPaidCount:
                    type: integer
                  refEarned:
                    type: number
                    format: decimal

  /api/v1/referrals/history:
    get:
      tags: [Referrals]
      summary: История приглашений
      operationId: referralsHistory
      parameters:
        - in: query
          name: userId
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Массив записей
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Referral'

  /api/v1/lotteries/current:
    get:
      tags: [Lotteries]
      summary: Текущий розыгрыш
      operationId: lotteriesCurrent
      responses:
        '200':
          description: Лотерея
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Lottery'

  /api/v1/lotteries/history:
    get:
      tags: [Lotteries]
      summary: История розыгрышей
      operationId: lotteriesHistory
      responses:
        '200':
          description: Массив лотерей
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Lottery'

  /api/v1/lotteries/entries/me:
    get:
      tags: [Lotteries]
      summary: Моя запись в текущем розыгрыше
      operationId: lotteriesEntryMe
      parameters:
        - in: query
          name: userId
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Запись
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LotteryEntry'

  /api/v1/lotteries/entries/submit-social:
    post:
      tags: [Lotteries]
      summary: Отправить ссылки на публикации для участия
      operationId: lotteriesSubmitSocial
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [userId, socialLinks]
              properties:
                userId:
                  type: string
                  format: uuid
                socialLinks:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Обновлённая запись
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LotteryEntry'

  /api/v1/tariffs:
    get:
      tags: [Tariffs]
      summary: Список тарифов на пополнение
      operationId: tariffsList
      responses:
        '200':
          description: Массив тарифов
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Tariff'

  /api/v1/webhooks/payments/{provider}:
    post:
      tags: [Webhooks]
      summary: Вебхук провайдера платежей
      description: Подтверждает оплату и начисляет токены. Авторизация по подписи провайдера.
      operationId: webhookPayments
      parameters:
        - in: path
          name: provider
          required: true
          schema:
            type: string
            enum: [yookassa, stripe, telegram]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '200':
          description: ok

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  parameters:
    IdempotencyKey:
      in: header
      name: Idempotency-Key
      required: false
      description: Для идемпотентных операций (создание пользователя, платежа, заказа)
      schema:
        type: string
    UserId:
      in: path
      name: userId
      required: true
      schema:
        type: string
        format: uuid
    JobId:
      in: path
      name: jobId
      required: true
      schema:
        type: string
        format: uuid
    DataId:
      in: path
      name: dataId
      required: true
      schema:
        type: string
        format: uuid

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        telegramId:
          type: string
        username:
          type: string
        anonUserId:
          type: string
        email:
          type: string
        avatarUrl:
          type: string
        balanceTokens:
          type: number
          format: decimal
        refCode:
          type: string
        referrerId:
          type: string
          format: uuid
        hasLeftReview:
          type: boolean
        consentPd:
          type: boolean
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    IOObject:
      type: object
      properties:
        type:
          type: string
          enum: [image, video, text, audio]
        dataId:
          type: string
          format: uuid
        url:
          type: string
        meta:
          type: object

    Job:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        modelId:
          type: string
          format: uuid
        orderId:
          type: string
        serviceType:
          type: string
          enum: [animate, restore]
        status:
          type: string
            enum: [waiting_payment, queued, processing, done, failed]
        priceRub:
          type: number
          format: decimal
        tokensReserved:
          type: number
          format: decimal
        tokensConsumed:
          type: number
          format: decimal
        input:
          type: array
          items:
            $ref: '#/components/schemas/IOObject'
        output:
          type: array
          items:
            $ref: '#/components/schemas/IOObject'
        resultUrl:
          type: string
        progress:
          type: integer
          minimum: 0
          maximum: 100
        meta:
          type: object
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Transaction:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        jobId:
          type: string
          format: uuid
        type:
          type: string
          enum: [charge, purchase, refund, promo, gateway_payment]
        provider:
          type: string
          enum: [yookassa, stripe, telegram, manual]
        status:
          type: string
          enum: [success, failed, pending]
        amountRub:
          type: number
          format: decimal
        tokensDelta:
          type: number
          format: decimal
        currency:
          type: string
        plan:
          type: string
        reference:
          type: string
        meta:
          type: object
        createdAt:
          type: string
          format: date-time

    Data:
      type: object
      properties:
        id:
          type: string
          format: uuid
        type:
          type: string
          enum: [image, video, text, audio]
        s3Url:
          type: string
        publicS3Url:
          type: string
        expiredIn:
          type: integer
        createdAt:
          type: string
          format: date-time

    PaymentIntent:
      type: object
      properties:
        id:
          type: string
          format: uuid
        provider:
          type: string
          enum: [yookassa, stripe, telegram]
        amountRub:
          type: number
          format: decimal
        currency:
          type: string
        paymentUrl:
          type: string
        reference:
          type: string

    Tariff:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        title:
          type: string
        monthlyTokens:
          type: integer
        costRub:
          type: number
          format: decimal
        currency:
          type: string
        createdAt:
          type: string
          format: date-time

    Referral:
      type: object
      properties:
        id:
          type: string
          format: uuid
        inviterId:
          type: string
          format: uuid
        inviteeId:
          type: string
          format: uuid
        inviteePaid:
          type: boolean
        rewardGiven:
          type: boolean
        createdAt:
          type: string
          format: date-time

    Review:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        messageId:
          type: string
        rewardGiven:
          type: boolean
        createdAt:
          type: string
          format: date-time

    Lottery:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        startDate:
          type: string
          format: date-time
        endDate:
          type: string
          format: date-time
        prizes:
          type: array
          items:
            type: object
        createdAt:
          type: string
          format: date-time

    LotteryEntry:
      type: object
      properties:
        id:
          type: string
          format: uuid
        lotteryId:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        referralCount:
          type: integer
        socialLinks:
          type: array
          items:
            type: string
        rewardGiven:
          type: boolean
        createdAt:
          type: string
          format: date-time

  responses:
    Error:
      description: Ошибка
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

  schemas:
    Error:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: object

```

Примечания по использованию:
- Передавайте заголовок `X-API-Key: ${SERVER_API_KEY}` во всех клиентских запросах.
- Для идемпотентных операций отправляйте `Idempotency-Key`.
- Webhook’и могут не требовать `X-API-Key`, но должны проверять подписи провайдеров.


