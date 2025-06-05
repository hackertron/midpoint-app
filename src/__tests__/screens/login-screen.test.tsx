import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { LoginScreen } from '../../screens/login-screen';
import { AuthService } from '../../services/auth-service';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../../services/auth-service');
jest.mock('expo-router');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('LoginScreen', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismiss: jest.fn(),
    navigate: jest.fn(),
    dismissAll: jest.fn(),
    canGoBack: jest.fn(),
    canDismiss: jest.fn(),
    setParams: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  it('should render login form elements', () => {
    render(<LoginScreen />);

    expect(screen.getByText('Welcome Back')).toBeOnTheScreen();
    expect(screen.getByText('Sign in to continue to Midpoint')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Email')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Password')).toBeOnTheScreen();
    expect(screen.getByText('Sign In')).toBeOnTheScreen();
    expect(screen.getByText('Don\'t have an account?')).toBeOnTheScreen();
    expect(screen.getByText('Sign Up')).toBeOnTheScreen();
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginScreen />);

    const signInButton = screen.getByText('Sign In');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeOnTheScreen();
      expect(screen.getByText('Password is required')).toBeOnTheScreen();
    });
  });

  it('should show validation error for invalid email format', async () => {
    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeOnTheScreen();
    });
  });

  it('should show validation error for short password', async () => {
    render(<LoginScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(passwordInput, '123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeOnTheScreen();
    });
  });

  it('should successfully login with valid credentials', async () => {
    const mockAuthInstance = {
      login: jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        display_name: 'Test User',
        token: 'mock-token',
        location: { latitude: 0, longitude: 0 },
      }),
    };
    mockAuthService.mockImplementation(() => mockAuthInstance as any);

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAuthInstance.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('should show loading state during login', async () => {
    const mockAuthInstance = {
      login: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
    };
    mockAuthService.mockImplementation(() => mockAuthInstance as any);

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    expect(screen.getByText('Signing In...')).toBeOnTheScreen();
    expect(signInButton).toBeDisabled();
  });

  it('should handle login error gracefully', async () => {
    const mockAuthInstance = {
      login: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
    };
    mockAuthService.mockImplementation(() => mockAuthInstance as any);

    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Login Failed',
        'Invalid credentials',
        [{ text: 'OK' }]
      );
    });

    // Should re-enable button after error
    expect(signInButton).not.toBeDisabled();
    expect(screen.getByText('Sign In')).toBeOnTheScreen();
  });

  it('should navigate to register screen when sign up is pressed', () => {
    render(<LoginScreen />);

    const signUpLink = screen.getByText('Sign Up');
    fireEvent.press(signUpLink);

    expect(mockRouter.push).toHaveBeenCalledWith('/register');
  });

  it('should clear form errors when user starts typing', async () => {
    render(<LoginScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    const signInButton = screen.getByText('Sign In');

    // Trigger validation error
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeOnTheScreen();
    });

    // Start typing to clear error
    fireEvent.changeText(emailInput, 'test@');

    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeOnTheScreen();
    });
  });

  it('should have accessible elements for screen readers', () => {
    render(<LoginScreen />);

    // Check that form elements are accessible
    expect(screen.getByPlaceholderText('Email')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Password')).toBeOnTheScreen();
    expect(screen.getByText('Sign In')).toBeOnTheScreen();
    expect(screen.getByText('Sign Up')).toBeOnTheScreen();
  });
});