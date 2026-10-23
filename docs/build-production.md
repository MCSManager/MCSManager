# Production Build and Deployment

This document has been consolidated into an **in-repo Agent Skill** (it travels with the repository and is shared by all AI tools that support the standard). The **single source of truth** is:

→ [`.agents/skills/mcsmanager-build/SKILL.md`](../.agents/skills/mcsmanager-build/SKILL.md)

It covers: a walkthrough of the `build.bat` / `build.sh` pipeline (`BUNDLE=1`), artifact layout, `daemon/lib` external binaries, build/deploy/run commands, paired data migration, the sensitive-file list, the post-deploy verification checklist, and the FAQ.

The Docker recipes consume the same self-contained bundles and do not install a second runtime dependency tree. To check a built image, mount `scripts/` read-only at `/checks` in a disposable container and run `node /checks/check-docker-bundle.cjs` from the image's default working directory. Use `--network none`, do not publish ports or mount a Docker socket, and do not attach production data. The check requires `node_modules` to be absent, waits for HTTP 200 from the real application, and terminates the test child process. This startup check complements the unit and backend integration suites; it does not replace them.

When you say keywords such as "Build / Compile / Package / Deploy to Production / Build", AI tools that support Agent Skills (including opencode, Claude Code, etc.) will automatically invoke the `mcsmanager-build` skill; you can also read the file above directly. opencode auto-discovers `.agents/skills/` along the project (no extra configuration needed).
