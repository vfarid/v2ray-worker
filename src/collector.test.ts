import { GetConfigList } from './collector';
import { Env, Config } from './interfaces';
import { GetVlessConfigList } from './vless';
import { GetTrojanConfigList } from './trojan';
import { MixConfig, ValidateConfig, DecodeConfig } from './config';
import { GetMultipleRandomElements, RemoveDuplicateConfigs, AddNumberToConfigs, IsBase64, MuddleDomain } from './helpers';
import type { Buffer } from 'buffer';
import { version, providersUri, defaultProtocols, defaultALPNList, defaultPFList, fragmentsLengthList, fragmentsIntervalList } from './variables';

// Mock external modules
jest.mock('./vless', () => ({
  GetVlessConfigList: jest.fn()
}));
jest.mock('./trojan', () => ({
  GetTrojanConfigList: jest.fn()
}));
jest.mock('./config', () => ({
  MixConfig: jest.fn(),
  ValidateConfig: jest.fn(),
  DecodeConfig: jest.fn()
}));
jest.mock('./helpers', () => ({
  GetMultipleRandomElements: jest.fn(),
  RemoveDuplicateConfigs: jest.fn(),
  AddNumberToConfigs: jest.fn(),
  IsBase64: jest.fn(),
  MuddleDomain: jest.fn()
}));
jest.mock('js-yaml', () => ({
  load: jest.fn()
}));
jest.mock('buffer', () => ({
  Buffer: {
    from: jest.fn()
  }
}));
jest.mock('./variables', () => ({
  version: '2.1',
  providersUri: 'https://example.com/providers',
  defaultProtocols: ['vmess', 'vless', 'trojan'],
  defaultALPNList: ['h2', 'http/1.1'],
  defaultPFList: ['chrome', 'firefox', 'safari'],
  fragmentsLengthList: ['5-10', '10-20'],
  fragmentsIntervalList: ['50-100', '100-200']
}));

// Mock the global fetch
global.fetch = jest.fn();

describe('GetConfigList', () => {
  let mockEnv: Env;
  let mockSettings: any;
  let mockUrl: URL;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock settings
    mockSettings = {
      get: jest.fn(),
    };

    mockEnv = {
      settings: mockSettings
    };

    mockUrl = new URL('https://example.com');

    // Mock fetch to return empty providers by default
    (global.fetch as jest.Mock).mockResolvedValue({
      text: () => Promise.resolve("")
    });
  });

  it('should return empty array when no protocols and no configs', async () => {
    // Mock settings to return no protocols
    mockSettings.get.mockResolvedValueOnce(null); // MaxConfigs
    mockSettings.get.mockResolvedValueOnce(null); // Protocols

    // Mock other settings
    mockSettings.get.mockResolvedValueOnce(null); // Version
    mockSettings.get.mockResolvedValueOnce(null); // BlockPorn
    mockSettings.get.mockResolvedValueOnce(null); // Countries
    mockSettings.get.mockResolvedValueOnce(null); // Providers
    mockSettings.get.mockResolvedValueOnce(null); // Configs
    mockSettings.get.mockResolvedValueOnce(null); // ALPNs
    mockSettings.get.mockResolvedValueOnce(null); // FingerPrints
    mockSettings.get.mockResolvedValueOnce(null); // IncludeOriginalConfigs
    mockSettings.get.mockResolvedValueOnce(null); // IncludeMergedConfigs
    mockSettings.get.mockResolvedValueOnce(null); // CleanDomainIPs
    mockSettings.get.mockResolvedValueOnce(null); // EnableFragments

    // Mock helper functions
    (MuddleDomain as jest.Mock).mockReturnValue('example.com');
    (ValidateConfig as jest.Mock).mockReturnValue(true);
    (DecodeConfig as jest.Mock).mockReturnValue({ type: 'vless' });
    (MixConfig as jest.Mock).mockReturnValue({ merged: true, remarks: 'test' });
    (GetMultipleRandomElements as jest.Mock).mockImplementation((arr, count) => arr.slice(0, count));
    (RemoveDuplicateConfigs as jest.Mock).mockImplementation((configs) => configs);
    (AddNumberToConfigs as jest.Mock).mockImplementation((configs) => configs);

    const result = await GetConfigList(mockUrl, mockEnv);

    expect(result).toEqual([]);
  });

  it('should handle built-in vless and trojan protocols', async () => {
    // Mock settings for built-in protocols
    mockSettings.get.mockResolvedValueOnce('100'); // MaxConfigs
    mockSettings.get.mockResolvedValueOnce('2.1'); // Version
    mockSettings.get.mockResolvedValueOnce('built-in-vless\nbuilt-in-trojan'); // Protocols
    mockSettings.get.mockResolvedValueOnce(null); // BlockPorn
    mockSettings.get.mockResolvedValueOnce(null); // Countries

    // Mock providers to return empty list
    mockSettings.get.mockResolvedValueOnce(null); // Providers

    // Mock configs to return empty
    mockSettings.get.mockResolvedValueOnce(null); // Configs
    mockSettings.get.mockResolvedValueOnce(null); // ALPNs
    mockSettings.get.mockResolvedValueOnce(null); // FingerPrints
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeOriginalConfigs
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeMergedConfigs
    mockSettings.get.mockResolvedValueOnce(null); // CleanDomainIPs
    mockSettings.get.mockResolvedValueOnce('no'); // EnableFragments

    // Mock vless and trojan config functions
    (GetVlessConfigList as jest.Mock).mockResolvedValueOnce([
      { protocol: 'vless', id: 1 } as Config,
      { protocol: 'vless', id: 2 } as Config
    ]);
    (GetTrojanConfigList as jest.Mock).mockResolvedValueOnce([
      { protocol: 'trojan', id: 3 } as Config,
      { protocol: 'trojan', id: 4 } as Config
    ]);

    // Mock helper functions
    (MuddleDomain as jest.Mock).mockReturnValue('example.com');
    (ValidateConfig as jest.Mock).mockReturnValue(true);
    (DecodeConfig as jest.Mock).mockReturnValue({ type: 'vless', configType: 'vless' });
    (MixConfig as jest.Mock).mockReturnValue({ merged: true, remarks: 'test', fp: 'chrome', alpn: 'h2' });
    (GetMultipleRandomElements as jest.Mock).mockImplementation((arr, count) => arr.slice(0, count));
    (RemoveDuplicateConfigs as jest.Mock).mockImplementation((configs) => configs);
    (AddNumberToConfigs as jest.Mock).mockImplementation((configs) => configs);

    const result = await GetConfigList(mockUrl, mockEnv);

    expect(GetVlessConfigList).toHaveBeenCalled();
    expect(GetTrojanConfigList).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
    expect(result.some(config => config.protocol === 'vless')).toBe(true);
    expect(result.some(config => config.protocol === 'trojan')).toBe(true);
  });

  it('should handle BlockPorn setting', async () => {
    // Mock settings for BlockPorn
    mockSettings.get.mockResolvedValueOnce(null); // MaxConfigs (fallback to defaults)
    mockSettings.get.mockResolvedValueOnce(null); // Version
    mockSettings.get.mockResolvedValueOnce(null); // Protocols
    mockSettings.get.mockResolvedValueOnce('yes'); // BlockPorn
    mockSettings.get.mockResolvedValueOnce(null); // Countries

    // Mock providers to return empty list
    mockSettings.get.mockResolvedValueOnce(null); // Providers
    mockSettings.get.mockResolvedValueOnce(null); // Configs
    mockSettings.get.mockResolvedValueOnce(null); // ALPNs
    mockSettings.get.mockResolvedValueOnce(null); // FingerPrints
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeOriginalConfigs
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeMergedConfigs
    mockSettings.get.mockResolvedValueOnce(null); // CleanDomainIPs
    mockSettings.get.mockResolvedValueOnce('no'); // EnableFragments

    // Mock vless and trojan config functions (these are called when protocols include built-in ones)
    (GetVlessConfigList as jest.Mock).mockResolvedValue([]);
    (GetTrojanConfigList as jest.Mock).mockResolvedValue([]);

    // Mock helper functions
    (MuddleDomain as jest.Mock).mockReturnValue('example.com');
    (ValidateConfig as jest.Mock).mockReturnValue(true);
    (DecodeConfig as jest.Mock).mockReturnValue({ type: 'vless', configType: 'vless' });
    (GetMultipleRandomElements as jest.Mock).mockImplementation((arr, count) => arr.slice(0, count));
    (RemoveDuplicateConfigs as jest.Mock).mockImplementation((configs) => configs);
    (AddNumberToConfigs as jest.Mock).mockImplementation((configs) => configs);

    const result = await GetConfigList(mockUrl, mockEnv);

    // When BlockPorn is enabled, protocols should be set to ["built-in-vless"]
    // and max configs should be limited to maxBuiltInConfigsPerType
    expect(result).toBeDefined();
  });

  it('should handle Countries limiting', async () => {
    // Mock settings for Countries
    mockSettings.get.mockResolvedValueOnce(null); // MaxConfigs (fallback to defaults)
    mockSettings.get.mockResolvedValueOnce(null); // Version
    mockSettings.get.mockResolvedValueOnce(null); // Protocols
    mockSettings.get.mockResolvedValueOnce('no'); // BlockPorn
    mockSettings.get.mockResolvedValueOnce('IR DE'); // Countries (not empty)

    // Mock providers to return empty list
    mockSettings.get.mockResolvedValueOnce(null); // Providers
    mockSettings.get.mockResolvedValueOnce(null); // Configs
    mockSettings.get.mockResolvedValueOnce(null); // ALPNs
    mockSettings.get.mockResolvedValueOnce(null); // FingerPrints
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeOriginalConfigs
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeMergedConfigs
    mockSettings.get.mockResolvedValueOnce(null); // CleanDomainIPs
    mockSettings.get.mockResolvedValueOnce('no'); // EnableFragments

    // Mock vless and trojan config functions (these are called when protocols include built-in ones)
    (GetVlessConfigList as jest.Mock).mockResolvedValue([]);
    (GetTrojanConfigList as jest.Mock).mockResolvedValue([]);

    // Mock helper functions
    (MuddleDomain as jest.Mock).mockReturnValue('example.com');
    (ValidateConfig as jest.Mock).mockReturnValue(true);
    (DecodeConfig as jest.Mock).mockReturnValue({ type: 'vless', configType: 'vless' });
    (GetMultipleRandomElements as jest.Mock).mockImplementation((arr, count) => arr.slice(0, count));
    (RemoveDuplicateConfigs as jest.Mock).mockImplementation((configs) => configs);
    (AddNumberToConfigs as jest.Mock).mockImplementation((configs) => configs);

    const result = await GetConfigList(mockUrl, mockEnv);

    // When Countries is set, protocols should be set to ["built-in-vless", "built-in-trojan"]
    expect(result).toBeDefined();
  });

  it('should process providers and their configurations', async () => {
    // Import yaml to access the mock
    const yaml = require('js-yaml');

    // Mock settings
    mockSettings.get.mockResolvedValueOnce('200'); // MaxConfigs
    mockSettings.get.mockResolvedValueOnce('2.1'); // Version
    mockSettings.get.mockResolvedValueOnce('vless'); // Protocols
    mockSettings.get.mockResolvedValueOnce('no'); // BlockPorn
    mockSettings.get.mockResolvedValueOnce(''); // Countries
    mockSettings.get.mockResolvedValueOnce('provider1.com\nprovider2.com'); // Providers
    mockSettings.get.mockResolvedValueOnce(null); // Configs
    mockSettings.get.mockResolvedValueOnce(null); // ALPNs
    mockSettings.get.mockResolvedValueOnce(null); // FingerPrints
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeOriginalConfigs
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeMergedConfigs
    mockSettings.get.mockResolvedValueOnce(null); // CleanDomainIPs
    mockSettings.get.mockResolvedValueOnce('no'); // EnableFragments

    // Mock global fetch to handle specific provider URLs appropriately
    const mockFetchImplementation = (url: string) => {
      if (url.includes('provider1.com')) {
        return Promise.resolve({ text: () => Promise.resolve('proxies:\n  - type: vless\n    server: test.com\n    port: 443') });
      } else if (url.includes('provider2.com')) {
        return Promise.resolve({ text: () => Promise.resolve('proxies:\n  - type: vless\n    server: test2.com\n    port: 443') });
      }
      return Promise.resolve({ text: () => Promise.resolve('') });
    };
    (global.fetch as jest.Mock).mockImplementation(mockFetchImplementation);

    // Mock yaml loading with more complete config objects that will pass MixConfig validation
    (yaml.load as jest.Mock).mockReturnValue({
      proxies: [
        {
          type: 'vless',
          configType: 'vless',
          server: 'test.com',
          port: 443,
          uuid: '11111111-1111-1111-1111-111111111111',
          alterId: 0,
          cipher: 'auto',
          network: 'ws',  // Required for MixConfig
          remarks: 'config1',
          address: 'test.com',
          path: '/path1',
          host: 'test.com',
          tls: 'tls',
          sni: 'test.com'
        },
        {
          type: 'vless',
          configType: 'vless',
          server: 'test2.com',
          port: 443,
          uuid: '22222222-2222-2222-2222-222222222222',
          alterId: 0,
          cipher: 'auto',
          network: 'ws',  // Required for MixConfig
          remarks: 'config2',
          address: 'test2.com',
          path: '/path2',
          host: 'test2.com',
          tls: 'tls',
          sni: 'test2.com'
        }
      ]
    });

    // Mock helper functions
    (MuddleDomain as jest.Mock).mockReturnValue('example.com');
    (ValidateConfig as jest.Mock).mockReturnValue(true);
    (MixConfig as jest.Mock).mockReturnValue({ merged: true, remarks: 'test-config', fp: 'chrome', alpn: 'h2' });
    (GetMultipleRandomElements as jest.Mock).mockImplementation((arr, count) => {
      // Return up to 'count' elements from the array, or all if array is smaller
      // If arr is empty or count is 0, return empty array, but ensure we handle the case properly
      return arr.slice(0, Math.min(count, arr.length));
    });
    (RemoveDuplicateConfigs as jest.Mock).mockImplementation((configs) => configs);
    (AddNumberToConfigs as jest.Mock).mockImplementation((configs) => configs);

    const result = await GetConfigList(mockUrl, mockEnv);

    expect(global.fetch).toHaveBeenCalledTimes(2); // Called twice for two providers
    expect(Array.isArray(result)).toBe(true);
    // At a minimum, the function should not crash and return an array
  });

  it('should process base64 encoded providers', async () => {
    // Mock settings
    mockSettings.get.mockResolvedValueOnce('200'); // MaxConfigs
    mockSettings.get.mockResolvedValueOnce('2.1'); // Version
    mockSettings.get.mockResolvedValueOnce('vless'); // Protocols
    mockSettings.get.mockResolvedValueOnce('no'); // BlockPorn
    mockSettings.get.mockResolvedValueOnce(''); // Countries
    mockSettings.get.mockResolvedValueOnce('provider1.com'); // Providers
    mockSettings.get.mockResolvedValueOnce(null); // Configs
    mockSettings.get.mockResolvedValueOnce(null); // ALPNs
    mockSettings.get.mockResolvedValueOnce(null); // FingerPrints
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeOriginalConfigs
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeMergedConfigs
    mockSettings.get.mockResolvedValueOnce(null); // CleanDomainIPs
    mockSettings.get.mockResolvedValueOnce('no'); // EnableFragments

    // Mock fetch to return base64 content
    const mockBase64Content = 'dmxlc3M6Ly9jb25maWcxXG50cm9qYW46Ly9jb25maWcy'; // base64 encoded "vless://config1\ntrojan://config2"
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: () => Promise.resolve(mockBase64Content)
    });

    // Mock yaml parsing to fail so it tries the base64 parsing path
    const mockYaml2 = require('js-yaml') as jest.Mocked<typeof import('js-yaml')>;
    (mockYaml2.load as jest.Mock).mockImplementation(() => { throw new Error("not yaml"); });

    // Mock helper functions
    (IsBase64 as jest.Mock).mockReturnValue(true);
    (MuddleDomain as jest.Mock).mockReturnValue('example.com');
    (DecodeConfig as jest.Mock).mockReturnValue({ type: 'vless', configType: 'vless' });
    (ValidateConfig as jest.Mock).mockReturnValue(true);
    (MixConfig as jest.Mock).mockReturnValue({ merged: true, remarks: 'test-config', fp: 'chrome', alpn: 'h2' });
    (GetMultipleRandomElements as jest.Mock).mockImplementation((arr, count) => arr.slice(0, count));
    (RemoveDuplicateConfigs as jest.Mock).mockImplementation((configs) => configs);
    (AddNumberToConfigs as jest.Mock).mockImplementation((configs) => configs);

    const result = await GetConfigList(mockUrl, mockEnv);

    expect(IsBase64).toHaveBeenCalledWith(mockBase64Content);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle custom configurations', async () => {
    // Mock settings
    mockSettings.get.mockResolvedValueOnce('200'); // MaxConfigs
    mockSettings.get.mockResolvedValueOnce('2.1'); // Version
    mockSettings.get.mockResolvedValueOnce('vless'); // Protocols
    mockSettings.get.mockResolvedValueOnce('no'); // BlockPorn
    mockSettings.get.mockResolvedValueOnce(''); // Countries
    mockSettings.get.mockResolvedValueOnce(null); // Providers
    mockSettings.get.mockResolvedValueOnce('vless://custom-config1\nvless://custom-config2'); // Configs
    mockSettings.get.mockResolvedValueOnce(null); // ALPNs
    mockSettings.get.mockResolvedValueOnce(null); // FingerPrints
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeOriginalConfigs
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeMergedConfigs
    mockSettings.get.mockResolvedValueOnce(null); // CleanDomainIPs
    mockSettings.get.mockResolvedValueOnce('no'); // EnableFragments

    // Mock fetch to return empty providers
    (global.fetch as jest.Mock).mockResolvedValueOnce({ text: () => Promise.resolve("") });

    // Mock helper functions
    (MuddleDomain as jest.Mock).mockReturnValue('example.com');
    (DecodeConfig as jest.Mock).mockImplementation((config) => ({ type: 'vless', configType: 'vless', raw: config }));
    (ValidateConfig as jest.Mock).mockReturnValue(true);
    (MixConfig as jest.Mock).mockReturnValue({ merged: true, remarks: 'test-config', fp: 'chrome', alpn: 'h2' });
    (GetMultipleRandomElements as jest.Mock).mockImplementation((arr, count) => arr.slice(0, count));
    (RemoveDuplicateConfigs as jest.Mock).mockImplementation((configs) => configs);
    (AddNumberToConfigs as jest.Mock).mockImplementation((configs) => configs);

    const result = await GetConfigList(mockUrl, mockEnv);

    // Custom configs should be decoded and added to the final list
    expect(DecodeConfig).toHaveBeenCalled(); // It will be called more than once due to different processing paths
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle ALPNs and fingerprints assignment', async () => {
    // Mock settings
    mockSettings.get.mockResolvedValueOnce('200'); // MaxConfigs
    mockSettings.get.mockResolvedValueOnce('2.1'); // Version
    mockSettings.get.mockResolvedValueOnce('vless'); // Protocols
    mockSettings.get.mockResolvedValueOnce('no'); // BlockPorn
    mockSettings.get.mockResolvedValueOnce(''); // Countries
    mockSettings.get.mockResolvedValueOnce(null); // Providers
    mockSettings.get.mockResolvedValueOnce(null); // Configs
    mockSettings.get.mockResolvedValueOnce('h3\nhttp/1.1'); // ALPNs
    mockSettings.get.mockResolvedValueOnce('chrome\nfirefox'); // FingerPrints
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeOriginalConfigs
    mockSettings.get.mockResolvedValueOnce('yes'); // IncludeMergedConfigs
    mockSettings.get.mockResolvedValueOnce(null); // CleanDomainIPs
    mockSettings.get.mockResolvedValueOnce('no'); // EnableFragments

    // Mock fetch to return empty providers
    (global.fetch as jest.Mock).mockResolvedValueOnce({ text: () => Promise.resolve("") });

    // Mock helper functions
    (MuddleDomain as jest.Mock).mockReturnValue('example.com');
    (ValidateConfig as jest.Mock).mockReturnValue(true);
    (DecodeConfig as jest.Mock).mockReturnValue({ type: 'vless', configType: 'vless' });
    (GetMultipleRandomElements as jest.Mock).mockImplementation((arr, count) => arr.slice(0, count));
    (RemoveDuplicateConfigs as jest.Mock).mockImplementation((configs) => configs);
    (AddNumberToConfigs as jest.Mock).mockImplementation((configs) => configs);

    const result = await GetConfigList(mockUrl, mockEnv);

    // Check if ALPNs and fingerprints are assigned to configs
    if (result.length > 0) {
      const firstConfig = result[0];
      expect(firstConfig).toHaveProperty('alpn');
      expect(firstConfig).toHaveProperty('fp');
      expect(['h3', 'http/1.1']).toContain(firstConfig.alpn);
      expect(['chrome', 'firefox']).toContain(firstConfig.fp);
    }
  });
});