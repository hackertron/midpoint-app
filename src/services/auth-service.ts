import * as SecureStore from 'expo-secure-store';
import { CreateUserRequest, LoginUserRequest, UserResponse, UserUpdateRequest } from '../types/api.types';
import { ApiClient } from '../utils/api-client';

const AUTH_TOKEN_KEY = 'auth_token';

export class AuthService {
  private validateUserData(data: CreateUserRequest | LoginUserRequest): void {
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }
    
    if ('display_name' in data && !data.display_name) {
      throw new Error('Display name is required');
    }
  }

  async register(userData: CreateUserRequest): Promise<UserResponse> {
    this.validateUserData(userData);

    const user = await ApiClient.request<UserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store the JWT token securely
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, user.token);
    
    return user;
  }

  async login(credentials: LoginUserRequest): Promise<UserResponse> {
    this.validateUserData(credentials);

    const user = await ApiClient.request<UserResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store the JWT token securely
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, user.token);
    
    return user;
  }

  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      // Silently handle case where token doesn't exist
      console.warn('No token to delete during logout');
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return token !== null;
  }

  async updateUserLocation(userId: number, locationData: UserUpdateRequest): Promise<UserResponse> {
    const token = await this.getStoredToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const user = await ApiClient.authenticatedRequest<UserResponse>(
      `/users/${userId}`,
      token,
      {
        method: 'POST',
        body: JSON.stringify(locationData),
      }
    );
    
    // Update stored token with the new one
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, user.token);
    
    return user;
  }
}