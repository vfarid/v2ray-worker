import {
  version,
  providersUri,
  proxiesUri,
  defaultProtocols,
  defaultALPNList,
  defaultPFList,
  cfPorts,
  supportedCiphers,
  fragmentsLengthList,
  fragmentsIntervalList,
  defaultClashConfig,
  defaultV2rayConfig
} from './variables';

describe('Variables', () => {
  describe('version', () => {
    it('should be a string with value "2.4"', () => {
      expect(version).toBe('2.4');
      expect(typeof version).toBe('string');
    });
  });

  describe('providersUri', () => {
    it('should be a string with the correct URL', () => {
      expect(providersUri).toBe('https://raw.githubusercontent.com/vfarid/v2ray-worker/main/resources/provider-list.txt');
      expect(typeof providersUri).toBe('string');
    });
  });

  describe('proxiesUri', () => {
    it('should be a string with the correct URL', () => {
      expect(proxiesUri).toBe('https://raw.githubusercontent.com/vfarid/v2ray-worker/main/resources/proxy-list.txt');
      expect(typeof proxiesUri).toBe('string');
    });
  });

  describe('defaultProtocols', () => {
    it('should be an array of strings representing protocols', () => {
      expect(Array.isArray(defaultProtocols)).toBe(true);
      expect(defaultProtocols.length).toBeGreaterThan(0);
      defaultProtocols.forEach(protocol => {
        expect(typeof protocol).toBe('string');
      });
    });

    it('should contain the expected protocols', () => {
      expect(defaultProtocols).toContain('vmess');
      expect(defaultProtocols).toContain('built-in-vless');
      expect(defaultProtocols).toContain('vless');
      expect(defaultProtocols).toContain('built-in-trojan');
    });
  });

  describe('defaultALPNList', () => {
    it('should be an array of strings representing ALPN values', () => {
      expect(Array.isArray(defaultALPNList)).toBe(true);
      expect(defaultALPNList.length).toBeGreaterThan(0);
      defaultALPNList.forEach(alpn => {
        expect(typeof alpn).toBe('string');
      });
    });

    it('should contain the expected ALPN values', () => {
      expect(defaultALPNList).toContain('h3,h2,http/1.1');
      expect(defaultALPNList).toContain('h3,h2');
      expect(defaultALPNList).toContain('h2,http/1.1');
      expect(defaultALPNList).toContain('h2');
      expect(defaultALPNList).toContain('http/1.1');
    });
  });

  describe('defaultPFList', () => {
    it('should be an array of strings representing platforms/fingerprints', () => {
      expect(Array.isArray(defaultPFList)).toBe(true);
      expect(defaultPFList.length).toBeGreaterThan(0);
      defaultPFList.forEach(pf => {
        expect(typeof pf).toBe('string');
      });
    });

    it('should contain the expected platform/fingerprint values', () => {
      expect(defaultPFList).toContain('chrome');
      expect(defaultPFList).toContain('firefox');
      expect(defaultPFList).toContain('randomized');
      expect(defaultPFList).toContain('safari');
      expect(defaultPFList).toContain('edge');
      expect(defaultPFList).toContain('ios');
      expect(defaultPFList).toContain('android');
    });
  });

  describe('cfPorts', () => {
    it('should be an array of numbers representing Cloudflare ports', () => {
      expect(Array.isArray(cfPorts)).toBe(true);
      expect(cfPorts.length).toBeGreaterThan(0);
      cfPorts.forEach(port => {
        expect(typeof port).toBe('number');
      });
    });

    it('should contain the expected port numbers', () => {
      expect(cfPorts).toContain(443);
      expect(cfPorts).toContain(2053);
      expect(cfPorts).toContain(2083);
      expect(cfPorts).toContain(2087);
      expect(cfPorts).toContain(2096);
      expect(cfPorts).toContain(8443);
    });
  });

  describe('supportedCiphers', () => {
    it('should be an array of strings representing supported ciphers', () => {
      expect(Array.isArray(supportedCiphers)).toBe(true);
      expect(supportedCiphers.length).toBeGreaterThan(0);
      supportedCiphers.forEach(cipher => {
        expect(typeof cipher).toBe('string');
      });
    });

    it('should contain the expected ciphers', () => {
      expect(supportedCiphers).toContain('none');
      expect(supportedCiphers).toContain('auto');
      expect(supportedCiphers).toContain('plain');
      expect(supportedCiphers).toContain('aes-128-cfb');
      expect(supportedCiphers).toContain('aes-192-cfb');
      expect(supportedCiphers).toContain('aes-256-cfb');
      expect(supportedCiphers).toContain('rc4-md5');
      expect(supportedCiphers).toContain('chacha20-ietf');
      expect(supportedCiphers).toContain('xchacha20');
      expect(supportedCiphers).toContain('chacha20-ietf-poly1305');
    });
  });

  describe('fragmentsLengthList', () => {
    it('should be an array of strings representing length ranges', () => {
      expect(Array.isArray(fragmentsLengthList)).toBe(true);
      expect(fragmentsLengthList.length).toBeGreaterThan(0);
      fragmentsLengthList.forEach(length => {
        expect(typeof length).toBe('string');
      });
    });

    it('should contain the expected length range values', () => {
      expect(fragmentsLengthList).toContain('10-20');
      expect(fragmentsLengthList).toContain('10-50');
      expect(fragmentsLengthList).toContain('20-50');
      expect(fragmentsLengthList).toContain('30-80');
      expect(fragmentsLengthList).toContain('50-100');
    });
  });

  describe('fragmentsIntervalList', () => {
    it('should be an array of strings representing interval ranges', () => {
      expect(Array.isArray(fragmentsIntervalList)).toBe(true);
      expect(fragmentsIntervalList.length).toBeGreaterThan(0);
      fragmentsIntervalList.forEach(interval => {
        expect(typeof interval).toBe('string');
      });
    });

    it('should contain the expected interval range values', () => {
      expect(fragmentsIntervalList).toContain('10-20');
      expect(fragmentsIntervalList).toContain('10-50');
      expect(fragmentsIntervalList).toContain('20-50');
    });
  });

  describe('defaultClashConfig', () => {
    it('should be an object with the expected properties', () => {
      expect(typeof defaultClashConfig).toBe('object');
      expect(defaultClashConfig).toHaveProperty('port');
      expect(defaultClashConfig).toHaveProperty('socks-port');
      expect(defaultClashConfig).toHaveProperty('allow-lan');
      expect(defaultClashConfig).toHaveProperty('mode');
      expect(defaultClashConfig).toHaveProperty('log-level');
      expect(defaultClashConfig).toHaveProperty('external-controller');
      expect(defaultClashConfig).toHaveProperty('dns');
      expect(defaultClashConfig).toHaveProperty('proxies');
      expect(defaultClashConfig).toHaveProperty('proxy-groups');
      expect(defaultClashConfig).toHaveProperty('rules');
    });

    it('should have the correct property values', () => {
      expect(defaultClashConfig.port).toBe(7890);
      expect(defaultClashConfig['socks-port']).toBe(7891);
      expect(defaultClashConfig['allow-lan']).toBe(false);
      expect(defaultClashConfig.mode).toBe('rule');
      expect(defaultClashConfig['log-level']).toBe('info');
      expect(defaultClashConfig['external-controller']).toBe('127.0.0.1:9090');
      expect(Array.isArray(defaultClashConfig.rules)).toBe(true);
      expect(Array.isArray(defaultClashConfig.proxies)).toBe(true);
      expect(Array.isArray(defaultClashConfig['proxy-groups'])).toBe(true);
    });

    it('should have the correct DNS configuration', () => {
      expect(defaultClashConfig.dns).toHaveProperty('enable');
      expect(defaultClashConfig.dns.enable).toBe(true);
      expect(defaultClashConfig.dns.ipv6).toBe(false);
      expect(defaultClashConfig.dns['enhanced-mode']).toBe('fake-ip');
      expect(Array.isArray(defaultClashConfig.dns.nameserver)).toBe(true);
      expect(defaultClashConfig.dns.nameserver.length).toBeGreaterThan(0);
    });
  });

  describe('defaultV2rayConfig', () => {
    it('should be an object with the expected properties', () => {
      expect(typeof defaultV2rayConfig).toBe('object');
      expect(defaultV2rayConfig).toHaveProperty('stats');
      expect(defaultV2rayConfig).toHaveProperty('log');
      expect(defaultV2rayConfig).toHaveProperty('policy');
      expect(defaultV2rayConfig).toHaveProperty('inbounds');
      expect(defaultV2rayConfig).toHaveProperty('outbounds');
      expect(defaultV2rayConfig).toHaveProperty('routing');
      expect(defaultV2rayConfig).toHaveProperty('dns');
    });

    it('should have the correct log level', () => {
      expect(defaultV2rayConfig.log.loglevel).toBe('warning');
    });

    it('should have the correct inbound configurations', () => {
      expect(Array.isArray(defaultV2rayConfig.inbounds)).toBe(true);
      expect(defaultV2rayConfig.inbounds.length).toBeGreaterThan(0);
      
      // Check first inbound (socks)
      const socksInbound = defaultV2rayConfig.inbounds[0];
      expect(socksInbound.tag).toBe('socks');
      expect(socksInbound.port).toBe(10808);
      expect(socksInbound.protocol).toBe('socks');
      
      // Check second inbound (http)
      const httpInbound = defaultV2rayConfig.inbounds[1];
      expect(httpInbound.tag).toBe('http');
      expect(httpInbound.port).toBe(10809);
      expect(httpInbound.protocol).toBe('http');
    });

    it('should have the correct outbound configurations', () => {
      expect(Array.isArray(defaultV2rayConfig.outbounds)).toBe(true);
      expect(defaultV2rayConfig.outbounds.length).toBeGreaterThan(0);
      
      // Check first outbound (proxy)
      const proxyOutbound = defaultV2rayConfig.outbounds[0];
      expect(proxyOutbound.tag).toBe('proxy');
      expect(proxyOutbound.protocol).toBe('');
      
      // Check second outbound (direct)
      const directOutbound = defaultV2rayConfig.outbounds[1];
      expect(directOutbound.tag).toBe('direct');
      expect(directOutbound.protocol).toBe('freedom');
      
      // Check third outbound (block)
      const blockOutbound = defaultV2rayConfig.outbounds[2];
      expect(blockOutbound.tag).toBe('block');
      expect(blockOutbound.protocol).toBe('blackhole');
    });

    it('should have the routing and dns configurations', () => {
      expect(defaultV2rayConfig.routing).toHaveProperty('domainStrategy');
      expect(defaultV2rayConfig.routing.domainStrategy).toBe('IPIfNonMatch');
      expect(Array.isArray(defaultV2rayConfig.routing.rules)).toBe(true);
      
      expect(defaultV2rayConfig.dns).toHaveProperty('hosts');
      expect(defaultV2rayConfig.dns).toHaveProperty('servers');
      expect(typeof defaultV2rayConfig.dns.hosts).toBe('object');
      expect(Array.isArray(defaultV2rayConfig.dns.servers)).toBe(true);
    });
  });
});