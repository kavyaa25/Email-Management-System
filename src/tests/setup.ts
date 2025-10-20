// Test setup file
import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
process.env.ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'emails_test';

// Mock console methods to reduce noise during testing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress expected error messages during tests
  console.error = (...args: any[]) => {
    if (
      args[0]?.includes?.('Elasticsearch') ||
      args[0]?.includes?.('Connection') ||
      args[0]?.includes?.('Failed to connect')
    ) {
      return; // Suppress these specific errors
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: any[]) => {
    if (
      args[0]?.includes?.('Elasticsearch') ||
      args[0]?.includes?.('not available')
    ) {
      return; // Suppress these specific warnings
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

