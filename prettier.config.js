// @ts-check

/** @type {import('prettier').Config} */
const config = {
  // ––– SEMI & COMMAS ––– //
  semi: true, // always print trailing semicolons
  trailingComma: 'all', // include commas where valid in ES5 (objects, arrays, functions, etc.)

  // ––– QUOTES & PARENS ––– //
  singleQuote: true, // prefer 'single' over "double"
  jsxSingleQuote: false, // but keep JSX attributes in "
  arrowParens: 'always', // (x) => x instead of x => x

  // ––– SPACING –––//
  bracketSpacing: true, // { foo: bar }
  jsxBracketSameLine: false, // put > on its own line
  htmlWhitespaceSensitivity: 'css', // respect CSS display property

  // ––– WIDTH & INDENTATION ––– //
  printWidth: 80, // wrap at 80 chars
  tabWidth: 2, // 2-space indents
  useTabs: false, // no hard tabs

  // ––– MISC ––– //
  endOfLine: 'lf', // normalize to Unix line-endings
};

export default config;
