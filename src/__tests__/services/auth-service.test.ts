import { AuthService } from '../../services/auth-service';
import { CreateUserRequest, LoginUserRequest, UserResponse } from '../../types/api.types';
import * as SecureStore from 'expo-secure-store';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockRequest: CreateUserRequest = {
        email: 'test@example.com',
        display_name: 'Test User',
        password: 'password123',
      };

      const mockResponse: UserResponse = {
        id: 1,
        email: 'test@example.com',
        display_name: 'Test User',
        token: 'mock-jwt-token',
        location: {
          latitude: 0,
          longitude: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.register(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });
    });

    it('should handle registration errors', async () => {
      const mockRequest: CreateUserRequest = {
        email: 'existing@example.com',
        display_name: 'Existing User',
        password: 'password123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ status: 409, message: 'Email already exists' }),
      } as Response);

      await expect(authService.register(mockRequest)).rejects.toThrow('Email already exists');
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        email: '',
        display_name: '',
        password: '',
      } as CreateUserRequest;

      await expect(authService.register(invalidRequest)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const mockRequest: LoginUserRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse: UserResponse = {
        id: 1,
        email: 'test@example.com',
        display_name: 'Test User',
        token: 'mock-jwt-token',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.login(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });
    });

    it('should handle invalid credentials', async () => {
      const mockRequest: LoginUserRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ status: 401, message: 'Invalid password' }),
      } as Response);

      await expect(authService.login(mockRequest)).rejects.toThrow('Invalid password');
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      const mockRequest: LoginUserRequest = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ status: 404, message: 'User not found' }),
      } as Response);

      await expect(authService.login(mockRequest)).rejects.toThrow('User not found');
    });
  });

  describe('logout', () => {
    it('should clear stored token on logout', async () => {
      await authService.logout();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should handle logout gracefully even if no token exists', async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValueOnce(new Error('Item not found'));

      await expect(authService.logout()).resolves.not.toThrow();
    });
  });

  describe('getStoredToken', () => {
    it('should return stored token', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('stored-jwt-token');

      const token = await authService.getStoredToken();

      expect(token).toBe('stored-jwt-token');
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should return null when no token is stored', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const token = await authService.getStoredToken();

      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('stored-jwt-token');

      const isAuth = await authService.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false when no token exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const isAuth = await authService.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });

  describe('updateUserLocation', () => {
    it('should update user location successfully', async () => {
      const userId = 1;
      const locationUpdate = {
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      };

      const mockResponse: UserResponse = {
        id: 1,
        email: 'test@example.com',
        display_name: 'Test User',
        token: 'updated-jwt-token',
        location: locationUpdate.location,
      };

      mockSecureStore.getItemAsync.mockResolvedValue('current-jwt-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 202,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.updateUserLocation(userId, locationUpdate);

      expect(result).toEqual(mockResponse);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'updated-jwt-token');
      expect(mockFetch).toHaveBeenCalledWith(`http://localhost:3000/v1/users/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer current-jwt-token',
        },
        body: JSON.stringify(locationUpdate),
      });
    });

    it('should handle unauthorized user location update', async () => {
      const userId = 2;
      const locationUpdate = {
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      };

      mockSecureStore.getItemAsync.mockResolvedValue('current-jwt-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ status: 403, message: 'You are not allowed to update this user\'s data' }),
      } as Response);

      await expect(authService.updateUserLocation(userId, locationUpdate)).rejects.toThrow(
        'You are not allowed to update this user\'s data'
      );
    });

    it('should throw error when no auth token available', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const userId = 1;
      const locationUpdate = {
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      };

      await expect(authService.updateUserLocation(userId, locationUpdate)).rejects.toThrow(
        'No authentication token available'
      );
    });
  });
});