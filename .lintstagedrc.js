const config = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'bun run lint:fix',
    'bun run format',
    'bun run test --bail --findRelatedTests --passWithNoTests',
  ],

  // JSON files
  '*.json': ['bun run format'],

  // Markdown files
  '*.md': ['bun run format'],

  // YAML files
  '*.{yml,yaml}': ['bun run format'],

  // Package.json
  'package.json': ['sort-package-json', 'prettier --write'],

  // Style files
  '*.{css,scss,less}': ['bun run format'],

  // Config files
  '*.config.{js,ts}': ['bun run lint:fix', 'bun run format'],
};

module.exports = config;
