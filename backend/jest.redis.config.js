// Provas que precisam de Redis real (contador de rate limit compartilhado entre instâncias).
// Uso: RATE_LIMIT_TEST_REDIS_URL=redis://... npx jest -c jest.redis.config.js
const base = require('./jest.config.js');

module.exports = {
  ...base,
  testMatch: ['**/*.redis.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'setup.ts'],
  maxWorkers: 1,
  testTimeout: 30000,
};
