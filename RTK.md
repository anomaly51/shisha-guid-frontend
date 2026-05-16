# RTK Usage

RTK reduces token-heavy terminal output by wrapping common development commands.
Use it opportunistically in this repository when it is installed.

## Install

Recommended install methods:

```sh
brew install rtk
```

or:

```sh
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
```

For Codex setup:

```sh
rtk init -g --codex
```

Restart Codex after running the init command.

## Command Policy

Prefer these RTK forms for noisy commands:

```sh
rtk git status
rtk git diff
rtk git log -n 10
rtk ls .
rtk read src/app/App.tsx
rtk grep "pattern" src
rtk npm run build
rtk tsc
```

For failed commands, RTK may save full output under its tee directory and print
the path. Read that log only when the compact output is not enough to diagnose
the issue.

## Fallback

If `command -v rtk` returns nothing, run the original command normally. The
project must remain usable without RTK installed.

## Privacy

RTK telemetry is disabled by default and should remain opt-in. Do not enable
telemetry for another user without their explicit consent.

