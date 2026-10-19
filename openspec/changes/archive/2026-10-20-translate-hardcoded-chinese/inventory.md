# Chinese literal inventory

The runtime scan used for this change was:

```powershell
rg -n --glob '*.ts' --glob '*.vue' --glob '*.tsx' --glob '*.jsx' `
  --glob '!**/node_modules/**' --glob '!**/__test__/**' --glob '!**/test/**' `
  --glob '!**/tests/**' --glob '!languages/**' --glob '!openspec/**' `
  '[\u4e00-\u9fff]' common/src daemon/src panel/src frontend/src scripts
```

Classification of the remaining matches:

- `daemon/src/const/index_html.ts` and `daemon/src/const/index.html`: the standalone daemon landing page owns its browser-side locale map (`zh-CN`, `en-US`, `ru-RU`, `fr-FR`); these are intentional locale resources, not strings passed through the Node i18n accessor.
- `frontend/src/lang/i18n.ts` and `frontend/src/hooks/useMarketPackages.ts`: language names and locale metadata are intentionally displayed in their native names.
- `common/src/mcping.ts`, `daemon/src/service/system_file.ts`, and frontend Vue/TS comments: comments or disabled diagnostic code, not runtime user-facing text.
- `common/test/**` and other test/fixture files: protocol payloads and test data, retained unchanged.

The only non-intentional runtime Chinese diagnostic literal found in the scan was the frontend form-validation console message; it is converted to English in the source.
