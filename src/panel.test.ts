import { GetPanel, PostPanel } from './panel';
import * as bcrypt from 'bcryptjs';
import { GenerateToken } from './helpers';
import { version, defaultProtocols, proxiesUri } from './variables';

// Mock the external dependencies
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

jest.mock('./helpers', () => ({
  GenerateToken: jest.fn(),
}));

// Mock fetch for the proxiesUri
global.fetch = jest.fn();

// Mock the Env interface
const mockEnv = {
  settings: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
};

// Create URL mock without recursion
const originalURL = global.URL;
const mockURLConstructor = jest.fn().mockImplementation((input: string) => {
  return {
    origin: new originalURL(input).origin,
    hostname: new originalURL(input).hostname,
    searchParams: {
      get: jest.fn(),
    },
  };
});

global.URL = mockURLConstructor;

describe('Panel Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockURLConstructor.mockClear();

    // Default mock implementation for URL
    mockURLConstructor.mockImplementation((input: string) => {
      return {
        origin: new originalURL(input).origin,
        hostname: new originalURL(input).hostname,
        searchParams: {
          get: jest.fn(),
        },
      };
    });

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      text: jest.fn().mockResolvedValue(''),
    } as Response);
  });

  describe('GetPanel', () => {
    it('should redirect to login if password is set and token is invalid', async () => {
      const mockRequest = {
        url: 'https://example.com/panel',
      } as Request;

      // Mock that a password hash exists and token is invalid
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('hashed_password');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('stored_token');
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: jest.fn().mockReturnValue('invalid_token'),
        },
      }));

      const response = await GetPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('https://example.com/login');
    });

    it('should render the panel HTML when no password is set', async () => {
      const mockRequest = {
        url: 'https://example.com/panel',
      } as Request;

      // Mock that no password exists
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(version);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('200');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(defaultProtocols.join('\n'));
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('yes');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('yes');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('no');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('no');
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        text: jest.fn().mockResolvedValue(''),
      } as Response);

      const response = await GetPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      const body = await response.text();
      expect(body).toContain('<!DOCTYPE html>');
      expect(body).toContain('V2ray Worker Control Panel');
    });

    it('should render password section when password exists', async () => {
      const mockRequest = {
        url: 'https://example.com/panel?token=valid_token',
      } as Request;

      // Mock that a password exists
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('hashed_password');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('valid_token');
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: jest.fn().mockReturnValue('valid_token'),
        },
      }));
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(version);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('200');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(defaultProtocols.join('\n'));
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('yes');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('yes');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('no');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('no');
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        text: jest.fn().mockResolvedValue(''),
      } as Response);

      const response = await GetPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      const body = await response.text();
      expect(body).toContain('Remove Password');
    });

    it('should show success message when message=success', async () => {
      const mockRequest = {
        url: 'https://example.com/panel?message=success',
      } as Request;

      // Mock that no password exists
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'message') return 'success';
            return null;
          },
        },
      }));
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(version);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('200');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(defaultProtocols.join('\n'));
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('yes');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('yes');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('no');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('no');
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        text: jest.fn().mockResolvedValue(''),
      } as Response);

      const response = await GetPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('Settings saved successfully.');
    });

    it('should show error message when message=error', async () => {
      const mockRequest = {
        url: 'https://example.com/panel?message=error',
      } as Request;

      // Mock that no password exists
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'message') return 'error';
            return null;
          },
        },
      }));
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(version);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('200');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(defaultProtocols.join('\n'));
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('yes');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('yes');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('no');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('no');
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        text: jest.fn().mockResolvedValue(''),
      } as Response);

      const response = await GetPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('Failed to save settings!');
    });

    it('should handle TypeError and return error page', async () => {
      const mockRequest = {
        url: 'https://example.com/panel',
      } as Request;

      // Mock a TypeError being thrown
      (mockEnv.settings.get as jest.Mock).mockRejectedValueOnce(new TypeError('Test error'));
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: jest.fn().mockReturnValue(null),
        },
      }));

      const response = await GetPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain('The \'settings\' namespace is not defined!');
    });
  });

  describe('PostPanel', () => {
    it('should redirect to login if password is set and token is invalid', async () => {
      const mockRequest = {
        url: 'https://example.com/panel',
        formData: jest.fn().mockResolvedValue(new FormData()),
      } as any;

      // Mock that a password hash exists and token is invalid
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('hashed_password');
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce('stored_token');
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: jest.fn().mockReturnValue('invalid_token'),
        },
      }));

      const response = await PostPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('https://example.com/login');
    });

    it('should reset password when reset_password is submitted', async () => {
      const formData = new FormData();
      formData.append('reset_password', '1');

      const mockRequest = {
        url: 'https://example.com/panel',
        formData: jest.fn().mockResolvedValue(Promise.resolve(formData)),
      } as any;

      // Mock that a password exists initially, then no password to allow reset
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null); // No password initially to bypass token check
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null); // No token initially
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: jest.fn().mockReturnValue(null),
        },
      }));

      const response = await PostPanel(mockRequest, mockEnv as any);

      // Check that password delete was called
      const deleteCalls = (mockEnv.settings.delete as jest.Mock).mock.calls;
      const deleteArgs = deleteCalls.flat();

      // We expect Password and Token to be deleted
      expect(deleteArgs).toContain('Password');
      expect(deleteArgs).toContain('Token');
      expect(response.status).toBe(302);
    });

    it('should save settings when save button is clicked', async () => {
      const formData = new FormData();
      formData.append('save', 'save');
      formData.append('max', '150');
      formData.append('protocols', 'vmess');
      formData.append('original', 'yes');
      formData.append('merged', 'yes');

      const mockRequest = {
        url: 'https://example.com/panel',
        formData: jest.fn().mockResolvedValue(Promise.resolve(formData)),
      } as any;

      // Mock dependencies
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null); // No password
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null); // No token
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: jest.fn().mockReturnValue(null),
        },
      }));

      // Mock bcrypt and GenerateToken
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (GenerateToken as jest.Mock).mockReturnValue('generated_token');

      const response = await PostPanel(mockRequest, mockEnv as any);

      expect(mockEnv.settings.put).toHaveBeenCalledWith('MaxConfigs', '150');
      expect(mockEnv.settings.put).toHaveBeenCalledWith('Protocols', 'vmess');
      expect(mockEnv.settings.put).toHaveBeenCalledWith('IncludeOriginalConfigs', 'yes');
      expect(mockEnv.settings.put).toHaveBeenCalledWith('IncludeMergedConfigs', 'yes');
      expect(response.status).toBe(302);
    });

    it('should validate password length when saving', async () => {
      const formData = new FormData();
      formData.append('save', 'save');
      formData.append('password', '123'); // Too short
      formData.append('password_confirmation', '123');

      const mockRequest = {
        url: 'https://example.com/panel',
        formData: jest.fn().mockResolvedValue(Promise.resolve(formData)),
      } as any;

      // Mock that no password exists initially
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'token') return 'some_token';
            return null;
          },
        },
      }));

      const response = await PostPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('message=invalid-password');
    });

    it('should validate password confirmation when saving', async () => {
      const formData = new FormData();
      formData.append('save', 'save');
      formData.append('password', '123456');
      formData.append('password_confirmation', 'different_password');

      const mockRequest = {
        url: 'https://example.com/panel',
        formData: jest.fn().mockResolvedValue(Promise.resolve(formData)),
      } as any;

      // Mock that no password exists initially
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'token') return 'some_token';
            return null;
          },
        },
      }));

      const response = await PostPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('message=invalid-password');
    });

    it('should reset all settings when reset button is clicked', async () => {
      const formData = new FormData();
      formData.append('reset', 'reset');

      const mockRequest = {
        url: 'https://example.com/panel',
        formData: jest.fn().mockResolvedValue(Promise.resolve(formData)),
      } as any;

      // Mock that no password exists
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: jest.fn().mockReturnValue(null),
        },
      }));

      const response = await PostPanel(mockRequest, mockEnv as any);

      expect(mockEnv.settings.delete).toHaveBeenCalledWith('MaxConfigs');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('Protocols');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('ALPNs');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('FingerPrints');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('Providers');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('Countries');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('CleanDomainIPs');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('Configs');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('IncludeOriginalConfigs');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('IncludeMergedConfigs');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('UUID');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('Password');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('Token');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('BlockPorn');
      expect(mockEnv.settings.delete).toHaveBeenCalledWith('EnableFragments');
      expect(response.status).toBe(302);
    });

    it('should handle errors during save', async () => {
      const formData = new FormData();
      formData.append('save', 'save');

      const mockRequest = {
        url: 'https://example.com/panel',
        formData: jest.fn().mockResolvedValue(Promise.resolve(formData)),
      } as any;

      // Mock that no password exists
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      (mockEnv.settings.get as jest.Mock).mockResolvedValueOnce(null);
      mockURLConstructor.mockImplementationOnce(() => ({
        origin: 'https://example.com',
        hostname: 'test.example.com',
        searchParams: {
          get: (param: string) => {
            if (param === 'token') return 'some_token';
            return null;
          },
        },
      }));

      // Mock an error during saving
      (mockEnv.settings.put as jest.Mock).mockRejectedValueOnce(new Error('Save error'));

      const response = await PostPanel(mockRequest, mockEnv as any);
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('message=error');
    });
  });
});