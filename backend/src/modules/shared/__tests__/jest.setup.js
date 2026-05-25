// Jest setup file for test environment configuration
// This file runs before all tests

// Set test environment
process.env.NODE_ENV = 'test';

// Set test database configuration
process.env.DB_TYPE = 'mysql';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_DATABASE = 'cw_backend_test';

// Set JWT secrets for testing
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.JWT_MFA_SECRET = 'test-mfa-secret-key-for-testing-only';
process.env.JWT_PASSWORD_RESET_SECRET = 'test-password-reset-secret-key-for-testing-only';

// Set Redis configuration for testing
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_DB = '1'; // Use database 1 for tests

// Increase timeout for async operations
jest.setTimeout(20000);

// Global test utilities
global.console = {
    ...console,
    // Suppress console logs during tests (optional)
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
