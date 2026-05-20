// Mock modules before importing anything else
import { jest } from '@jest/globals';

// Mock external dependencies before importing the helpers module
jest.mock('crypto-js/sha224', () => ({
  default: jest.fn().mockImplementation((input) => ({
    toString: jest.fn().mockReturnValue(`mocked_sha224_${input.toLowerCase()}`)
  }))
}));

jest.mock('crypto-js/enc-hex', () => ({
  default: 'mocked_enc_hex_value'
}));

jest.mock('uuid', () => ({
  v5: jest.fn((name, namespace) => `mocked-uuid-${name.toLowerCase()}`)
}));

// Mock variables module
jest.mock('./variables', () => ({
  providersUri: 'https://mock.example.com/providers',
  proxiesUri: 'https://mock.example.com/proxies',
}));

// Mock fetch globally
global.fetch = jest.fn();

// Import after all mocks are set up
import {
  GetMultipleRandomElements,
  IsIp,
  IsValidUUID,
  GetVlessConfig,
  GetTrojanConfig,
  IsBase64,
  RemoveDuplicateConfigs,
  AddNumberToConfigs,
  GenerateToken,
  Delay,
  MuddleDomain,
  getDefaultProviders,
  getDefaultProxies,
  getProxies,
  getUUID,
  getSHA224Password
} from './helpers';

import { Config } from './interfaces';

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Set up default fetch mock
  (global.fetch as jest.Mock).mockResolvedValue({
    text: () => Promise.resolve('')
  });
});

describe('GetMultipleRandomElements', () => {
  test('should return specified number of random elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = GetMultipleRandomElements(arr, 3);

    expect(result).toHaveLength(3);
    expect(result.every(item => arr.includes(item))).toBe(true);
  });

  test('should handle empty array', () => {
    const arr: number[] = [];
    const result = GetMultipleRandomElements(arr, 3);

    expect(result).toEqual([]);
  });

  test('should handle num greater than array length', () => {
    const arr = [1, 2, 3];
    const result = GetMultipleRandomElements(arr, 5);

    expect(result).toEqual(arr); // Returns all elements
  });
});

describe('IsIp', () => {
  test('should return true for valid IP addresses', () => {
    expect(IsIp('192.168.1.1')).toBe(true);
    expect(IsIp('10.0.0.1')).toBe(true);
    expect(IsIp('172.16.0.1')).toBe(true);
  });

  test('should return false for invalid IP addresses', () => {
    expect(IsIp('256.1.1.1')).toBe(false);
    expect(IsIp('192.168.1')).toBe(false);
    expect(IsIp('')).toBe(false);
    expect(IsIp(undefined as any)).toBe(false);
  });

  test('should return false for IPs ending with 0 or 255', () => {
    expect(IsIp('192.168.1.0')).toBe(false);
    expect(IsIp('192.168.1.255')).toBe(false);
  });
});

describe('IsValidUUID', () => {
  test('should return true for valid UUIDs', () => {
    expect(IsValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    expect(IsValidUUID('F47AC10B-58CC-4372-A567-0E02B2C3D479')).toBe(true);
  });

  test('should return false for invalid UUIDs', () => {
    expect(IsValidUUID('invalid-uuid')).toBe(false);
    expect(IsValidUUID('')).toBe(false);
  });
});

describe('GetVlessConfig', () => {
  test('should create correct vless config', () => {
    const config = GetVlessConfig(1, 'some-uuid', 'example.com', 'proxy.example.com', 443);

    expect(config).toEqual({
      remarks: '1-vless-worker-proxy.example.com',
      configType: 'vless',
      security: 'tls',
      tls: 'tls',
      network: 'ws',
      port: 443,
      sni: 'example.com',
      uuid: 'some-uuid',
      host: 'example.com',
      path: 'vless-ws/?ed=2048',
      address: 'proxy.example.com',
    });
  });

  test('should use sni as address when they match ignoring case', () => {
    const config = GetVlessConfig(1, 'some-uuid', 'EXAMPLE.com', 'example.com', 443);

    expect(config.address).toBe('EXAMPLE.com');
  });
});

describe('GetTrojanConfig', () => {
  test('should create correct trojan config', () => {
    const config = GetTrojanConfig(1, 'sha224-password', 'example.com', 'proxy.example.com', 443);

    expect(config).toEqual({
      remarks: '1-trojan-worker-proxy.example.com',
      configType: 'trojan',
      security: 'tls',
      tls: 'tls',
      network: 'ws',
      port: 443,
      sni: 'example.com',
      password: 'sha224-password',
      host: 'example.com',
      path: 'trojan-ws/?ed=2048',
      address: 'proxy.example.com',
    });
  });

  test('should use sni as address when they match ignoring case', () => {
    const config = GetTrojanConfig(1, 'sha224-password', 'EXAMPLE.com', 'example.com', 443);

    expect(config.address).toBe('EXAMPLE.com');
  });
});

describe('IsBase64', () => {
  test('should return true for valid base64 strings', () => {
    expect(IsBase64('SGVsbG8gV29ybGQ=')).toBe(true);
    expect(IsBase64('dGVzdA==')).toBe(true);
  });

  test('should return false for invalid base64 strings', () => {
    expect(IsBase64('invalid base64')).toBe(false);
    expect(IsBase64('')).toBe(false);
  });
});

describe('RemoveDuplicateConfigs', () => {
  test('should remove duplicate configs based on remarks, port, address, and uuid', () => {
    const configs = [
      { remarks: 'test', port: 443, address: 'example.com', uuid: 'uuid1' } as Config,
      { remarks: 'test', port: 443, address: 'example.com', uuid: 'uuid1' } as Config, // Duplicate
      { remarks: 'test', port: 80, address: 'example.com', uuid: 'uuid1' } as Config, // Different port
    ];

    const result = RemoveDuplicateConfigs(configs);

    expect(result).toHaveLength(2);
  });

  test('should return all configs if no duplicates', () => {
    const configs = [
      { remarks: 'test1', port: 443, address: 'example.com', uuid: 'uuid1' } as Config,
      { remarks: 'test2', port: 443, address: 'example.com', uuid: 'uuid2' } as Config,
    ];

    const result = RemoveDuplicateConfigs(configs);

    expect(result).toHaveLength(2);
  });
});

describe('AddNumberToConfigs', () => {
  test('should add numbers to config remarks starting from specified number', () => {
    const configs = [
      { remarks: 'config1' } as Config,
      { remarks: 'config2' } as Config,
      { remarks: 'config3' } as Config,
    ];

    const result = AddNumberToConfigs(configs, 5);

    expect(result[0].remarks).toBe('5-config1');
    expect(result[1].remarks).toBe('6-config2');
    expect(result[2].remarks).toBe('7-config3');
  });

  test('should handle empty array', () => {
    const configs: Config[] = [];

    const result = AddNumberToConfigs(configs, 5);

    expect(result).toEqual([]);
  });
});

describe('GenerateToken', () => {
  test('should generate token of default length (32)', () => {
    const token = GenerateToken();

    expect(token).toHaveLength(64); // 32 bytes * 2 hex chars per byte
    expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
  });

  test('should generate token of specified length', () => {
    const token = GenerateToken(16);

    expect(token).toHaveLength(32); // 16 bytes * 2 hex chars per byte
    expect(/^[0-9a-f]{32}$/.test(token)).toBe(true);
  });
});

describe('Delay', () => {
  test('should resolve after specified time', async () => {
    jest.useFakeTimers();
    
    const delayPromise = Delay(1000);
    jest.advanceTimersByTime(1000);
    
    await expect(delayPromise).resolves.toBeUndefined();
    
    jest.useRealTimers();
  });
});

describe('MuddleDomain', () => {
  test('should muddle domain by changing case randomly', () => {
    // Use Math.random mock to make test deterministic
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
    
    const result = MuddleDomain('sub.example.com');
    
    // Should preserve subdomain but muddle the domain part
    expect(result).toMatch(/^sub\.[a-z]+.[a-z]+$/i);
    
    // Restore Math.random
    jest.spyOn(global.Math, 'random').mockRestore();
  });

  test('should handle subdomains correctly', () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
    
    const result = MuddleDomain('a.b.c.example.com');
    
    expect(result).toMatch(/^a\.b\.c\.[a-z]+.[a-z]+$/i);
    
    jest.spyOn(global.Math, 'random').mockRestore();
  });
});

describe('getDefaultProviders', () => {
  test('should fetch and return providers as array', async () => {
    const mockProviders = 'provider1.com\nprovider2.com\nprovider3.com';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: () => Promise.resolve(mockProviders)
    });

    const result = await getDefaultProviders();

    expect(global.fetch).toHaveBeenCalledWith('https://mock.example.com/providers');
    expect(result).toEqual(['provider1.com', 'provider2.com', 'provider3.com']);
  });
});

describe('getDefaultProxies', () => {
  test('should fetch and return proxies as array, filtering empty lines', async () => {
    const mockProxies = 'proxy1.com\n\nproxy2.com\n \nproxy3.com';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: () => Promise.resolve(mockProxies)
    });

    const result = await getDefaultProxies();

    expect(global.fetch).toHaveBeenCalledWith('https://mock.example.com/proxies');
    expect(result).toEqual(['proxy1.com', 'proxy2.com', 'proxy3.com']); // Empty lines filtered out
  });
});

describe('getProxies', () => {
  test('should return proxies from environment if available', async () => {
    const mockEnv = {
      settings: {
        get: jest.fn().mockResolvedValue('proxy1.com\nproxy2.com')
      }
    };

    const result = await getProxies(mockEnv as any);

    expect(mockEnv.settings.get).toHaveBeenCalledWith('Proxies');
    expect(result).toEqual(['proxy1.com', 'proxy2.com']);
  });

  test('should return default proxies if environment proxies not available', async () => {
    const mockEnv = {
      settings: {
        get: jest.fn().mockResolvedValue(null)
      }
    };

    const mockProxies = 'default1.com\ndefault2.com\n';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: () => Promise.resolve(mockProxies)
    });

    const result = await getProxies(mockEnv as any);

    expect(global.fetch).toHaveBeenCalledWith('https://mock.example.com/proxies');
    expect(result).toEqual(['default1.com', 'default2.com']);
  });

  test('should handle errors when getting proxies from environment', async () => {
    const mockEnv = {
      settings: {
        get: jest.fn().mockRejectedValue(new Error('Network error'))
      }
    };

    const mockProxies = 'default1.com\ndefault2.com\n';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: () => Promise.resolve(mockProxies)
    });

    const result = await getProxies(mockEnv as any);

    expect(global.fetch).toHaveBeenCalledWith('https://mock.example.com/proxies');
    expect(result).toEqual(['default1.com', 'default2.com']);
  });
});

describe('getUUID', () => {
  test('should return UUID based on SNI', () => {
    const uuid = getUUID('example.com');
    expect(uuid).toContain('mocked-uuid-example.com');
  });

  test('should return same UUID for same SNI (case insensitive)', () => {
    const uuid1 = getUUID('EXAMPLE.COM');
    const uuid2 = getUUID('example.com');

    expect(uuid1).toBe(uuid2);
  });
});

describe('getSHA224Password', () => {
  test('should return SHA224 hash of SNI', () => {
    const result = getSHA224Password('example.com');
    
    // The exact return value depends on the mock implementation
    expect(typeof result).toBe('string');
    expect(result).toContain('mocked_sha224_');
  });

  test('should return same hash for same SNI (case insensitive)', () => {
    const result1 = getSHA224Password('EXAMPLE.COM');
    const result2 = getSHA224Password('example.com');

    expect(result1).toBe(result2);
  });
});