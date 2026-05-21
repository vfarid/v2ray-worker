import { jest } from '@jest/globals';

// Mock js-yaml before importing the clash module
jest.mock('js-yaml', () => ({
  default: {
    dump: jest.fn((data) => JSON.stringify(data)),
    load: jest.fn((str) => JSON.parse(str as string)),
  },
  dump: jest.fn((data) => JSON.stringify(data)),
  load: jest.fn((str) => JSON.parse(str as string)),
}));

import yaml from 'js-yaml';
import { ToYamlSubscription } from './clash';
import { Config } from './interfaces';
import { defaultClashConfig } from './variables';

describe('ToYamlSubscription', () => {
  it('should convert config list to YAML with default configuration', () => {
    const configList: Config[] = [];
    const result = ToYamlSubscription(configList);
    
    expect(result).toBeDefined();
    const parsedYaml = yaml.load(result);
    expect(parsedYaml).toEqual(expect.objectContaining({
      port: 7890,
      'socks-port': 7891,
      'allow-lan': false,
      mode: 'rule',
      'log-level': 'info',
      'external-controller': '127.0.0.1:9090',
    }));
  });

  it('should map config objects to clash proxy format correctly', () => {
    const configList: Config[] = [
      {
        configType: 'vmess',
        remarks: 'Test Server 1',
        address: 'example.com',
        port: 443,
        uuid: '12345',
        type: 'tcp',
        path: '/path',
        network: 'tcp',
        tls: 'tls',
      }
    ];
    
    const result = ToYamlSubscription(configList);
    const parsedYaml = yaml.load(result) as any;
    
    expect(parsedYaml.proxies).toHaveLength(1);
    expect(parsedYaml.proxies[0]).toEqual({
      name: 'Test Server 1',
      server: 'example.com',
      type: 'vmess',
      port: 443,
      uuid: '12345',
      network: 'tcp',
      path: '/path',
      tls: true,
      cipher: 'auto',
    });
  });

  it('should handle configs with type field correctly', () => {
    const configList: Config[] = [
      {
        configType: 'vless',
        remarks: 'VLESS Server',
        address: 'vless.example.com',
        port: 443,
        uuid: 'abcde',
        type: 'ws',  // This should map to network
        path: '/vless',
        network: 'ws',
        tls: 'tls',
      }
    ];
    
    const result = ToYamlSubscription(configList);
    const parsedYaml = yaml.load(result) as any;
    
    expect(parsedYaml.proxies[0]).toEqual({
      name: 'VLESS Server',
      server: 'vless.example.com',
      type: 'vless',
      port: 443,
      uuid: 'abcde',
      network: 'ws',
      path: '/vless',
      tls: true,
      cipher: 'auto',
    });
  });

  it('should properly assign proxies to different groups based on path', () => {
    const configList: Config[] = [
      {
        configType: 'vless',
        remarks: 'Built-in VLESS',
        address: 'vless.example.com',
        port: 443,
        uuid: 'abcde',
        path: 'vless-ws?param=value',  // Should be in Built-in group
        network: 'ws',
      },
      {
        configType: 'trojan',
        remarks: 'Built-in Trojan',
        address: 'trojan.example.com',
        port: 443,
        password: 'password',
        path: 'trojan-ws/endpoint',  // Should be in Built-in group
        network: 'tcp',
      },
      {
        configType: 'vmess',
        remarks: 'Merged Server',
        address: 'merged.example.com',
        port: 443,
        uuid: '12345',
        path: '/vmess',
        network: 'tcp',
        merged: true,  // Should be in Merged group
      },
      {
        configType: 'ss',
        remarks: 'Original Server',
        address: 'original.example.com',
        port: 8080,
        password: 'mypassword',
        path: '/ss',
        network: 'tcp',
      },
    ];
    
    const result = ToYamlSubscription(configList);
    const parsedYaml = yaml.load(result) as any;
    const proxyGroups = parsedYaml['proxy-groups'];
    
    // Find each group by name
    const allGroup = proxyGroups.find((g: any) => g.name === 'All');
    const builtInGroup = proxyGroups.find((g: any) => g.name === 'Built-in - UrlTest');
    const mergedGroup = proxyGroups.find((g: any) => g.name === 'Merged - UrlTest');
    const originalGroup = proxyGroups.find((g: any) => g.name === 'Original - UrlTest');
    
    expect(allGroup.proxies).toContain('Built-in VLESS');
    expect(allGroup.proxies).toContain('Built-in Trojan');
    expect(allGroup.proxies).toContain('Merged Server');
    expect(allGroup.proxies).toContain('Original Server');
    
    expect(builtInGroup.proxies).toEqual(['Built-in VLESS', 'Built-in Trojan']);
    expect(mergedGroup.proxies).toEqual(['Merged Server']);
    expect(originalGroup.proxies).toEqual(['Original Server']);
  });

  it('should handle non-tls configurations correctly', () => {
    const configList: Config[] = [
      {
        configType: 'ss',
        remarks: 'Shadowsocks Server',
        address: 'ss.example.com',
        port: 8080,
        password: 'mypassword',
        path: '/ss',
        network: 'tcp',
        tls: 'none',
      }
    ];
    
    const result = ToYamlSubscription(configList);
    const parsedYaml = yaml.load(result) as any;
    
    expect(parsedYaml.proxies[0].tls).toBe(false);
  });

  it('should include all required proxy groups', () => {
    const configList: Config[] = [
      {
        configType: 'vmess',
        remarks: 'Test Server',
        address: 'example.com',
        port: 443,
        uuid: '12345',
        path: '/vmess',
        network: 'tcp',
      }
    ];

    const result = ToYamlSubscription(configList);
    const parsedYaml = yaml.load(result) as any;
    const proxyGroups = parsedYaml['proxy-groups'];

    expect(proxyGroups).toHaveLength(8); // There are 8 groups: All, All - UrlTest, All - Fallback, All - LoadBalance(ch), All - LoadBalance(rr), Built-in - UrlTest, Merged - UrlTest, Original - UrlTest
    expect(proxyGroups.map((g: any) => g.name)).toEqual([
      'All',
      'All - UrlTest',
      'All - Fallback',
      'All - LoadBalance(ch)',
      'All - LoadBalance(rr)',
      'Built-in - UrlTest',
      'Merged - UrlTest',
      'Original - UrlTest',
    ]);
  });

  it('should handle configs with additional properties', () => {
    const configList: Config[] = [
      {
        configType: 'trojan',
        remarks: 'Trojan Server',
        address: 'trojan.example.com',
        port: 443,
        password: 'password',
        path: '/trojan',
        network: 'tcp',
        sni: 'sni.example.com',
        alpn: 'h3,h2,http/1.1',  // Note: alpn is excluded from final config due to destructuring
        fp: 'chrome',
        host: 'host.example.com',
      }
    ];

    const result = ToYamlSubscription(configList);
    const parsedYaml = yaml.load(result) as any;

    expect(parsedYaml.proxies[0]).toEqual({
      name: 'Trojan Server',
      server: 'trojan.example.com',
      type: 'trojan',
      port: 443,
      password: 'password',
      path: '/trojan',
      network: 'tcp',
      sni: 'sni.example.com',
      fp: 'chrome',
      host: 'host.example.com',
      tls: false, // default since no tls specified
      cipher: 'auto',
    });
  });

  it('should handle empty config list', () => {
    const configList: Config[] = [];
    const result = ToYamlSubscription(configList);
    const parsedYaml = yaml.load(result) as any;
    
    expect(parsedYaml.proxies).toEqual([]);
    expect(parsedYaml['proxy-groups']).toEqual([
      {
        name: "All",
        type: "select",
        proxies: [
          "All - UrlTest",
          "All - Fallback",
          "All - LoadBalance(ch)",
          "All - LoadBalance(rr)",
          "Built-in - UrlTest",
          "Merged - UrlTest",
          "Original - UrlTest",
        ],
      },
      {
        name: "All - UrlTest",
        type: "url-test",
        url: "http://clients3.google.com/generate_204",
        interval: 600,
        proxies: [],
      },
      {
        name: "All - Fallback",
        type: "fallback",
        url: "http://clients3.google.com/generate_204",
        interval: 600,
        proxies: [],
      },
      {
        name: "All - LoadBalance(ch)",
        type: "load-balance",
        strategy: "consistent-hashing",
        url: "http://clients3.google.com/generate_204",
        interval: 600,
        proxies: [],
      },
      {
        name: "All - LoadBalance(rr)",
        type: "load-balance",
        strategy: "round-robin",
        url: "http://clients3.google.com/generate_204",
        interval: 600,
        proxies: [],
      },
      {
        name: "Built-in - UrlTest",
        type: "url-test",
        url: "http://clients3.google.com/generate_204",
        interval: 600,
        proxies: [],
      },
      {
        name: "Merged - UrlTest",
        type: "url-test",
        url: "http://clients3.google.com/generate_204",
        interval: 600,
        proxies: [],
      },
      {
        name: "Original - UrlTest",
        type: "url-test",
        url: "http://clients3.google.com/generate_204",
        interval: 600,
        proxies: [],
      },
    ]);
  });
});