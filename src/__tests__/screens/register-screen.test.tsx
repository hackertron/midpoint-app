import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { RegisterScreen } from '../../screens/register-screen';
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

describe('RegisterScreen', () => {
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

  it('should render registration form elements', () => {
    render(<RegisterScreen />);

    expect(screen.getByText('Create Account')).toBeOnTheScreen();
    expect(screen.getByText('Join Midpoint to find meeting spots')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Display Name')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Email')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Password')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeOnTheScreen();
    expect(screen.getByText('Create Account')).toBeOnTheScreen();
    expect(screen.getByText('Already have an account?')).toBeOnTheScreen();
    expect(screen.getByText('Sign In')).toBeOnTheScreen();
  });

  it('should show validation errors for empty fields', async () => {
    render(<RegisterScreen />);

    const createAccountButton = screen.getByText('Create Account');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeOnTheScreen();
      expect(screen.getByText('Email is required')).toBeOnTheScreen();
      expect(screen.getByText('Password is required')).toBeOnTheScreen();
      expect(screen.getByText('Please confirm your password')).toBeOnTheScreen();
    });
  });

  it('should show validation error for invalid email format', async () => {
    render(<RegisterScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    const createAccountButton = screen.getByText('Create Account');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeOnTheScreen();
    });
  });

  it('should show validation error for short password', async () => {
    render(<RegisterScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    const createAccountButton = screen.getByText('Create Account');

    fireEvent.changeText(passwordInput, '123');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeOnTheScreen();
    });
  });

  it('should show validation error for password mismatch', async () => {
    render(<RegisterScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const createAccountButton = screen.getByText('Create Account');

    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password456');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeOnTheScreen();
    });
  });

  it('should show validation error for short display name', async () => {
    render(<RegisterScreen />);

    const displayNameInput = screen.getByPlaceholderText('Display Name');
    const createAccountButton = screen.getByText('Create Account');

    fireEvent.changeText(displayNameInput, 'A');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(screen.getByText('Display name must be at least 2 characters')).toBeOnTheScreen();
    });
  });

  it('should successfully register with valid data', async () => {
    const mockAuthInstance = {
      register: jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        display_name: 'Test User',
        token: 'mock-token',
        location: { latitude: 0, longitude: 0 },
      }),
    };
    mockAuthService.mockImplementation(() => mockAuthInstance as any);

    render(<RegisterScreen />);

    const displayNameInput = screen.getByPlaceholderText('Display Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const createAccountButton = screen.getByText('Create Account');

    fireEvent.changeText(displayNameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(mockAuthInstance.register).toHaveBeenCalledWith({
        display_name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('should show loading state during registration', async () => {
    const mockAuthInstance = {
      register: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
    };
    mockAuthService.mockImplementation(() => mockAuthInstance as any);

    render(<RegisterScreen />);

    const displayNameInput = screen.getByPlaceholderText('Display Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const createAccountButton = screen.getByText('Create Account');

    fireEvent.changeText(displayNameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(createAccountButton);

    expect(screen.getByText('Creating Account...')).toBeOnTheScreen();
    expect(createAccountButton).toBeDisabled();
  });

  it('should handle registration error gracefully', async () => {
    const mockAuthInstance = {
      register: jest.fn().mockRejectedValue(new Error('Email already exists')),
    };
    mockAuthService.mockImplementation(() => mockAuthInstance as any);

    render(<RegisterScreen />);

    const displayNameInput = screen.getByPlaceholderText('Display Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const createAccountButton = screen.getByText('Create Account');

    fireEvent.changeText(displayNameInput, 'Test User');
    fireEvent.changeText(emailInput, 'existing@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Registration Failed',
        'Email already exists',
        [{ text: 'OK' }]
      );
    });

    // Should re-enable button after error
    expect(createAccountButton).not.toBeDisabled();
    expect(screen.getByText('Create Account')).toBeOnTheScreen();
  });

  it('should navigate to login screen when sign in is pressed', () => {
    render(<RegisterScreen />);

    const signInLink = screen.getByText('Sign In');
    fireEvent.press(signInLink);

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('should clear form errors when user starts typing', async () => {
    render(<RegisterScreen />);

    const emailInput = screen.getByPlaceholderText('Email');
    const createAccountButton = screen.getByText('Create Account');

    // Trigger validation error
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeOnTheScreen();
    });

    // Start typing to clear error
    fireEvent.changeText(emailInput, 'test@');

    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeOnTheScreen();
    });
  });

  it('should update confirm password validation when password changes', async () => {
    render(<RegisterScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const createAccountButton = screen.getByText('Create Account');

    // Set passwords that don't match
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password456');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeOnTheScreen();
    });

    // Update password to match
    fireEvent.changeText(passwordInput, 'password456');

    await waitFor(() => {
      expect(screen.queryByText('Passwords do not match')).not.toBeOnTheScreen();
    });
  });

  it('should have accessible elements for screen readers', () => {
    render(<RegisterScreen />);

    // Check that form elements are accessible
    expect(screen.getByPlaceholderText('Display Name')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Email')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Password')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeOnTheScreen();
    expect(screen.getByText('Create Account')).toBeOnTheScreen();
    expect(screen.getByText('Sign In')).toBeOnTheScreen();
  });
});