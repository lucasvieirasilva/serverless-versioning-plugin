export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['./src/**/*.ts', '!./src/types.ts'],
  coverageReporters: ['text', 'html', 'cobertura', 'clover'],
  coverageThreshold: {
    global: {
      statements: 57,
      branches: 47,
      functions: 56,
      lines: 56
    }
  }
}
