module.exports = {
  // App TypeScript and JavaScript files
  'src/**/*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // Cloud Functions
  'functions/**/*.{ts,js}': ['prettier --write'],

  // Root entry files
  '{App,index}.{ts,tsx,js,jsx}': ['prettier --write'],

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
  '*.config.{js,ts}': ['prettier --write'],
};
