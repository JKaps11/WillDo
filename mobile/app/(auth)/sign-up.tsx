import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';

export default function SignUpScreen(): React.ReactElement {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUp = useCallback(async () => {
    if (!isLoaded) return;
    setError('');
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, email, password]);

  const onVerify = useCallback(async () => {
    if (!isLoaded) return;
    setError('');
    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Verification failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, code, setActive, router]);

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white dark:bg-gray-900"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Verify Email
          </Text>
          <Text className="text-base text-center mb-8 text-gray-500 dark:text-gray-400">
            Enter the code sent to {email}
          </Text>

          {error ? (
            <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
              <Text className="text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="mb-6">
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-center tracking-widest bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="000000"
              placeholderTextColor="#9CA3AF"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <Pressable
            className="bg-emerald-500 rounded-lg py-3.5 items-center"
            onPress={onVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Verify</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          WillDo
        </Text>
        <Text className="text-base text-center mb-8 text-gray-500 dark:text-gray-400">
          Create your account
        </Text>

        {error ? (
          <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
            <Text className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </Text>
          </View>
        ) : null}

        <View className="mb-4">
          <Text className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Email
          </Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="email@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Password
          </Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        <Pressable
          className="bg-emerald-500 rounded-lg py-3.5 items-center mb-4"
          onPress={onSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Sign Up
            </Text>
          )}
        </Pressable>

        <View className="flex-row justify-center">
          <Text className="text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <Text className="text-emerald-500 font-semibold">Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
