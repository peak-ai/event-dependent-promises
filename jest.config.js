'use strict';

module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: 'src(/.*)?/.*.test.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  globals: {
    'ts-jest': {
      tsConfig: './tsconfig.json',
      diagnostics: false,
    },
  },
};
