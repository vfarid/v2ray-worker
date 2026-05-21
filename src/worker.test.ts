import { Env, Config } from './interfaces';
import { VlessOverWSHandler } from './vless';
import { TrojanOverWSHandler } from './trojan';
import { GetPanel, PostPanel } from './panel';
import { GetLogin, PostLogin } from './auth';
import { GetConfigList } from './collector';
import { ToYamlSubscription } from './clash';
import { ToBase64Subscription, ToRawSubscription } from './sub';
import worker from './worker';

// Mock all the imported functions
jest.mock('./vless', () => ({
  VlessOverWSHandler: jest.fn(() => new Response('VLESS response'))
}));

jest.mock('./trojan', () => ({
  TrojanOverWSHandler: jest.fn(() => new Response('TROJAN response'))
}));

jest.mock('./panel', () => ({
  GetPanel: jest.fn(() => new Response('GET panel response')),
  PostPanel: jest.fn(() => new Response('POST panel response'))
}));

jest.mock('./auth', () => ({
  GetLogin: jest.fn(() => new Response('GET login response')),
  PostLogin: jest.fn(() => new Response('POST login response'))
}));

jest.mock('./collector', () => ({
  GetConfigList: jest.fn(() => Promise.resolve([]))
}));

jest.mock('./clash', () => ({
  ToYamlSubscription: jest.fn(() => 'yaml subscription content')
}));

jest.mock('./sub', () => ({
  ToBase64Subscription: jest.fn(() => 'base64 subscription content'),
  ToRawSubscription: jest.fn(() => 'raw subscription content')
}));

describe('Worker', () => {
  let env: Env;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    env = {
      // Initialize with any required environment variables
    };

    // Save original fetch and mock it to prevent actual network requests
    originalFetch = global.fetch;
    global.fetch = jest.fn(() => Promise.resolve(new Response('Forwarded response'))) as any;

    // Reset all mock implementations before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original fetch after each test
    global.fetch = originalFetch;
  });

  describe('Subscription endpoints', () => {
    test('should handle /sub endpoint with GET method', async () => {
      const request = new Request('https://example.com/sub', { method: 'GET' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('base64 subscription content');
      expect(GetConfigList).toHaveBeenCalled();
      expect(ToBase64Subscription).toHaveBeenCalled();
    });

    test('should handle /clash endpoint with GET method', async () => {
      const request = new Request('https://example.com/clash', { method: 'GET' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('yaml subscription content');
      expect(GetConfigList).toHaveBeenCalled();
      expect(ToYamlSubscription).toHaveBeenCalled();
    });

    test('should handle /raw endpoint with GET method', async () => {
      const request = new Request('https://example.com/raw', { method: 'GET' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('raw subscription content');
      expect(GetConfigList).toHaveBeenCalled();
      expect(ToRawSubscription).toHaveBeenCalled();
    });

    test('should handle case-insensitive subscription endpoints', async () => {
      const request = new Request('https://example.com/SUB', { method: 'GET' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('base64 subscription content');
      expect(GetConfigList).toHaveBeenCalled();
      expect(ToBase64Subscription).toHaveBeenCalled();
    });
  });

  describe('Protocol endpoints', () => {
    test('should handle /vless-ws endpoint', async () => {
      const request = new Request('https://example.com/vless-ws', { method: 'GET' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('VLESS response');
      expect(VlessOverWSHandler).toHaveBeenCalledWith(request, 'example.com', env);
    });

    test('should handle /trojan-ws endpoint', async () => {
      const request = new Request('https://example.com/trojan-ws', { method: 'GET' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('TROJAN response');
      expect(TrojanOverWSHandler).toHaveBeenCalledWith(request, 'example.com', env);
    });
  });

  describe('Login endpoints', () => {
    test('should handle GET /login endpoint', async () => {
      const request = new Request('https://example.com/login', { method: 'GET' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('GET login response');
      expect(GetLogin).toHaveBeenCalledWith(request, env);
    });

    test('should handle POST /login endpoint', async () => {
      const request = new Request('https://example.com/login', { method: 'POST' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('POST login response');
      expect(PostLogin).toHaveBeenCalledWith(request, env);
    });
  });

  describe('Panel endpoints (root path)', () => {
    test('should handle GET request to root path', async () => {
      const request = new Request('https://example.com/', { method: 'GET' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('GET panel response');
      expect(GetPanel).toHaveBeenCalledWith(request, env);
    });

    test('should handle POST request to root path', async () => {
      const request = new Request('https://example.com/', { method: 'POST' });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('POST panel response');
      expect(PostPanel).toHaveBeenCalledWith(request, env);
    });
  });

  describe('Path forwarding', () => {
    test('should forward requests with non-empty path to external URL', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

      const request = new Request('https://example.com/example.com', { method: 'GET' });

      const response = await worker.fetch(request, env);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Forwarded response');
      expect(mockFetch).toHaveBeenCalledWith(
        new Request(new URL("https://example.com"), request)
      );
    });
  });

  describe('Invalid requests', () => {
    test('should forward unmatched paths to external URL via fetch', async () => {
      // The worker forwards unmatched paths to external URLs via fetch
      // Creating a situation where path is not handled by any of the specific conditions
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

      const request = new Request('https://example.com/unknown', { method: 'GET' });

      const response = await worker.fetch(request, env);

      // This should be forwarded to fetch
      expect(mockFetch).toHaveBeenCalledWith(
        new Request(new URL("https://unknown"), request)
      );
    });
  });

  test('should properly handle path normalization - single slashes at start/end are removed', async () => {
    // Test the actual behavior: //sub// becomes /sub/ after removing one leading and one trailing slash
    // /sub/ is not in the "sub", "clash", "raw" list, so it goes to path forwarding
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    const request = new Request('https://example.com//sub//', { method: 'GET' });

    const response = await worker.fetch(request, env);

    // This path will be forwarded since /sub/ doesn't match "sub", "clash", or "raw"
    expect(mockFetch).toHaveBeenCalledWith(
      new Request(new URL("https:///sub/"), request)
    );
  });

  test('should properly sanitize simple paths like /sub/', async () => {
    // Test that /sub/ becomes sub after removing leading and trailing slashes
    const request = new Request('https://example.com/sub/', { method: 'GET' });

    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('base64 subscription content');
    expect(GetConfigList).toHaveBeenCalled();
    expect(ToBase64Subscription).toHaveBeenCalled();
  });

  test('should handle paths with no leading or trailing slashes', async () => {
    // Test that paths like "sub" remain unchanged
    const request = new Request('https://example.com/sub', { method: 'GET' });

    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('base64 subscription content');
    expect(GetConfigList).toHaveBeenCalled();
    expect(ToBase64Subscription).toHaveBeenCalled();
  });
});