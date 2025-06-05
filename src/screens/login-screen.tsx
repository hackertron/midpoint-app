import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthService } from '../services/auth-service';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const authService = new AuthService();

  const {
    control,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await authService.login(data);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'An error occurred',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData) => (text: string) => {
    if (errors[field]) {
      clearErrors(field);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#fff',
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1f2937' }}>
            Welcome Back
          </Text>
          <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 8 }}>
            Sign in to continue to Midpoint
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Controller
            name="email"
            control={control}
            render={({ field: { onChange, value } }) => (
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: errors.email ? '#ef4444' : '#d1d5db',
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 16,
                    backgroundColor: '#f9fafb',
                  }}
                  placeholder="Email"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    handleInputChange('email')(text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  accessibilityHint="Enter your email address"
                />
                {errors.email && (
                  <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                    {errors.email.message}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field: { onChange, value } }) => (
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: errors.password ? '#ef4444' : '#d1d5db',
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 16,
                    backgroundColor: '#f9fafb',
                  }}
                  placeholder="Password"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    handleInputChange('password')(text);
                  }}
                  secureTextEntry
                  autoComplete="password"
                  accessibilityHint="Enter your password"
                />
                {errors.password && (
                  <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
                    {errors.password.message}
                  </Text>
                )}
              </View>
            )}
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
          }}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          accessibilityRole="button"
        >
          {isLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Signing In...
              </Text>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#6b7280', fontSize: 16 }}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/register')}
            accessibilityRole="button"
          >
            <Text style={{ color: '#3b82f6', fontSize: 16, fontWeight: '600' }}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}