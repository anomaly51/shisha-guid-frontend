# Telegram uploader

Dockerized uploader for a user Telegram account. It sends every image strictly as a pair:

1. original file/document
2. the same file as a regular photo

By default it sends without captions/text.

## Setup

```bash
cd tools/telegram-uploader
cp .env.example .env
```

Fill `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, and optionally `TELEGRAM_PHONE` in `.env`.

The compose file mounts photos from:

```bash
/Users/nekoneki/Desktop/map23-prod
```

Override it when needed:

```bash
HOST_PHOTOS_DIR=/path/to/photos docker compose -f docker-compose.telegram.yml run --rm telegram-uploader status
```

## Login

Run this once. Enter Telegram code/password in the terminal, not in chat.

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader login
```

The session is stored in `tools/telegram-uploader/data/telegram-user.session`.

## Check Target

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader dialogs --filter photochi
```

## Dry Run

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader send --dry-run --limit 3
```

## Send

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader send
```

Useful options:

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader send --target photochi43322
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader send --limit 10
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader send --with-caption
```

## Status

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader status
```

The state file records completed document/photo steps separately. If the process stops after a document but before the matching photo, the next run sends only the missing photo before moving to the next image.
