---
paths: **/*.{ts,tsx}
---

# TypeScript typing rules (project-wide)

- ALWAYS add explicit types for:
  - function params
  - function return types
  - exported constants/functions
  - object shapes (interfaces/types)
- Avoid `any` (use `unknown`, generics, or proper types instead).
- No implicit `any`. Fix typing at the source rather than casting.
