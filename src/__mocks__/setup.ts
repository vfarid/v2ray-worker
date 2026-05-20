// Setup file for Jest tests
// This file will be run before all tests to set up the environment

// Mock the Cloudflare Workers runtime environment
// Since Jest runs in Node.js, we need to mock the Cloudflare-specific modules

// Create a mock for cloudflare:sockets
const mockConnect = jest.fn();
Object.defineProperty(global, 'connect', {
  value: mockConnect,
  writable: true,
  configurable: true,
});

// Create basic mocks for Cloudflare Workers features that might be needed
global.WorkerGlobalScope = class WorkerGlobalScope {};
global.Socket = class Socket {
  static readable: any;
  static writable: any;
  static startTls: any;
};

// Define Cloudflare-specific types that might be referenced
global.SocketAddress = class SocketAddress {};
global.SocketOptions = class SocketOptions {};

// Mock crypto APIs if needed
global.crypto = {
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
};

export {};