import { danger, warn, fail, message } from 'danger';

// ====================
// PR DESCRIPTION
// ====================
const pr = danger.github.pr;
const hasDescription = pr.body && pr.body.length > 10;

if (!hasDescription) {
  fail('Please provide a description for this PR');
}

// ====================
// PR SIZE
// ====================
const bigPRThreshold = 500;
const totalChanges = danger.github.pr.additions + danger.github.pr.deletions;

if (totalChanges > bigPRThreshold) {
  warn(`PR is quite large (${totalChanges} lines changed). Consider breaking it into smaller PRs.`);
}

// ====================
// CHANGELOG
// ====================
const hasChangelog = danger.git.modified_files.includes('CHANGELOG.md');
const isTrivial = pr.title.includes('#trivial');

if (!hasChangelog && !isTrivial) {
  warn('Consider adding a CHANGELOG entry for this change');
}

// ====================
// TESTS
// ====================
const hasAppChanges = danger.git.modified_files.some(path =>
  path.startsWith('src/') && !path.includes('__tests__')
);
const hasTestChanges = danger.git.modified_files.some(path =>
  path.includes('__tests__') || path.includes('.test.')
);

if (hasAppChanges && !hasTestChanges) {
  warn('Consider adding tests for your changes');
}

// ====================
// TYPESCRIPT
// ====================
const hasTypeScriptChanges = danger.git.modified_files.some(path =>
  path.endsWith('.ts') || path.endsWith('.tsx')
);
const modifiedFiles = danger.git.modified_files.concat(danger.git.created_files);

if (hasTypeScriptChanges) {
  const hasAnyTypes = modifiedFiles.some(file => {
    return danger.git.diffForFile(file).then(diff => {
      return diff && diff.diff.includes(': any');
    });
  });

  if (hasAnyTypes) {
    warn('Try to avoid using `any` type. Use specific types instead.');
  }
}

// ====================
// DEPENDENCIES
// ====================
const packageChanged = danger.git.modified_files.includes('package.json');
const lockfileChanged = danger.git.modified_files.includes('bun.lock');

if (packageChanged && !lockfileChanged) {
  warn('package.json changed but bun.lock did not. Did you run `bun install`?');
}

if (lockfileChanged && !packageChanged) {
  warn('bun.lock changed but package.json did not. This might be unintentional.');
}

// ====================
// IOS/ANDROID CHANGES
// ====================
const iosChanged = danger.git.modified_files.some(path => path.startsWith('ios/'));
const androidChanged = danger.git.modified_files.some(path => path.startsWith('android/'));

if (iosChanged) {
  message('📱 iOS changes detected. Make sure to test on iOS device/simulator.');
}

if (androidChanged) {
  message('🤖 Android changes detected. Make sure to test on Android device/emulator.');
}

// ====================
// DOCUMENTATION
// ====================
const touchedFiles = modifiedFiles.length;
const hasDocChanges = modifiedFiles.some(path => path.endsWith('.md'));

if (touchedFiles > 10 && !hasDocChanges) {
  warn('This is a large PR. Consider updating relevant documentation.');
}

// ====================
// SECURITY
// ====================
const hasSecurityKeywords = ['password', 'secret', 'api_key', 'token', 'private_key'].some(keyword =>
  modifiedFiles.some(file => {
    return danger.git.diffForFile(file).then(diff => {
      return diff && diff.diff.toLowerCase().includes(keyword);
    });
  })
);

if (hasSecurityKeywords) {
  warn('⚠️ This PR contains potential security-sensitive keywords. Please ensure no secrets are exposed.');
}

// ====================
// PERFORMANCE
// ====================
const hasPerformanceImpact = modifiedFiles.some(path =>
  path.includes('service') || path.includes('api') || path.includes('Performance')
);

if (hasPerformanceImpact) {
  message('🚀 Changes may impact performance. Consider running performance tests.');
}

// ====================
// SUMMARY
// ====================
message(`
### PR Summary
- **Files changed:** ${modifiedFiles.length}
- **Lines added:** ${danger.github.pr.additions}
- **Lines deleted:** ${danger.github.pr.deletions}
- **Commits:** ${danger.github.commits.length}
`);
