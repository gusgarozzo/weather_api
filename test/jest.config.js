module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  
  testRegex: '.*\\.spec\\.ts$', 
  
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/main.ts',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.enum.ts',
    '!**/*spec.ts', 
  ],
  coverageDirectory: '../coverage',
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};