// Mock for cloudflare:sockets module
module.exports = {
  connect: jest.fn(() => ({
    readable: {
      pipeTo: jest.fn(),
    },
    writable: {
      getWriter: () => ({
        write: jest.fn(),
        releaseLock: jest.fn(),
      }),
    },
    startTls: jest.fn(),
  })),
};