import { 
  RemoteSocketWrapper, 
  CustomArrayBuffer, 
  VlessHeader, 
  UDPOutbound, 
  Config, 
  ClashConfig, 
  WSOpts, 
  WSHeaders, 
  Env 
} from './interfaces';

describe('Interface Tests', () => {
  // Test RemoteSocketWrapper interface
  describe('RemoteSocketWrapper', () => {
    it('should properly type RemoteSocketWrapper', () => {
      const mockSocket = {
        readyState: 1,
        send: jest.fn(),
        close: jest.fn(),
      };

      const remoteSocketWrapper: RemoteSocketWrapper = {
        value: mockSocket,
      };

      expect(remoteSocketWrapper.value).toBeDefined();
      expect(remoteSocketWrapper.value).toBe(mockSocket);
    });

    it('should allow null value for RemoteSocketWrapper', () => {
      const remoteSocketWrapper: RemoteSocketWrapper = {
        value: null,
      };

      expect(remoteSocketWrapper.value).toBeNull();
    });
  });

  // Test CustomArrayBuffer interface
  describe('CustomArrayBuffer', () => {
    it('should properly type CustomArrayBuffer with ArrayBuffer', () => {
      const buffer = new ArrayBuffer(10);
      const customArrayBuffer: CustomArrayBuffer = {
        earlyData: buffer,
        error: null,
      };

      expect(customArrayBuffer.earlyData).toBe(buffer);
      expect(customArrayBuffer.error).toBeNull();
    });

    it('should properly type CustomArrayBuffer with null earlyData', () => {
      const customArrayBuffer: CustomArrayBuffer = {
        earlyData: null,
        error: 'some error',
      };

      expect(customArrayBuffer.earlyData).toBeNull();
      expect(customArrayBuffer.error).toBe('some error');
    });

    it('should allow various error types', () => {
      const customArrayBuffer: CustomArrayBuffer = {
        earlyData: null,
        error: new Error('test error'),
      };

      expect(customArrayBuffer.error).toBeInstanceOf(Error);
      expect(customArrayBuffer.error.message).toBe('test error');
    });
  });

  // Test VlessHeader interface
  describe('VlessHeader', () => {
    it('should properly type VlessHeader with all required fields', () => {
      const vlessHeader: VlessHeader = {
        hasError: false,
        message: 'test message',
        addressRemote: '127.0.0.1',
        addressType: 1,
        portRemote: 8080,
        rawDataIndex: 0,
        vlessVersion: new Uint8Array([1, 2, 3]),
        isUDP: false,
        isMUX: true,
      };

      expect(vlessHeader.hasError).toBe(false);
      expect(vlessHeader.message).toBe('test message');
      expect(vlessHeader.addressRemote).toBe('127.0.0.1');
      expect(vlessHeader.addressType).toBe(1);
      expect(vlessHeader.portRemote).toBe(8080);
      expect(vlessHeader.rawDataIndex).toBe(0);
      expect(vlessHeader.vlessVersion).toEqual(new Uint8Array([1, 2, 3]));
      expect(vlessHeader.isUDP).toBe(false);
      expect(vlessHeader.isMUX).toBe(true);
    });

    it('should allow undefined message in VlessHeader', () => {
      const vlessHeader: VlessHeader = {
        hasError: false,
        message: undefined,
        addressRemote: '192.168.1.1',
        addressType: 2,
        portRemote: 443,
        rawDataIndex: 5,
        vlessVersion: new Uint8Array([0]),
        isUDP: true,
        isMUX: false,
      };

      expect(vlessHeader.message).toBeUndefined();
    });
  });

  // Test UDPOutbound interface
  describe('UDPOutbound', () => {
    it('should properly type UDPOutbound with CallableFunction', () => {
      const writeFn = jest.fn();
      const udpOutbound: UDPOutbound = {
        write: writeFn,
      };

      expect(udpOutbound.write).toBe(writeFn);
      expect(typeof udpOutbound.write).toBe('function');
    });

    it('should allow different types of callable functions', () => {
      const udpOutbound: UDPOutbound = {
        write: (data: any) => {
          return data;
        },
      };

      expect(typeof udpOutbound.write).toBe('function');
      const result = udpOutbound.write('test');
      expect(result).toBe('test');
    });
  });

  // Test Config interface
  describe('Config', () => {
    it('should properly type Config with required fields', () => {
      const config: Config = {
        configType: 'vless',
        remarks: 'test config',
        address: 'example.com',
        port: 8080,
        network: 'tcp',
        path: '/',
      };

      expect(config.configType).toBe('vless');
      expect(config.remarks).toBe('test config');
      expect(config.address).toBe('example.com');
      expect(config.port).toBe(8080);
      expect(config.network).toBe('tcp');
      expect(config.path).toBe('/');
    });

    it('should include optional fields in Config', () => {
      const config: Config = {
        configType: 'vmess',
        remarks: 'vmess config',
        address: 'test.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
        alterId: 64,
        cipher: 'auto',
        security: 'auto',
        encryption: 'chacha20-poly1305',
        tls: 'tls',
        sni: 'test.com',
        network: 'ws',
        path: '/ws',
        host: 'test.com',
        alpn: 'h2',
        fp: 'firefox',
        obfs: 'websocket',
        protocol: 'origin',
        fragment: '5dt5',
        tfo: 'compatible',
        pbk: 'publickey',
        spx: '/path',
        sid: 'sessionID',
        headerType: 'none',
        flow: 'xtls-rprx-direct',
        serviceName: 'grpc-service',
        seed: 'seed',
        quicSecurity: 'tls',
        key: 'encryptionKey',
        mode: 'gun',
        authority: 'authority',
        merged: true,
      };

      expect(config.uuid).toBe('12345678-1234-1234-1234-123456789abc');
      expect(config.alterId).toBe(64);
      expect(config.cipher).toBe('auto');
      expect(config.security).toBe('auto');
      expect(config.encryption).toBe('chacha20-poly1305');
      expect(config.tls).toBe('tls');
      expect(config.sni).toBe('test.com');
      expect(config.host).toBe('test.com');
      expect(config.alpn).toBe('h2');
      expect(config.fp).toBe('firefox');
      expect(config.obfs).toBe('websocket');
      expect(config.protocol).toBe('origin');
      expect(config.fragment).toBe('5dt5');
      expect(config.tfo).toBe('compatible');
      expect(config.pbk).toBe('publickey');
      expect(config.spx).toBe('/path');
      expect(config.sid).toBe('sessionID');
      expect(config.headerType).toBe('none');
      expect(config.flow).toBe('xtls-rprx-direct');
      expect(config.serviceName).toBe('grpc-service');
      expect(config.seed).toBe('seed');
      expect(config.quicSecurity).toBe('tls');
      expect(config.key).toBe('encryptionKey');
      expect(config.mode).toBe('gun');
      expect(config.authority).toBe('authority');
      expect(config.merged).toBe(true);
    });
  });

  // Test ClashConfig interface
  describe('ClashConfig', () => {
    it('should properly type ClashConfig with required fields', () => {
      const clashConfig: ClashConfig = {
        name: 'test config',
        type: 'vless',
        server: 'example.com',
        port: 8080,
        network: 'tcp',
        path: '/',
      };

      expect(clashConfig.name).toBe('test config');
      expect(clashConfig.type).toBe('vless');
      expect(clashConfig.server).toBe('example.com');
      expect(clashConfig.port).toBe(8080);
      expect(clashConfig.network).toBe('tcp');
      expect(clashConfig.path).toBe('/');
    });

    it('should include optional fields in ClashConfig', () => {
      const clashConfig: ClashConfig = {
        name: 'advanced config',
        type: 'vmess',
        server: 'test.com',
        port: 443,
        uuid: '12345678-1234-1234-1234-123456789abc',
        alterId: 64,
        cipher: 'auto',
        security: 'auto',
        encryption: 'chacha20-poly1305',
        tls: true,
        sni: 'test.com',
        network: 'ws',
        path: '/ws',
        host: 'test.com',
        alpn: 'h2',
        fp: 'firefox',
        obfs: 'websocket',
        protocol: 'origin',
        fragment: '5dt5',
        tfo: 'compatible',
        pbk: 'publickey',
        spx: '/path',
        sid: 'sessionID',
        headerType: 'none',
        flow: 'xtls-rprx-direct',
        serviceName: 'grpc-service',
        seed: 'seed',
        quicSecurity: 'tls',
        key: 'encryptionKey',
        mode: 'gun',
        authority: 'authority',
        merged: true,
        password: 'password123',
        "skip-cert-verify": true,
      };

      expect(clashConfig.uuid).toBe('12345678-1234-1234-1234-123456789abc');
      expect(clashConfig.alterId).toBe(64);
      expect(clashConfig.cipher).toBe('auto');
      expect(clashConfig.security).toBe('auto');
      expect(clashConfig.encryption).toBe('chacha20-poly1305');
      expect(clashConfig.tls).toBe(true);
      expect(clashConfig.sni).toBe('test.com');
      expect(clashConfig.password).toBe('password123');
      expect(clashConfig["skip-cert-verify"]).toBe(true);
    });
  });

  // Test WSOpts interface
  describe('WSOpts', () => {
    it('should properly type WSOpts with required fields', () => {
      const wsHeaders: WSHeaders = {
        Host: 'example.com',
      };
      
      const wsOpts: WSOpts = {
        path: '/ws',
        headers: wsHeaders,
      };

      expect(wsOpts.path).toBe('/ws');
      expect(wsOpts.headers).toBe(wsHeaders);
      expect(wsOpts.headers.Host).toBe('example.com');
    });
  });

  // Test WSHeaders interface
  describe('WSHeaders', () => {
    it('should properly type WSHeaders', () => {
      const wsHeaders: WSHeaders = {
        Host: 'example.com',
      };

      expect(wsHeaders.Host).toBe('example.com');
    });

    it('should allow different host values in WSHeaders', () => {
      const wsHeaders: WSHeaders = {
        Host: 'different-host.com',
      };

      expect(wsHeaders.Host).toBe('different-host.com');
    });
  });

  // Test Env interface
  describe('Env', () => {
    it('should properly type Env with KVNamespace-like object', () => {
      const mockKVNamespace = {
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
      };
      
      const env: Env = {
        settings: mockKVNamespace,
      };

      expect(env.settings).toBe(mockKVNamespace);
      expect(typeof env.settings.get).toBe('function');
      expect(typeof env.settings.put).toBe('function');
      expect(typeof env.settings.delete).toBe('function');
      expect(typeof env.settings.list).toBe('function');
    });
  });
});