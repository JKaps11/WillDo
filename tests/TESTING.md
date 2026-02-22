# Testing Guide

## Setup (one-time per device)

```bash
bunx playwright install chromium
```

## Commands

```bash
# Run all tests
bun run test

# Run with UI mode (interactive)
bun run test:ui

# Run specific project
bunx playwright test --project=chromium
bunx playwright test --project=screenshots

# Run specific test file
bunx playwright test tests/specs/skills.spec.ts

# Run tests matching name
bunx playwright test -g "create skill"

# View last test report
bunx playwright show-report
```

## Projects

| Project | Description |
|---------|-------------|
| `setup` | Auth setup (runs first) |
| `chromium` | Main E2E tests |
| `screenshots` | Capture app screenshots |

## Structure

```text
tests/
├── fixtures/       # Custom test fixtures with POMs
├── helpers/        # API helpers for test data
├── pom/            # Page Object Models
├── screenshots/    # Screenshot capture tests
├── specs/          # Main test specs
└── auth.setup.ts   # Clerk auth setup
```

## Writing Tests

- Import `test` and `expect` from `tests/fixtures/base.fixture.ts`
- Use POM fixtures: `sidebar`, `skillsHub`, `skillForm`, `planner`, `todoList`, `dashboard`
- Prefix test data names with `E2E_` for cleanup
