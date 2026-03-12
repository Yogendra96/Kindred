module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,

  // JSX formatting
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Object and array formatting
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow function formatting
  arrowParens: 'avoid',

  // Line endings
  endOfLine: 'lf',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // HTML formatting
  htmlWhitespaceSensitivity: 'css',

  // Prose formatting
  proseWrap: 'preserve',

  // Range formatting
  rangeStart: 0,
  rangeEnd: Infinity,

  // Parser options
  requirePragma: false,
  insertPragma: false,

  // Vue formatting
  vueIndentScriptAndStyle: false,

  // Plugin overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
        printWidth: 100,
        tabWidth: 2,
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'avoid',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel',
        printWidth: 100,
        tabWidth: 2,
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'avoid',
      },
    },
  ],
};
