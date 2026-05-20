import { MixConfig, EncodeConfig, DecodeConfig, ValidateConfig } from './config';
import { Config } from './interfaces';
import { cfPorts } from './variables';

describe('Config functions', () => {
  describe('MixConfig', () => {
    const mockConfig: Config = {
      configType: 'vless',
      remarks: 'test-config',
      address: 'example.com',
      port: 443,
      uuid: '12345678-1234-1234-1234-123456789abc',
      network: 'ws',
      path: '/path',
      sni: 'example.com',
      host: 'example.com',
    };

    const mockUrl = new URL('https://example.com');
    const mockAddress = '1.1.1.1';
    const mockProvider = 'test';

    it('should return null for unsupported network types', () => {
      const invalidConfig = { ...mockConfig, network: 'invalid' };
      expect(MixConfig(invalidConfig, mockUrl, mockAddress, mockProvider)).toBeNull();
    });

    it('should return null for ports not in cfPorts', () => {
      const invalidConfig = { ...mockConfig, port: 8080 }; // 8080 is not in cfPorts
      expect(MixConfig(invalidConfig, mockUrl, mockAddress, mockProvider)).toBeNull();
    });

    it('should return null when SNI is an IP address', () => {
      const ipConfig = { ...mockConfig, sni: '192.168.1.1' };
      expect(MixConfig(ipConfig, mockUrl, mockAddress, mockProvider)).toBeNull();
    });

    it('should return null for Cloudflare domains', () => {
      const cfConfig = { ...mockConfig, sni: 'test.workers.dev' };
      expect(MixConfig(cfConfig, mockUrl, mockAddress, mockProvider)).toBeNull();
    });

    it('should return mixed config for valid inputs', () => {
      const result = MixConfig(mockConfig, mockUrl, mockAddress, mockProvider);
      expect(result).not.toBeNull();
      expect(result?.remarks).toBe(`${mockConfig.remarks}-worker`);
      expect(result?.address).toBe(mockAddress);
      expect(result?.merged).toBe(true);
      // Note: MuddleDomain function modifies the host and sni, so checking that they're not the original
      expect(result?.host).not.toBe(mockUrl.hostname);
      expect(result?.sni).not.toBe(mockUrl.hostname);
    });
  });

  describe('EncodeConfig', () => {
    it('should encode vmess config correctly', () => {
      const vmessConfig: Config = {
        configType: 'vmess',
        type: 'tcp',
        remarks: 'test-vmess',
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
        alterId: 0,
        tls: 'tls',
        sni: 'example.com',
        network: 'tcp',
        path: '/path',
        host: 'example.com',
        alpn: 'h2',
        fp: 'chrome',
      };

      const result = EncodeConfig(vmessConfig);
      expect(result).toContain('vmess://');
      // Check if decoding gives back the same object
      const decoded = DecodeConfig(result);
      expect(decoded?.configType).toBe('vmess');
      expect(decoded?.remarks).toBe('test-vmess');
    });

    it('should encode vless config correctly', () => {
      const vlessConfig: Config = {
        configType: 'vless',
        remarks: 'test-vless',
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
        encryption: 'none',
        type: 'ws',
        path: '/path',
        host: 'example.com',
        security: 'tls',
        flow: 'xtls-rprx-vision',
        pbk: 'public-key',
        sid: 'session-id',
        sni: 'example.com',
      };

      const result = EncodeConfig(vlessConfig);
      expect(result).toContain('vless://');
      expect(result).toContain('test-vless');
      expect(result).toContain('example.com');
    });

    it('should encode trojan config correctly', () => {
      const trojanConfig: Config = {
        configType: 'trojan',
        remarks: 'test-trojan',
        address: 'example.com',
        port: 443,
        password: 'password123',
        network: 'tcp',
        host: 'example.com',
        path: '/path',
        alpn: 'h2',
        fp: 'chrome',
        tls: 'tls',
        sni: 'example.com',
      };

      const result = EncodeConfig(trojanConfig);
      expect(result).toContain('trojan://');
      expect(result).toContain('password123');
      expect(result).toContain('test-trojan');
    });

    it('should return empty string for unsupported config types', () => {
      const invalidConfig: Config = {
        configType: 'unsupported',
        remarks: 'test-invalid',
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
        network: 'tcp',
        path: '/path',
      };

      const result = EncodeConfig(invalidConfig);
      expect(result).toBe('');
    });
  });

  describe('DecodeConfig', () => {
    it('should decode vmess config correctly', () => {
      const vmessConfig: Config = {
        configType: 'vmess',
        type: 'tcp',
        remarks: 'test-vmess',
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
        alterId: 0,
        tls: 'tls',
        sni: 'example.com',
        network: 'tcp',
        path: '/path',
        host: 'example.com',
        alpn: 'h2',
        fp: 'chrome',
      };

      // Encode and then decode to check roundtrip
      const encoded = EncodeConfig(vmessConfig);
      const decoded = DecodeConfig(encoded);

      expect(decoded?.configType).toBe('vmess');
      expect(decoded?.remarks).toBe('test-vmess');
      expect(decoded?.address).toBe('example.com');
      expect(decoded?.port).toBe(443);
      expect(decoded?.uuid).toBe('12345678-1234-1234-1234-123456789abc');
    });

    it('should return null for invalid vmess config', () => {
      const result = DecodeConfig('vmess://invalid-base64-string');
      expect(result).toBeNull();
    });

    it('should decode vless config correctly', () => {
      const vlessConfig: Config = {
        configType: 'vless',
        remarks: 'test-vless',
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
        encryption: 'none',
        type: 'ws',
        path: '/path',
        host: 'example.com',
        security: 'tls',
        flow: 'xtls-rprx-vision',
        pbk: 'public-key',
        sid: 'session-id',
        sni: 'example.com',
      };

      const encoded = EncodeConfig(vlessConfig);
      const decoded = DecodeConfig(encoded);
      
      expect(decoded?.configType).toBe('vless');
      expect(decoded?.remarks).toBe('test-vless');
      expect(decoded?.address).toBe('example.com');
      expect(decoded?.port).toBe(443);
      expect(decoded?.uuid).toBe('12345678-1234-1234-1234-123456789abc');
    });

    it('should return null for invalid vless config with malformed URL', () => {
      // Using an intentionally broken URL that will cause the URL constructor to throw an error
      const result = DecodeConfig('vless://test@test@'); // Invalid URL format
      expect(result).toBeNull();
    });
  });

  describe('ValidateConfig', () => {
    it('should validate vmess config with valid UUID and remarks', () => {
      const validVmessConfig: Config = {
        configType: 'vmess',
        remarks: 'valid-vmess',
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc', // valid UUID
      };

      expect(ValidateConfig(validVmessConfig)).toBe(true);
    });

    it('should return false for vmess config with invalid UUID', () => {
      const invalidVmessConfig: Config = {
        configType: 'vmess',
        remarks: 'invalid-vmess',
        address: 'example.com',
        port: 443,
        uuid: 'invalid-uuid', // invalid UUID
      };

      expect(ValidateConfig(invalidVmessConfig)).toBe(false);
    });

    it('should validate vless config with valid UUID and remarks', () => {
      const validVlessConfig: Config = {
        configType: 'vless',
        remarks: 'valid-vless',
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc', // valid UUID
      };

      expect(ValidateConfig(validVlessConfig)).toBe(true);
    });

    it('should validate trojan config with password and remarks', () => {
      const validTrojanConfig: Config = {
        configType: 'trojan',
        remarks: 'valid-trojan',
        address: 'example.com',
        port: 443,
        password: 'valid-password',
      };

      expect(ValidateConfig(validTrojanConfig)).toBe(true);
    });

    it('should validate trojan config with UUID and remarks', () => {
      const validTrojanConfig: Config = {
        configType: 'trojan',
        remarks: 'valid-trojan',
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc', // valid UUID
      };

      expect(ValidateConfig(validTrojanConfig)).toBe(true);
    });

    it('should return false for config without remarks', () => {
      const invalidConfig: Config = {
        configType: 'vmess',
        remarks: '', // Empty remarks
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
      };

      expect(ValidateConfig(invalidConfig)).toBe(false);
    });

    it('should return false for config without address or sni', () => {
      const invalidConfig: Config = {
        configType: 'vmess',
        remarks: 'test-config',
        address: '', // Empty address
        sni: '',     // Empty sni
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
      };

      expect(ValidateConfig(invalidConfig)).toBe(false);
    });

    it('should return false for unsupported config type', () => {
      const invalidConfig: Config = {
        configType: 'unsupported',
        remarks: 'test-config',
        address: 'example.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
      };

      expect(ValidateConfig(invalidConfig)).toBe(false);
    });
  });
});