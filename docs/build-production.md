# Production Build and Deployment

This document has been consolidated into an **in-repo Agent Skill** (it travels with the repository and is shared by all AI tools that support the standard). The **single source of truth** is:

→ [`.agents/skills/mcsmanager-build/SKILL.md`](../.agents/skills/mcsmanager-build/SKILL.md)

It covers: a walkthrough of the `build.bat` / `build.sh` pipeline (`BUNDLE=1`), artifact layout, `daemon/lib` external binaries, build/deploy/run commands, paired data migration, the sensitive-file list, the post-deploy verification checklist, and the FAQ.

When you say keywords such as "Build / Compile / Package / Deploy to Production / Build", AI tools that support Agent Skills (including opencode, Claude Code, etc.) will automatically invoke the `mcsmanager-build` skill; you can also read the file above directly. opencode auto-discovers `.agents/skills/` along the project (no extra configuration needed).
