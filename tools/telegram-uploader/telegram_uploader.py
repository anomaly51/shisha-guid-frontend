#!/usr/bin/env python3
import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.errors import FloodWaitError, RPCError


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


def env_value(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    return value if value not in (None, "") else default


def require_env(name: str) -> str:
    value = env_value(name)
    if value is None:
        raise SystemExit(f"Missing required env: {name}")
    return value


def find_files(source: Path) -> list[Path]:
    if not source.exists():
        raise SystemExit(f"Source directory does not exist: {source}")
    if not source.is_dir():
        raise SystemExit(f"Source is not a directory: {source}")

    return sorted(
        [
            file
            for file in source.iterdir()
            if file.is_file()
            and file.suffix.lower() in IMAGE_EXTENSIONS
            and file.stat().st_size > 0
        ],
        key=lambda file: file.name.lower(),
    )


def read_file_list(path: Path) -> list[str]:
    if not path.exists():
        raise SystemExit(f"File list does not exist: {path}")
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def read_state(path: Path) -> tuple[set[str], set[str]]:
    if not path.exists():
        return set(), set()
    data = json.loads(path.read_text(encoding="utf-8"))
    return set(data.get("document_sent", [])), set(data.get("photo_sent", []))


def write_state(path: Path, document_sent: set[str], photo_sent: set[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload: dict[str, Any] = {
        "updated_at": int(time.time()),
        "document_sent": sorted(document_sent),
        "photo_sent": sorted(photo_sent),
    }
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def progress_printer(label: str):
    state = {"last_print": 0.0, "last_mb": -1}

    def callback(sent: int, total: int) -> None:
        now = time.time()
        sent_mb = sent // (1024 * 1024)
        total_mb = max(1, total // (1024 * 1024))
        should_print = (
            sent == total
            or sent_mb >= state["last_mb"] + 5
            or now - state["last_print"] >= 10
        )
        if should_print:
            state["last_print"] = now
            state["last_mb"] = sent_mb
            print(f"{label}: uploaded {sent_mb}/{total_mb} MB", flush=True)

    return callback


def build_client(session: Path) -> TelegramClient:
    api_id = int(require_env("TELEGRAM_API_ID"))
    api_hash = require_env("TELEGRAM_API_HASH")
    session.parent.mkdir(parents=True, exist_ok=True)
    return TelegramClient(str(session), api_id, api_hash)


async def resolve_target(client: TelegramClient, target: str):
    try:
        return await client.get_entity(int(target))
    except ValueError:
        pass
    except Exception:
        pass

    try:
        return await client.get_entity(target)
    except Exception:
        pass

    matches = []
    async for dialog in client.iter_dialogs():
        name = dialog.name or ""
        username = getattr(dialog.entity, "username", None) or ""
        if (
            name == target
            or name.casefold() == target.casefold()
            or username == target.lstrip("@")
        ):
            matches.append(dialog.entity)

    if len(matches) != 1:
        raise SystemExit(f"Target {target!r} matched {len(matches)} dialogs")
    return matches[0]


async def start_client(client: TelegramClient) -> None:
    phone = env_value("TELEGRAM_PHONE")
    await client.start(phone=phone)


async def send_one(
    client: TelegramClient,
    entity,
    file: Path,
    *,
    as_document: bool,
    dry_run: bool,
    with_caption: bool,
    max_retries: int,
) -> None:
    mode = "document" if as_document else "photo"
    size_mb = file.stat().st_size / (1024 * 1024)
    caption = f"{file.name}\n{mode}" if with_caption else None
    print(f"{mode}: {file.name} ({size_mb:.1f} MB)", flush=True)
    if dry_run:
        return

    for attempt in range(1, max_retries + 1):
        try:
            await client.send_file(
                entity,
                str(file),
                caption=caption,
                force_document=as_document,
                supports_streaming=False,
                progress_callback=progress_printer(f"{mode} {file.name}"),
            )
            return
        except FloodWaitError as error:
            wait_for = int(error.seconds) + 5
            print(f"FloodWait: sleeping {wait_for}s", flush=True)
            await asyncio.sleep(wait_for)
        except (ConnectionError, OSError) as error:
            if attempt >= max_retries:
                raise
            wait_for = min(60, 5 * attempt)
            print(
                f"Connection error while sending {mode} {file.name}: {error}; "
                f"retrying in {wait_for}s ({attempt}/{max_retries})",
                flush=True,
            )
            await asyncio.sleep(wait_for)
            await client.disconnect()
            await client.connect()
        except RPCError as error:
            print(f"Telegram RPC error while sending {mode} {file.name}: {error}", file=sys.stderr)
            raise


async def login(args: argparse.Namespace) -> None:
    client = build_client(args.session)
    await start_client(client)
    me = await client.get_me()
    print(f"Logged in as @{me.username or me.id}", flush=True)
    await client.disconnect()


async def dialogs(args: argparse.Namespace) -> None:
    client = build_client(args.session)
    await start_client(client)
    needle = (args.filter or "").casefold()
    async for dialog in client.iter_dialogs(limit=args.limit):
        name = dialog.name or ""
        username = getattr(dialog.entity, "username", None) or ""
        if needle and needle not in name.casefold() and needle not in username.casefold():
            continue
        print(
            f"id={dialog.id} entity_id={getattr(dialog.entity, 'id', None)} "
            f"type={type(dialog.entity).__name__} username={username or '-'} title={name}",
            flush=True,
        )
    await client.disconnect()


async def status(args: argparse.Namespace) -> None:
    files = find_files(args.source)
    document_sent, photo_sent = read_state(args.state_file)
    pending = [file for file in files if file.name not in document_sent or file.name not in photo_sent]

    print(f"Source: {args.source}", flush=True)
    print(f"Files: {len(files)}", flush=True)
    print(f"Document sent: {len(document_sent)}/{len(files)}", flush=True)
    print(f"Photo sent: {len(photo_sent)}/{len(files)}", flush=True)
    print(f"Pending any step: {len(pending)}", flush=True)
    if pending:
        print(f"Next: {pending[0].name}", flush=True)


async def send(args: argparse.Namespace) -> None:
    files = find_files(args.source)
    document_sent, photo_sent = read_state(args.state_file)
    pending = [file for file in files if file.name not in document_sent or file.name not in photo_sent]
    if args.limit:
        pending = pending[: args.limit]

    print(f"Found {len(files)} files", flush=True)
    print(f"Document sent: {len(document_sent)}/{len(files)}", flush=True)
    print(f"Photo sent: {len(photo_sent)}/{len(files)}", flush=True)
    print(f"Pending any step: {len(pending)}", flush=True)
    if not pending:
        return

    client = build_client(args.session)
    await start_client(client)
    me = await client.get_me()
    print(f"Logged in as @{me.username or me.id}", flush=True)
    entity = await resolve_target(client, args.target)
    print(
        f"Target: {getattr(entity, 'title', None) or getattr(entity, 'username', None)}",
        flush=True,
    )

    try:
        for file in pending:
            if file.name not in document_sent:
                await send_one(
                    client,
                    entity,
                    file,
                    as_document=True,
                    dry_run=args.dry_run,
                    with_caption=args.with_caption,
                    max_retries=args.max_retries,
                )
                if not args.dry_run:
                    document_sent.add(file.name)
                    write_state(args.state_file, document_sent, photo_sent)
                    print(f"Document sent: {len(document_sent)}/{len(files)}", flush=True)
                if args.sleep:
                    await asyncio.sleep(args.sleep)

            if file.name not in photo_sent:
                await send_one(
                    client,
                    entity,
                    file,
                    as_document=False,
                    dry_run=args.dry_run,
                    with_caption=args.with_caption,
                    max_retries=args.max_retries,
                )
                if not args.dry_run:
                    photo_sent.add(file.name)
                    write_state(args.state_file, document_sent, photo_sent)
                    print(f"Photo sent: {len(photo_sent)}/{len(files)}", flush=True)
                if args.sleep:
                    await asyncio.sleep(args.sleep)
    finally:
        await client.disconnect()


async def send_list(args: argparse.Namespace) -> None:
    names = read_file_list(args.file_list)
    document_sent, photo_sent = read_state(args.state_file)
    pending = [name for name in names if name not in document_sent or name not in photo_sent]
    if args.limit:
        pending = pending[: args.limit]

    print(f"Listed files: {len(names)}", flush=True)
    print(f"Document sent: {len(document_sent)}/{len(names)}", flush=True)
    print(f"Photo sent: {len(photo_sent)}/{len(names)}", flush=True)
    print(f"Pending any step: {len(pending)}", flush=True)
    if not pending:
        return

    client = build_client(args.session)
    await start_client(client)
    me = await client.get_me()
    print(f"Logged in as @{me.username or me.id}", flush=True)
    entity = await resolve_target(client, args.target)
    print(
        f"Target: {getattr(entity, 'title', None) or getattr(entity, 'username', None)}",
        flush=True,
    )

    try:
        for name in pending:
            file = args.input_dir / name
            if not file.exists():
                raise SystemExit(f"Missing mounted input file: {file}")

            if name not in document_sent:
                await send_one(
                    client,
                    entity,
                    file,
                    as_document=True,
                    dry_run=args.dry_run,
                    with_caption=args.with_caption,
                    max_retries=args.max_retries,
                )
                if not args.dry_run:
                    document_sent.add(name)
                    write_state(args.state_file, document_sent, photo_sent)
                    print(f"Document sent: {len(document_sent)}/{len(names)}", flush=True)
                if args.sleep:
                    await asyncio.sleep(args.sleep)

            if name not in photo_sent:
                await send_one(
                    client,
                    entity,
                    file,
                    as_document=False,
                    dry_run=args.dry_run,
                    with_caption=args.with_caption,
                    max_retries=args.max_retries,
                )
                if not args.dry_run:
                    photo_sent.add(name)
                    write_state(args.state_file, document_sent, photo_sent)
                    print(f"Photo sent: {len(photo_sent)}/{len(names)}", flush=True)
                if args.sleep:
                    await asyncio.sleep(args.sleep)
    finally:
        await client.disconnect()


def add_common_io_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--session",
        type=Path,
        default=Path(env_value("TELEGRAM_SESSION", "/data/telegram-user")),
    )


def add_send_state_args(parser: argparse.ArgumentParser) -> None:
    add_common_io_args(parser)
    parser.add_argument(
        "--source",
        type=Path,
        default=Path(env_value("TELEGRAM_SOURCE", "/photos")),
    )
    parser.add_argument("--target", default=env_value("TELEGRAM_TARGET", "photochi43322"))
    parser.add_argument(
        "--state-file",
        type=Path,
        default=Path(env_value("TELEGRAM_STATE", "/data/photochi43322.state.json")),
    )


async def async_main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser(description="Strict Telegram photo/document pair uploader.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    login_parser = subparsers.add_parser("login", help="Create or verify a user session")
    add_common_io_args(login_parser)
    login_parser.set_defaults(func=login)

    dialogs_parser = subparsers.add_parser("dialogs", help="List visible dialogs")
    add_common_io_args(dialogs_parser)
    dialogs_parser.add_argument("--filter")
    dialogs_parser.add_argument("--limit", type=int, default=200)
    dialogs_parser.set_defaults(func=dialogs)

    status_parser = subparsers.add_parser("status", help="Show local send progress")
    add_send_state_args(status_parser)
    status_parser.set_defaults(func=status)

    send_parser = subparsers.add_parser("send", help="Send pending files")
    add_send_state_args(send_parser)
    send_parser.add_argument("--sleep", type=float, default=float(env_value("TELEGRAM_SLEEP", "0.5")))
    send_parser.add_argument("--with-caption", action="store_true")
    send_parser.add_argument("--dry-run", action="store_true")
    send_parser.add_argument("--limit", type=int)
    send_parser.add_argument("--max-retries", type=int, default=5)
    send_parser.set_defaults(func=send)

    send_list_parser = subparsers.add_parser("send-list", help="Send files from a mounted single-file input directory")
    add_common_io_args(send_list_parser)
    send_list_parser.add_argument("--target", default=env_value("TELEGRAM_TARGET", "photochi43322"))
    send_list_parser.add_argument(
        "--state-file",
        type=Path,
        default=Path(env_value("TELEGRAM_STATE", "/data/photochi43322.state.json")),
    )
    send_list_parser.add_argument("--file-list", type=Path, default=Path("/data/file-list.txt"))
    send_list_parser.add_argument("--input-dir", type=Path, default=Path("/input"))
    send_list_parser.add_argument("--sleep", type=float, default=float(env_value("TELEGRAM_SLEEP", "0.5")))
    send_list_parser.add_argument("--with-caption", action="store_true")
    send_list_parser.add_argument("--dry-run", action="store_true")
    send_list_parser.add_argument("--limit", type=int)
    send_list_parser.add_argument("--max-retries", type=int, default=5)
    send_list_parser.set_defaults(func=send_list)

    args = parser.parse_args()
    await args.func(args)


def main() -> None:
    try:
        asyncio.run(async_main())
    except KeyboardInterrupt:
        print("Interrupted", file=sys.stderr)
        raise SystemExit(130)


if __name__ == "__main__":
    main()
