# Continuity System for Kindred Project

## Purpose

This continuity system ensures seamless handoff between different Claude instances when working on the Kindred React Native project. Each file serves a specific purpose in maintaining project context and progress.

## File Overview

### 📋 `PROJECT_STATUS.md`
**Purpose:** Current project state and high-level overview  
**Contains:**
- Project maturity assessment (Enterprise-level)
- Completed implementations (50+ services, 30+ components)
- Current technical issues and blockers
- Next immediate steps with phases
- Documentation status
- Key insights for future Claude instances

**When to use:** First file to read when starting work on the project

### ✅ `CURRENT_TODOS.json`
**Purpose:** Structured task management with priorities and dependencies  
**Contains:**
- Immediate blockers (CRITICAL priority)
- Short-term tasks (HIGH/MEDIUM priority)
- Medium-term architectural improvements
- Long-term feature development
- Technical debt tracking
- Quick command references

**When to use:** To understand what needs to be done next and task dependencies

### 🔧 `INTEGRATION_ISSUES.md`
**Purpose:** Problem-solving knowledge base  
**Contains:**
- Resolved issues with solutions
- Current pending problems
- Known potential future issues
- Best practices learned
- Troubleshooting quick reference
- Integration testing checklists

**When to use:** When encountering errors or planning integrations

### 🤖 `CLAUDE.md` (Updated)
**Purpose:** Claude-specific guidance and commands  
**Contains:**
- References to continuity files (added at top)
- Essential development commands
- Architecture principles
- Code organization guidelines
- Development workflows

**When to use:** For Claude-specific instructions and development commands

## Quick Start Workflow

### For New Claude Instance:

1. **Read `PROJECT_STATUS.md`** (2 minutes)
   - Understand project sophistication level
   - Identify immediate blockers
   - Get context on completed work

2. **Check `CURRENT_TODOS.json`** (3 minutes)
   - Review `immediateBlockers` section
   - Understand task dependencies
   - Note estimated time requirements

3. **Scan `INTEGRATION_ISSUES.md`** (2 minutes)
   - Check "Current Pending Issues"
   - Review "Troubleshooting Quick Reference"
   - Understand known problems

4. **Reference `CLAUDE.md`** (ongoing)
   - Use for development commands
   - Follow architecture principles
   - Apply code organization guidelines

### For Immediate Action:

```bash
# If dependency issues exist (check CURRENT_TODOS.json):
bun install
bun run prepare
git add .
git commit -m "fix: resolve dependency and hook issues"

# For development:
bun run lint
bun test
bun start
```

## Maintenance Guidelines

### When to Update Files:

- **`PROJECT_STATUS.md`**: After major milestones, architecture changes, or issue resolution
- **`CURRENT_TODOS.json`**: Daily/weekly task updates, priority changes, completion tracking
- **`INTEGRATION_ISSUES.md`**: When new issues are discovered/resolved, after troubleshooting
- **`CLAUDE.md`**: When development workflows or commands change

### Update Frequency:
- **High frequency**: `CURRENT_TODOS.json` (daily)
- **Medium frequency**: `INTEGRATION_ISSUES.md` (weekly)
- **Low frequency**: `PROJECT_STATUS.md`, `CLAUDE.md` (monthly or after major changes)

## File Relationships

```
CLAUDE.md (Entry Point)
    ↓
PROJECT_STATUS.md (Context)
    ↓
CURRENT_TODOS.json (Actions)
    ↓
INTEGRATION_ISSUES.md (Problem Solving)
```

## Key Principles

1. **Always read continuity files before making changes**
2. **Update files when significant progress is made**
3. **Don't recreate existing comprehensive documentation**
4. **Focus on technical improvements, not basic setup**
5. **Respect the sophisticated nature of this codebase**

## Project Context Reminders

- **This is NOT a basic project** - Enterprise-level React Native app
- **50+ sophisticated services** already implemented
- **30+ React components** with advanced features
- **Comprehensive documentation** already exists
- **Modern architecture patterns** (DI, CQRS, Event Sourcing) in place
- **Advanced performance monitoring** implemented
- **Current focus**: Dependency resolution and code quality improvements

---

**Created:** 2024-12-19  
**Purpose:** Seamless Claude instance handoff  
**Scope:** Kindred React Native Project