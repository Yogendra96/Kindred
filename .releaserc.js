module.exports = {
  branches: ['main', { name: 'beta', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'app.json'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
  ],
  preset: 'angular',
  releaseRules: [
    { type: 'feat', release: 'minor' },
    { type: 'fix', release: 'patch' },
    { type: 'perf', release: 'patch' },
    { type: 'revert', release: 'patch' },
    { type: 'docs', release: false },
    { type: 'style', release: false },
    { type: 'chore', release: false },
    { type: 'refactor', release: 'patch' },
    { type: 'test', release: false },
    { scope: 'deps', release: 'patch' },
    { scope: 'config', release: 'patch' },
  ],
  // Add new options
  tagFormat: 'v${version}',
  successComment:
    '🎉 This ${issue.pull_request ? "PR is included" : "issue has been resolved"} in version ${nextRelease.version} :tada:',
  failComment:
    '🚨 The ${issue.pull_request ? "PR" : "issue"} could not be released :rotating_light:',
};
