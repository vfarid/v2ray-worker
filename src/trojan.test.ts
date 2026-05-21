import { GetTrojanConfigList, TrojanOverWSHandler } from './trojan';
import { GetTrojanConfig, MuddleDomain, getSHA224Password, getUUID } from './helpers';
import { cfPorts } from './variables';

// Define a mock for Response that allows 101 status
global.Response = jest.fn((body?: BodyInit | null, init?: ResponseInit) => {
  return {
    status: init?.status ?? 200,
    headers: init?.headers,
    body: body,
    // Add other required Response properties as needed
    ok: true,
    redirected: false,
    statusText: 'OK',
    type: 'default',
    url: '',
    clone: () => ({} as Response),
    bodyUsed: false,
    async arrayBuffer() { return new ArrayBuffer(0) },
    async blob() { return new Blob() },
    async formData() { return new FormData() },
    async json() { return {} },
    async text() { return '' },
  } as Response;
}) as jest.Mocked<typeof Response>;

// Mock cloudflare:sockets
jest.mock('cloudflare:sockets', () => ({
  connect: jest.fn(),
}));

// Mock other dependencies
jest.mock('./helpers', () => ({
  GetTrojanConfig: jest.fn(),
  MuddleDomain: jest.fn(),
  getSHA224Password: jest.fn(),
  getUUID: jest.fn(),
}));

jest.mock('./variables', () => ({
  cfPorts: [80, 443, 8080, 8443],
  proxiesUri: 'https://example.com/proxies'
}));

// Mock WebSocketPair
const mockWebSocket = {
  accept: jest.fn(),
  send: jest.fn(),
  readyState: 1, // OPEN
  close: jest.fn(),
  addEventListener: jest.fn(),
};

const mockClient = {
  fake: 'client'
};

global.WebSocketPair = jest.fn(() => ({ 0: mockClient, 1: mockWebSocket }));

describe('Trojan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks for each test
    (global.WebSocketPair as jest.Mock).mockReturnValue({ 0: mockClient, 1: { ...mockWebSocket } });
  });

  describe('GetTrojanConfigList', () => {
    it('should generate a list of Trojan configs', async () => {
      // Mock the GetTrojanConfig function to return a mock config
      (GetTrojanConfig as jest.MockedFunction<typeof GetTrojanConfig>).mockReturnValue({
        id: 1,
        uuid: 'mock-uuid',
        domain: 'mock-domain',
        address: 'mock-address',
        port: 443
      });

      (getUUID as jest.MockedFunction<typeof getUUID>).mockReturnValue('mock-uuid');
      (MuddleDomain as jest.MockedFunction<typeof MuddleDomain>).mockReturnValue('mock-domain');

      const sni = 'example.com';
      const addressList = ['addr1.com', 'addr2.com'];
      const start = 0;
      const max = 2;
      const env = {} as any;

      const result = await GetTrojanConfigList(sni, addressList, start, max, env);

      expect(result).toHaveLength(2);
      expect(GetTrojanConfig).toHaveBeenCalledTimes(2);
      expect(getUUID).toHaveBeenCalledTimes(2);
      expect(MuddleDomain).toHaveBeenCalledTimes(2);
    });

    it('should use random addresses and ports from the provided lists', async () => {
      (GetTrojanConfig as jest.MockedFunction<typeof GetTrojanConfig>).mockReturnValue({
        id: 1,
        uuid: 'mock-uuid',
        domain: 'mock-domain',
        address: 'mock-address',
        port: 443
      });

      (getUUID as jest.MockedFunction<typeof getUUID>).mockReturnValue('mock-uuid');
      (MuddleDomain as jest.MockedFunction<typeof MuddleDomain>).mockReturnValue('mock-domain');

      const sni = 'example.com';
      const addressList = ['addr1.com', 'addr2.com'];
      const start = 5;
      const max = 3;
      const env = {} as any;

      const result = await GetTrojanConfigList(sni, addressList, start, max, env);

      expect(result).toHaveLength(3);
      expect(GetTrojanConfig).toHaveBeenCalledTimes(3);
      // Check that GetTrojanConfig was called with the correct sequence of IDs
      expect(GetTrojanConfig).toHaveBeenNthCalledWith(1, 5, expect.any(String), expect.any(String), expect.any(String), expect.any(Number));
      expect(GetTrojanConfig).toHaveBeenNthCalledWith(2, 6, expect.any(String), expect.any(String), expect.any(String), expect.any(Number));
      expect(GetTrojanConfig).toHaveBeenNthCalledWith(3, 7, expect.any(String), expect.any(String), expect.any(String), expect.any(Number));
    });
  });

  describe('TrojanOverWSHandler', () => {
    it('should handle WebSocket connection and return response with 101 status', async () => {
      // Mock getSHA224Password and getUUID
      (getSHA224Password as jest.MockedFunction<typeof getSHA224Password>).mockReturnValue('sha224-password');
      (getUUID as jest.MockedFunction<typeof getUUID>).mockReturnValue('mock-uuid');

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(''),
        },
      } as Request;

      const sni = 'example.com';
      const env = {} as any;

      const response = await TrojanOverWSHandler(mockRequest, sni, env);

      expect(response.status).toBe(101);
    });

    it('should handle early data from sec-websocket-protocol header', async () => {
      // Mock getSHA224Password and getUUID
      (getSHA224Password as jest.MockedFunction<typeof getSHA224Password>).mockReturnValue('sha224-password');
      (getUUID as jest.MockedFunction<typeof getUUID>).mockReturnValue('mock-uuid');

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('encoded-early-data'),
        },
      } as Request;

      const sni = 'example.com';
      const env = {} as any;

      const response = await TrojanOverWSHandler(mockRequest, sni, env);

      expect(response.status).toBe(101);
    });
  });
});