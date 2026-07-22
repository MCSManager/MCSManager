---
description: Core project rules for all AI assistants (Claude, Cursor, etc.)
---

## 1. Project Overview

- **Structure**
  - **Web backend**: `panel/*.*`
  - **Daemon / node worker**: `daemon/*.*`
  - **Web frontend**: `frontend/*.*`
- **Responsibilities**
  - **Daemon**: instance processes, containers, files, terminal management.
  - **Web backend**: user management, node connections, auth, API.
  - **Web frontend**: UI, talks to backend; some features talk directly to daemon to reduce load.

## 2. General Coding Rules

- **Minimal changes**: Prefer small, focused edits. Before adding new logic, check existing `hooks`, `services`, `stores`, `utils` in the relevant subproject and reuse when possible.
- **Language for code & comments**: All **code and comments must be written in English**.
- **User-facing text & i18n**
  - Do **not** hardcode user-facing strings (UI labels, messages, errors, etc.).
  - Always use the project i18n flow (backend logs are the only common exception).
- **Design quality**
  - Aim for **high cohesion, low coupling, reusable** code.

## 3. i18n Conventions

- **Frontend (Vue)**: use `t()` from `@/lang/i18n` for all translatable text.
- **Backend / Daemon**: use `$t()` (e.g. from `daemon/src/i18n/index.ts`) for all user-facing text and error messages.
- **Source language**: Add/keep source strings as short, correct English in `languages/en_us.json`. Other locales (e.g. `zh_CN`, `zh_TW`) are translations.

### 3.1 Parameterized Strings

- Keys for dynamic / parameterized messages use the `TXT_CODE_*` prefix.
- **Different placeholder syntax**:
  - **Frontend**: one pair of braces: `{name}`.
  - **Backend / Daemon**: double braces: `{{uuid}}`, `{{err}}`, etc.

Example definition:

```json
{
  "TXT_CODE_FILE_ERROR": "File {name} error!",
  "TXT_CODE_INSTANCE_ERROR": "Exception instance {{uuid}}: {{err}}"
}
```

Example usage (frontend):

```vue
<template>{{ t("TXT_CODE_FILE_ERROR", { name: props.fileName }) }}</template>
```

Example usage (backend / daemon):

```ts
const errorMsgWithParams = $t("TXT_CODE_INSTANCE_ERROR", {
  uuid: instance.instanceUuid,
  err: err
});
```

## 4. Backend (Daemon & Panel) Conventions

- **Scope**
  - Applies to backend code in `daemon/src/**/*.ts` and `panel/src/app/**/*.ts`.

### 4.1 Directory / Layering

- Folder names under `daemon/src/*` and `panel/src/app/*` express layers:
  - routes, middleware, services, instances, etc.
- When adding backend logic, place it in the appropriate layer and keep responsibilities clear.

### 4.2 Logging & Exceptions

- Use the project **logger** (not raw `console.*`).
  - Use severity (`info`, `error`, etc.) according to context.
- For external resources (files, network, containers, shell):
  - Validate inputs and boundaries before acting.
  - On failure, log relevant context and then either:
    - Rethrow, or
    - Return a clear, typed result that the caller can handle.
  - Do **not** silently swallow exceptions.

### 4.3 Security

- For containers and command execution:
  - Strictly parse and validate configuration (length, format, allowed values).
  - Never pass unvalidated input into shell command arguments or container config fields.
- When reading files or running commands with arguments from the frontend:
  - Validate paths, IDs, and other inputs for security risks.

### 4.4 Memory & Resource Management

- When introducing new long-lived structures (e.g. `Map`, queues, buffers, arrays, streams):
  - Ensure there is corresponding cleanup / release logic.
  - Avoid unbounded growth (e.g. clear maps, trim logs, close streams).

## 5. Frontend (Vue 3) Conventions

- **Scope**
  - Applies to Vue components under `frontend/src/**/*.vue`.

### 5.1 Components & Scripts

- Use **Vue 3** with `<script setup lang="ts">`.
- Prefer `const` and explicit TypeScript types to clarify intent.
- Keep component logic small and focused:
  - Extract complex logic into dedicated **hooks** (composables) grouped by responsibility for reuse.

### 5.2 Templates & Structure

- Keep templates as simple and readable as possible.
- If the template becomes large or complex:
  - Extract parts into smaller reusable components.

### 5.3 Data Flow

- Follow Vue’s recommended one-way data flow:
  - Pass data via **props**.
  - Emit events upward instead of mutating parent state directly.

## 6. How AI Assistants Should Behave in This Repo

- Respect all rules above when proposing or editing code.
- Use the appropriate i18n helper instead of hardcoding user-visible text.
- Prefer minimal, focused diffs and reuse existing utilities / services when possible.
- Keep code and comments in English even if conversation language is different.

