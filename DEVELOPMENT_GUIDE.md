# Kindred Development Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Quality Standards](#code-quality-standards)
4. [Testing Strategy](#testing-strategy)
5. [Build and Deployment](#build-and-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- **Node.js**: Version 18+ (specified in package.json engines)
- **Bun**: Latest version for package management
- **Java**: Version 24 (configured for Android builds)
- **Xcode**: Latest version (for iOS development)
- **Android Studio**: Latest version with SDK 34+

### Initial Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd Kindred
   bun install
   ```

2. **Environment configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

3. **iOS setup**:
   ```bash
   bun run pod:install
   ```

4. **Android setup**:
   ```bash
   bun run android:clean
   ```

### Available Scripts

#### Development
- `bun start` - Start Metro bundler
- `bun run android` - Run on Android
- `bun run ios` - Run on iOS
- `bun run web` - Run on web (if configured)

#### Code Quality
- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint issues
- `bun run format` - Format code with Prettier
- `bun run type-check` - Run TypeScript type checking

#### Testing
- `bun run test` - Run unit tests
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage
- `bun run test:e2e` - Run end-to-end tests

#### Build
- `bun run android:build` - Build Android APK
- `bun run android:build:release` - Build Android release
- `bun run ios:build` - Build iOS app
- `bun run bundle:analyze` - Analyze bundle size

## Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature development branches
- **hotfix/***: Critical bug fixes
- **release/***: Release preparation branches

### Feature Development Process

1. **Create feature branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Development cycle**:
   ```bash
   # Make changes
   bun run lint:fix
   bun run type-check
   bun run test
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Pre-commit hooks** (automatically run):
   - ESLint with auto-fix
   - Prettier formatting
   - Type checking
   - Unit tests for changed files

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   # Create pull request to develop branch
   ```

### Code Review Process

- All code must be reviewed before merging
- Automated checks must pass (CI/CD pipeline)
- Performance impact should be considered
- Documentation should be updated if needed

## Code Quality Standards

### TypeScript Configuration

- **Strict mode enabled**: All TypeScript strict checks are active
- **Path mapping**: Use absolute imports with `@` aliases
- **Type safety**: No `any` types allowed (use `unknown` instead)

### ESLint Rules

- **React/React Native**: Enforced best practices
- **TypeScript**: Strict typing rules
- **Import organization**: Automatic import sorting
- **Code style**: Consistent formatting rules

### Prettier Configuration

- **Consistent formatting**: Automatic code formatting
- **File-specific rules**: Different rules for different file types
- **Integration**: Works with ESLint for seamless experience

### Component Standards

```tsx
// Example component structure
import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ComponentProps } from '@types/components';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
}

const ExampleComponent = memo<Props>(({ title, onPress, variant = 'primary' }) => {
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  return (
    <View style={[styles.container, styles[variant]]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#8E8E93',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ExampleComponent;
```

## Testing Strategy

### Unit Testing

- **Framework**: Jest with React Native Testing Library
- **Coverage**: Minimum 75% coverage required
- **Mocking**: Comprehensive mocks for external dependencies

```tsx
// Example unit test
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ExampleComponent from '../ExampleComponent';

describe('ExampleComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ExampleComponent title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <ExampleComponent title="Test" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
```

### Integration Testing

- **API testing**: Mock API responses
- **Navigation testing**: Test screen transitions
- **State management**: Test Redux actions and reducers

### End-to-End Testing

- **Framework**: Detox for E2E testing
- **Scenarios**: Critical user journeys
- **Devices**: Test on multiple device configurations

```js
// Example E2E test
describe('Login Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
```

## Build and Deployment

### Development Builds

```bash
# Android development build
bun run android:build:debug

# iOS development build
bun run ios:build:debug
```

### Production Builds

```bash
# Android production build
bun run android:build:release

# iOS production build
bun run ios:build:release
```

### Environment Configuration

- **Development**: `.env.development`
- **Staging**: `.env.staging`
- **Production**: `.env.production`

### CI/CD Pipeline

1. **Code quality checks**
2. **Unit and integration tests**
3. **Build verification**
4. **E2E tests**
5. **Security scanning**
6. **Performance testing**

## Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
bun run start:reset

# Clear all caches
bun run clean:all
```

#### Android Build Issues
```bash
# Clean Android build
bun run android:clean

# Reset Android completely
cd android && ./gradlew clean
```

#### iOS Build Issues
```bash
# Clean iOS build
bun run ios:clean

# Reset CocoaPods
bun run pod:clean && bun run pod:install
```

#### Dependency Issues
```bash
# Clean install
rm -rf node_modules bun.lockb
bun install
```

### Performance Issues

- Use the Performance Guide for optimization strategies
- Profile with React DevTools and Flipper
- Monitor memory usage and bundle size

## Best Practices

### Code Organization

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── store/             # State management
├── services/          # API and external services
├── utils/             # Utility functions
├── hooks/             # Custom React hooks
├── constants/         # App constants
├── types/             # TypeScript type definitions
├── config/            # App configuration
└── tests/             # Test utilities and setup
```

### Performance Considerations

- Use `React.memo` for pure components
- Implement proper list virtualization
- Optimize images and assets
- Use native driver for animations
- Implement efficient state management

### Security Best Practices

- Never commit secrets to version control
- Use environment variables for configuration
- Implement proper authentication and authorization
- Validate all user inputs
- Use HTTPS for all network requests

### Accessibility

- Implement proper accessibility labels
- Test with screen readers
- Ensure proper color contrast
- Support dynamic text sizing

---

## Quick Reference

### Essential Commands
```bash
# Start development
bun start
bun run android  # or ios

# Code quality
bun run lint:fix
bun run type-check

# Testing
bun run test
bun run test:e2e

# Build
bun run android:build:release
```

### Important Files
- `.env` - Environment configuration
- `metro.config.js` - Metro bundler configuration
- `babel.config.js` - Babel transformation configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - ESLint rules
- `.prettierrc.js` - Prettier formatting rules

---

*This guide should be updated as the project evolves and new practices are adopted.*