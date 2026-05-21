import { ToRawSubscription, ToBase64Subscription } from './sub';
import { EncodeConfig } from './config';
import { Config } from './interfaces';

// Mock the EncodeConfig function since we're testing the subscription functions
jest.mock('./config', () => ({
  EncodeConfig: jest.fn((config: Config) => `encoded:${config.name}`),
}));

describe('Subscription functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ToRawSubscription', () => {
    it('should return an empty string when given an empty array', () => {
      const result = ToRawSubscription([]);
      expect(result).toBe('');
    });

    it('should join encoded configs with newlines', () => {
      const mockConfigs: Config[] = [
        { name: 'config1' },
        { name: 'config2' },
        { name: 'config3' },
      ];

      const result = ToRawSubscription(mockConfigs);
      
      expect(EncodeConfig).toHaveBeenCalledTimes(3);
      expect(result).toBe('encoded:config1\nencoded:config2\nencoded:config3');
    });

    it('should return a single encoded config without a trailing newline when given one config', () => {
      const mockConfig: Config = { name: 'single' };
      
      const result = ToRawSubscription([mockConfig]);
      
      expect(EncodeConfig).toHaveBeenCalledTimes(1);
      expect(result).toBe('encoded:single');
    });
  });

  describe('ToBase64Subscription', () => {
    it('should return an empty base64 string when given an empty array', () => {
      const result = ToBase64Subscription([]);
      expect(result).toBe(''); // base64 of empty string is empty string
    });

    it('should return base64 encoded string of joined configs', () => {
      const mockConfigs: Config[] = [
        { name: 'config1' },
        { name: 'config2' },
      ];

      const result = ToBase64Subscription(mockConfigs);
      
      const expectedRaw = 'encoded:config1\nencoded:config2';
      const expectedBase64 = Buffer.from(expectedRaw, 'utf-8').toString('base64');
      
      expect(EncodeConfig).toHaveBeenCalledTimes(2);
      expect(result).toBe(expectedBase64);
    });

    it('should handle a single config correctly', () => {
      const mockConfig: Config = { name: 'single' };
      
      const result = ToBase64Subscription([mockConfig]);
      
      const expectedRaw = 'encoded:single';
      const expectedBase64 = Buffer.from(expectedRaw, 'utf-8').toString('base64');
      
      expect(result).toBe(expectedBase64);
    });
  });
});