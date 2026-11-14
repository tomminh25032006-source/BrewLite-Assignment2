// Integration test chạy qua HTTP thật (supertest) với PostgreSQL thật.
// Chạy từ apps/api: npm run test:integration
const path = require('path');

const apiDir = path.resolve(__dirname, '../../apps/api');

module.exports = {
  rootDir: __dirname,
  testRegex: '.*\.int-spec\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\.ts$': [
      require.resolve('ts-jest', { paths: [apiDir] }),
      { tsconfig: path.join(apiDir, 'tsconfig.json'), diagnostics: false },
    ],
  },
  modulePaths: [path.join(apiDir, 'node_modules')],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/setup-env.js'],
  globalSetup: '<rootDir>/global-setup.js',
  testTimeout: 30000,
};
