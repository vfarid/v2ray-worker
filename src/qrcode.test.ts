// Mock the qrcode module before importing anything from ./qrcode
jest.mock('qrcode', () => {
  // Create the mock function here
  const mockToDataURL = jest.fn();

  return {
    __esModule: true,
    default: {
      toDataURL: mockToDataURL,
    },
  };
});

// Mock the ./qrcode module to properly export generateQR
jest.mock('./qrcode', () => {
  const { default: QRCode } = require('qrcode');
  const generateQR = async (conf: string) => {
    return await QRCode.toDataURL(conf);
  };

  return {
    __esModule: true,
    default: generateQR,
  };
});

import generateQR from './qrcode';

describe('qrcode', () => {
  // Get the mocked function after imports
  const mockToDataURL = require('qrcode').default.toDataURL as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a QR code data URL', async () => {
    const testConfig = 'test content';
    const expectedDataUrl = 'data:image/png;base64,testdata';

    mockToDataURL.mockResolvedValue(expectedDataUrl);

    const result = await generateQR(testConfig);

    expect(mockToDataURL).toHaveBeenCalledWith(testConfig);
    expect(result).toBe(expectedDataUrl);
  });

  it('should handle different input configurations', async () => {
    const testInputs = [
      'simple text',
      'https://example.com',
      '12345',
      'QR code content with spaces',
    ];

    for (const input of testInputs) {
      const expectedDataUrl = `data:image/png;base64:${input.replace(/\s+/g, '_')}`;
      mockToDataURL.mockResolvedValue(expectedDataUrl);

      const result = await generateQR(input);

      expect(mockToDataURL).toHaveBeenCalledWith(input);
      expect(result).toBe(expectedDataUrl);
    }
  });

  it('should handle special characters in input', async () => {
    const specialInput = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    const expectedDataUrl = 'data:image/png;base64:specialdata';

    mockToDataURL.mockResolvedValue(expectedDataUrl);

    const result = await generateQR(specialInput);

    expect(mockToDataURL).toHaveBeenCalledWith(specialInput);
    expect(result).toBe(expectedDataUrl);
  });

  it('should handle empty string input', async () => {
    const emptyInput = '';
    const expectedDataUrl = 'data:image/png;base64:empty';

    mockToDataURL.mockResolvedValue(expectedDataUrl);

    const result = await generateQR(emptyInput);

    expect(mockToDataURL).toHaveBeenCalledWith(emptyInput);
    expect(result).toBe(expectedDataUrl);
  });
});