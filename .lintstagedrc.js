module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],

  // JSON files
  '*.json': ['prettier --write'],

  // Markdown files
  '*.md': ['prettier --write'],

  // YAML files
  '*.{yml,yaml}': ['prettier --write'],

  // Package.json
  'package.json': ['sort-package-json', 'prettier --write'],

  // Style files
  '*.{css,scss,less}': ['prettier --write'],

  // Config files
  '*.config.{js,ts}': ['eslint --fix', 'prettier --write'],
};
