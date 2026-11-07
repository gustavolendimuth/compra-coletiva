// Provas que precisam de Postgres real (rollback, índice único, intercalação).
// Uso: TEST_DATABASE_URL=postgresql://... npx jest -c jest.pg.config.js
const base = require('./jest.config.js');

module.exports = {
  ...base,
  testMatch: ['**/*.pg.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'setup.ts'],
  maxWorkers: 1,
  testTimeout: 30000,
};
