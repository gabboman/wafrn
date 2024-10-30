
  module.exports = {
    "collectCoverage": true,
    "preset": "jest-preset-angular",
    "testEnvironment": "jsdom",
    "roots": [
      "<rootDir>/src"
    ],
    "moduleNameMapper": {
      "@app/(.*)$": "<rootDir>/src/app/$1",
      "@env/(.*)": "<rootDir>/src/environments/$1"
    },
    "setupFilesAfterEnv": [
      "<rootDir>/src/setup-jest.ts"
    ],
    "transformIgnorePatterns": [
      "node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)"
    ],
    "transform": {
      "^.+.(ts|mjs|js|html)$": "jest-preset-angular"
    },
    "testPathIgnorePatterns": [
      "<rootDir>/node_modules/",
      "<rootDir>/dist/",
      "<rootDir>/src/test.ts"
    ],
    "globals": {
      "ts-jest": {
        "isolatedModules": true,
        "useESM": "true",
        "tsconfig": "<rootDir>/tsconfig.spec.json",
        "stringifyContentPathRegex": "\\.html$"
      }
    },
    "moduleFileExtensions": [
      "ts",
      "html",
      "js",
      "json",
      "mjs"
    ],
    "coveragePathIgnorePatterns": [
      "node_modules",
      "test-config",
      "interfaces",
      "jestGlobalMocks.ts",
      "<rootDir>/src/app/main.ts",
      ".mock.ts"
    ],
    "modulePathIgnorePatterns": []
  }
