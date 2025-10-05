# Git Hooks Documentation

This directory contains Git hooks configured via Husky to maintain code quality and enforce best practices.

## Available Hooks

### 1. **pre-commit**
Runs before each commit. Executes `lint-staged` which:
- ✅ Lints and auto-fixes TypeScript/JavaScript files with ESLint
- ✅ Formats code with Prettier
- ✅ Runs Jest tests for modified files
- ✅ Sorts package.json

**To bypass:** `git commit --no-verify` (use sparingly!)

### 2. **prepare-commit-msg**
Runs before commit message editor opens. Automatically:
- ✅ Validates branch name format
- ✅ Prepends branch name to commit message

**Branch naming convention:**
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release branches
- `chore/*` - Maintenance tasks
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions/updates
- `perf/*` - Performance improvements
- `ci/*` - CI/CD changes

### 3. **commit-msg**
Validates commit message format using Commitlint. Enforces:
- ✅ Conventional Commits format: `type(scope): subject`
- ✅ Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- ✅ Maximum header length: 100 characters
- ✅ Scope is required (android, ios, mobile, web, api, auth, carbon, ui, analytics, deps, release)

**Example valid commits:**
```
feat(carbon): add carbon calculation API
fix(auth): resolve login timeout issue
docs(api): update API documentation
```

### 4. **pre-push**
Runs before pushing to remote. Executes comprehensive checks:
- ✅ TypeScript type checking (`bun run typecheck`)
- ✅ Full test suite (`bun run test:ci`)
- ✅ Bundle size validation (`bun run bundle:check`)
- ✅ License compliance check (`bun run license:check`)

**To bypass:** `git push --no-verify` (⚠️ **NOT RECOMMENDED** for main branches!)

## Testing Hooks

Test all hooks without committing:
```bash
bun run hooks:test
```

## Disabling Hooks Temporarily

### For a single commit:
```bash
git commit --no-verify -m "your message"
```

### For a single push:
```bash
git push --no-verify
```

### Disable all hooks:
```bash
husky uninstall
```

### Re-enable hooks:
```bash
husky install
```

## Troubleshooting

### Hook fails but you believe it's a false positive:
1. Check the error message carefully
2. Run the failing command manually to debug
3. Fix the issue or update the hook configuration
4. If truly necessary, bypass with `--no-verify`

### Hook not executing:
1. Ensure hooks are executable: `chmod +x .husky/*`
2. Reinstall hooks: `bun run prepare`
3. Check Git hooks path: `git config core.hooksPath`

### Performance issues:
- `lint-staged` only runs on staged files (fast)
- `pre-push` runs full suite (slower, but necessary)
- Consider using `git commit --no-verify` for WIP commits, then run full validation before push

## Best Practices

1. **Commit often** - Small, focused commits pass hooks faster
2. **Fix issues immediately** - Don't bypass hooks unless absolutely necessary
3. **Keep tests fast** - Slow tests slow down commits
4. **Use meaningful commit messages** - Helps with automated changelog generation
5. **Follow branch naming** - Enables automatic tooling and organization

## Configuration Files

- `.lintstagedrc.js` - Lint-staged configuration
- `commitlint.config.js` - Commitlint rules
- `.validate-branch-namerc.json` - Branch name validation
- `.bundlesizerc.json` - Bundle size limits
- `dangerfile.js` - PR automation rules

## CI/CD Integration

These hooks are also enforced in CI/CD pipelines:
- GitHub Actions runs same checks on PRs
- Danger bot provides automated PR reviews
- Bundle size tracked across branches

## Support

For issues or questions about git hooks:
1. Check this README
2. Review hook configuration files
3. Consult team lead or create an issue
