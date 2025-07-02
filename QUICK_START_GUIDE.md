# 🚀 Kindred Quick Start Guide

## New Developer / Claude Session Onboarding

### 📋 Essential Reading Order (5-10 minutes)
1. **`CLAUDE.md`** - Claude-specific instructions and commands
2. **`PROJECT_STATUS.md`** - Current project state and recent work
3. **`CURRENT_TODOS.json`** - Active task list with priorities
4. **This file** - Quick start and immediate context

### 🎯 Project Context (30 seconds)
- **What**: React Native carbon footprint tracking app
- **Architecture**: Service-Oriented with 80+ sophisticated services
- **Current Phase**: Phase 1 complete (Production foundation), Phase 2 pending (State-of-the-art innovations)
- **Package Manager**: Bun (required)
- **Key Technologies**: TypeScript, Redux Toolkit, Firebase, TensorFlow.js

### ⚡ Immediate Setup Commands
```bash
# Essential setup (run these first)
bun install
bun run prepare
bun run validate:quick  # lint + typecheck

# Development
bun start               # Metro bundler
bun ios                # iOS simulator  
bun android            # Android emulator

# Quality checks
bun run lint           # ESLint
bun run typecheck      # TypeScript
bun test              # Run tests
```

### 🏗️ Recent Major Work (Phase 1.8-1.9)
**Just completed following KISS/modular principles:**

1. **📦 Advanced Bundle Optimizer** - 3 modules, bundle analysis & optimization
2. **🧠 Enhanced Memory Manager** - 3 modules, real-time monitoring & cleanup  
3. **🌐 Network Performance Optimizer** - 2 modules, intelligent caching & retry
4. **🌍 Climate Modeling Engine** - 3 modules, global climate predictions with NASA/NOAA APIs

### 📂 Key Service Locations
```
src/services/
├── AdvancedBundleOptimizer.ts           # Bundle analysis
├── EnhancedMemoryManager.ts             # Memory management
├── NetworkPerformanceOptimizer.ts       # Network optimization
├── ClimateModelingEngine.ts             # Climate predictions
├── QuantumNeuralComputingEngine.ts      # Quantum computing
├── CarbonTwinEngine.ts                  # Digital lifestyle modeling
├── ComputerVisionCarbonEngine.ts        # CV carbon tracking
└── [60+ other services...]
```

### 🎯 Modular Development Pattern (CRITICAL)
**Follow this pattern for ALL new development:**

1. **Types file** (50-100 lines): `ServiceName.types.ts`
2. **Core logic** (200-300 lines): `ServiceName.core.ts`  
3. **Integration layer** (100-200 lines): `ServiceName.ts`
4. **Tests**: `ServiceName.test.ts`

**Why?** Prevents token overflow, maintains testability, enables modularity.

### 🚨 Common Issues & Solutions
- **Bun install fails**: Remove problematic packages, check `package.json`
- **Pod install fails**: React Native version compatibility issues  
- **TypeScript errors**: Check `examples/` directory for syntax issues
- **Memory issues**: Use `enhancedMemoryManager.performMemoryCleanup()`

### 📊 Project Health Check
```bash
# Quick health check
bun run validate        # Full validation (lint + typecheck + tests)
bun run test:coverage   # Test coverage report
bun run bundle:analyze  # Bundle size analysis
git status             # Check for uncommitted changes
```

### 🔄 Session Handoff Protocol
When starting a new session:
1. Run `TodoRead` to see current tasks
2. Check `git status` for pending changes
3. Review `PROJECT_STATUS.md` for context
4. Check `INTEGRATION_ISSUES.md` for known problems

### 🎯 Phase 2.0 Ready Tasks (Medium Priority)
- 🧠 AI Consciousness simulation
- 🌐 Metaverse carbon ecosystem  
- ⚡ Quantum-resistant cryptography
- 🔮 Predictive global climate modeling
- 🎯 Neurofeedback emotional optimization

### 📞 Need Help?
- Check `TROUBLESHOOTING.md` for solutions
- Review `INTEGRATION_ISSUES.md` for known problems
- Use `bun run doctor` for React Native environment check

---
**Remember**: This is a production-ready, enterprise-grade application. Follow modular patterns, maintain quality standards, and use the comprehensive tooling we've built!