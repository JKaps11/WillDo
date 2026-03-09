import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTRPC } from '@/lib/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, ColorPicker } from '@/components/ui';

export default function NewSkillScreen(): React.ReactElement {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    goal: '',
  });
  const [error, setError] = useState('');

  const createMutation = useMutation(
    trpc.skill.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.skill.list.queryKey() });
        router.back();
      },
      onError: (err) => {
        setError(err.message);
      },
    }),
  );

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      color: form.color,
      icon: form.icon.trim() || undefined,
      goal: form.goal.trim() || undefined,
    });
  }, [form, createMutation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
            <Text className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </Text>
          </View>
        ) : null}

        <Input
          label="Skill Name *"
          placeholder="e.g., Piano, Spanish, React"
          value={form.name}
          onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
          autoFocus
        />

        <Input
          label="Description"
          placeholder="What do you want to learn?"
          value={form.description}
          onChangeText={(description) =>
            setForm((prev) => ({ ...prev, description }))
          }
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Input
          label="Goal"
          placeholder="e.g., Play Moonlight Sonata by December"
          value={form.goal}
          onChangeText={(goal) => setForm((prev) => ({ ...prev, goal }))}
        />

        <View className="mb-4">
          <Text className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Color
          </Text>
          <ColorPicker
            value={form.color}
            onChange={(color) => setForm((prev) => ({ ...prev, color }))}
          />
        </View>

        <Button
          title="Create Skill"
          onPress={handleSubmit}
          loading={createMutation.isPending}
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
