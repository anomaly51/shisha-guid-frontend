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

## Session Without QR Every Time

The uploader works from a Telegram user account through a persistent Telethon session file. To run without scanning QR codes every time, keep this file in `tools/telegram-uploader/data/` and mount that folder into Docker.

What you need from the account owner:

1. `TELEGRAM_API_ID` and `TELEGRAM_API_HASH`
   - Get them from `https://my.telegram.org/apps`.
   - These are app credentials for the Telegram API.
   - Store them in `tools/telegram-uploader/.env`.

2. `TELEGRAM_PHONE`
   - Phone number of the Telegram user account.
   - Store it in `.env`.

3. One reusable user session
   - Preferred Docker format: `tools/telegram-uploader/data/telegram-user.session`.
   - This file is enough for future runs; no QR/code prompt is needed while the session remains valid.
   - Never commit it. `tools/telegram-uploader/data/` is ignored by git.

4. Target chat/channel
   - Username, for example `photochi43322`, or numeric Telegram ID.
   - Store it as `TELEGRAM_TARGET` in `.env`, or pass `--target`.

5. Source photo directory
   - Default host path is `/Users/nekoneki/Desktop/map23-prod`.
   - Override with `HOST_PHOTOS_DIR=/path/to/photos`.

### Create Session Once

If there is no session file yet, run this once in your own terminal and enter the login code/password there:

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader login
```

Do not paste Telegram codes, 2FA passwords, or session files into chat.

After login, verify the session:

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader dialogs --filter photochi
```

The output must show the expected user-owned dialogs. If Telegram asks for a code again, the `.session` file is missing, invalid, or was created for a different API app/account.

### Reuse Existing Session

If a valid Telethon session already exists, copy it into:

```bash
tools/telegram-uploader/data/telegram-user.session
```

Then verify:

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader dialogs --filter photochi
```

This is the cleanest way to run Docker without QR/login prompts. The container only needs `.env`, the mounted photos folder, and `data/telegram-user.session`.

### Concrete Paths On This Mac

AyuGram/Telegram Desktop do not store a ready Telethon `.session` file. They store a `tdata` directory. That directory must be imported into a Telethon `.session` file first.

Local `tdata` locations:

```bash
/Users/nekoneki/Library/Application Support/AyuGram Desktop/tdata
/Users/nekoneki/Library/Application Support/Telegram Desktop/tdata
```

For the `@nekocata` account, the working source was:

```bash
/Users/nekoneki/Library/Application Support/Telegram Desktop/tdata
```

The AyuGram path existed too, but at the time of setup it only exposed `@ollinyk`, not `@nekocata`.

The already imported working Telethon session was created here:

```bash
/Users/nekoneki/.codex/tmp/telegram-upload/nekocata_tdata_resume.session
```

To reuse it with Docker, put it here:

```bash
mkdir -p tools/telegram-uploader/data
cp /Users/nekoneki/.codex/tmp/telegram-upload/nekocata_tdata_resume.session \
  tools/telegram-uploader/data/telegram-user.session
```

Then verify Docker sees the same account:

```bash
docker compose -f docker-compose.telegram.yml run --rm telegram-uploader dialogs --filter photochi
```

Expected account: `@nekocata`. Expected target channel: `photochi43322` / `фоточки 😼📸`.

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
