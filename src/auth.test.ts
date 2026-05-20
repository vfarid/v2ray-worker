import { GetLogin, PostLogin } from './auth';
import { GenerateToken, Delay } from './helpers';
import { Env } from './interfaces';

// Mock dependencies
jest.mock('./helpers', () => ({
  GenerateToken: jest.fn(),
  Delay: jest.fn(),
}));

describe('Auth Module', () => {
  let mockEnv: Env;
  let mockSettings: any;

  beforeEach(() => {
    mockSettings = {
      get: jest.fn(),
      put: jest.fn(),
    };
    mockEnv = {
      settings: mockSettings,
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GetLogin', () => {
    it('should return login form HTML without error message by default', async () => {
      const mockRequest = new Request('http://localhost:8787/login', {
        method: 'GET',
      });

      const response = await GetLogin(mockRequest, mockEnv);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(html).toContain('Enter password / کلمه‌ی عبور را وارد کنید:');
      expect(html).toContain('Password');
      expect(html).not.toContain('Invalid password');
    });

    it('should return login form HTML with error message when message=error in query params', async () => {
      const mockRequest = new Request('http://localhost:8787/login?message=error', {
        method: 'GET',
      });

      const response = await GetLogin(mockRequest, mockEnv);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(html).toContain('Invalid password / کلمه عبور معتبر نمی‌باشد!');
      expect(html).toContain('bg-danger');
    });

    it('should return login form HTML without error message when other message in query params', async () => {
      const mockRequest = new Request('http://localhost:8787/login?message=success', {
        method: 'GET',
      });

      const response = await GetLogin(mockRequest, mockEnv);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(html).not.toContain('Invalid password / کلمه عبور معتبر نمی‌باشد!');
    });
  });

  describe('PostLogin', () => {
    beforeEach(() => {
      (Delay as jest.MockedFunction<typeof Delay>).mockResolvedValue(undefined);
      (GenerateToken as jest.MockedFunction<typeof GenerateToken>).mockReturnValue('mocked-token-12345');
    });

    it('should redirect to home page with token when password is correct', async () => {
      // Mock bcrypt.compare to return true
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const mockRequest = new Request('http://localhost:8787/login', {
        method: 'POST',
      });
      
      // Mock form data
      Object.defineProperty(mockRequest, 'formData', {
        value: jest.fn().mockResolvedValue({
          get: (key: string) => key === 'password' ? 'correctPassword' : null,
        }),
      });

      mockSettings.get.mockResolvedValue('$2a$10$hashedpasswordmock');

      const response = await PostLogin(mockRequest, mockEnv);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/?token=mocked-token-12345');
      expect(mockSettings.put).toHaveBeenCalledWith('Token', 'mocked-token-12345');
      expect(Delay).toHaveBeenCalledWith(1000);
    });

    it('should redirect to login page with error message when password is incorrect', async () => {
      // Mock bcrypt.compare to return false
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false);

      const mockRequest = new Request('http://localhost:8787/login', {
        method: 'POST',
      });
      
      // Mock form data
      Object.defineProperty(mockRequest, 'formData', {
        value: jest.fn().mockResolvedValue({
          get: (key: string) => key === 'password' ? 'wrongPassword' : null,
        }),
      });

      mockSettings.get.mockResolvedValue('$2a$10$hashedpasswordmock');

      const response = await PostLogin(mockRequest, mockEnv);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/login?message=error');
      expect(mockSettings.put).not.toHaveBeenCalled();
      expect(Delay).toHaveBeenCalledWith(1000);
    });

    it('should handle case when no password is provided', async () => {
      // Mock bcrypt.compare to return false (since empty password won't match)
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false);

      const mockRequest = new Request('http://localhost:8787/login', {
        method: 'POST',
      });
      
      // Mock form data returning empty password
      Object.defineProperty(mockRequest, 'formData', {
        value: jest.fn().mockResolvedValue({
          get: (key: string) => key === 'password' ? '' : null,
        }),
      });

      mockSettings.get.mockResolvedValue('$2a$10$hashedpasswordmock');

      const response = await PostLogin(mockRequest, mockEnv);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/login?message=error');
      expect(mockSettings.put).not.toHaveBeenCalled();
      expect(Delay).toHaveBeenCalledWith(1000);
    });

    it('should handle case when no password is stored in settings', async () => {
      // Mock bcrypt.compare to return false (since there's no password to compare with)
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false);

      const mockRequest = new Request('http://localhost:8787/login', {
        method: 'POST',
      });
      
      // Mock form data
      Object.defineProperty(mockRequest, 'formData', {
        value: jest.fn().mockResolvedValue({
          get: (key: string) => key === 'password' ? 'anyPassword' : null,
        }),
      });

      mockSettings.get.mockResolvedValue(null); // No stored password

      const response = await PostLogin(mockRequest, mockEnv);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/login?message=error');
      expect(mockSettings.put).not.toHaveBeenCalled();
      expect(Delay).toHaveBeenCalledWith(1000);
    });

    it('should redirect with port in URL when not using HTTPS (port 443)', async () => {
      // Mock bcrypt.compare to return true
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const mockRequest = new Request('http://localhost:8080/login', {
        method: 'POST',
      });
      
      // Mock form data
      Object.defineProperty(mockRequest, 'formData', {
        value: jest.fn().mockResolvedValue({
          get: (key: string) => key === 'password' ? 'correctPassword' : null,
        }),
      });

      mockSettings.get.mockResolvedValue('$2a$10$hashedpasswordmock');

      const response = await PostLogin(mockRequest, mockEnv);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('http://localhost:8080/?token=mocked-token-12345');
      expect(Delay).toHaveBeenCalledWith(1000);
    });

    it('should not include port in URL when using HTTPS (port 443)', async () => {
      // Mock bcrypt.compare to return true
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const mockRequest = new Request('https://localhost:443/login', {
        method: 'POST',
      });
      
      // Mock form data
      Object.defineProperty(mockRequest, 'formData', {
        value: jest.fn().mockResolvedValue({
          get: (key: string) => key === 'password' ? 'correctPassword' : null,
        }),
      });

      mockSettings.get.mockResolvedValue('$2a$10$hashedpasswordmock');

      const response = await PostLogin(mockRequest, mockEnv);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('https://localhost/?token=mocked-token-12345');
      expect(response.headers.get('Location')).not.toContain(':443');
      expect(Delay).toHaveBeenCalledWith(1000);
    });
  });
});