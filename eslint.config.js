//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.output/**',
      '**/*.config.js',
      '**/*.config.ts',
      'src/components/ui/**',
    ],
  },
  ...tanstackConfig.map((config) => ({
    ...config,
    files: ['src/**/*.{js,jsx,ts,tsx}'],
  })),
];
