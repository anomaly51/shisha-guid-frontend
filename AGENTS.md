# Codex Project Instructions

## RTK Command Compression

This project is configured to work well with RTK (Rust Token Killer), a CLI proxy
that compresses noisy command output before it reaches the model context.

When `rtk` is available in `PATH`, prefer RTK-wrapped shell commands for
inspection, git, build, lint, and test workflows:

- `rtk ls .` instead of `ls -la`
- `rtk read <file>` instead of large `cat` output
- `rtk grep <pattern> .` or `rtk rg <pattern>` for search output
- `rtk git status`, `rtk git diff`, `rtk git log -n 10`
- `rtk npm test`, `rtk npm run build`, or `rtk test npm test`
- `rtk tsc` for TypeScript diagnostics

If `rtk` is not installed, use the normal command directly. Do not block work
just because RTK is unavailable.

See [RTK.md](RTK.md) for the local usage policy and install commands.

