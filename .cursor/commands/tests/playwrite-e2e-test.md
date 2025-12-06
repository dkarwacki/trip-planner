# E2E Test Generation Command

Generate Playwright E2E tests following project conventions.

## Quick Reference

See @.cursor/rules/playwright-e2e.mdc for complete guidelines.

## Key Rules

- **Use Page Object Model** - extend `BasePage`, define locators in constructor
- **Use `getByTestId()` ONLY** - never CSS selectors or XPath
- **Add `data-testid` to components** - kebab-case naming
- **Group by viewport** - separate `test.describe` for desktop/mobile
- **Auth is automatic** - setup project handles login

## File Locations

- Tests: `e2e/*.spec.ts`
- Page Objects: `e2e/pages/{Name}Page.ts`
- Export from: `e2e/pages/index.ts`
