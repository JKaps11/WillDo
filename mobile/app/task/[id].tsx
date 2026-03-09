import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTRPC } from '@/lib/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, PriorityBadge } from '@/components/ui';
import { Trash2 } from 'lucide-react-native';
import type { Priority } from '@willdo/shared';

const PRIORITIES: Array<{ value: Priority; label: string; color: string }> = [
  { value: 'Very_Low', label: 'Very Low', color: '#9CA3AF' },
  { value: 'Low', label: 'Low', color: '#3B82F6' },
  { value: 'Medium', label: 'Medium', color: '#F59E0B' },
  { value: 'High', label: 'High', color: '#F97316' },
  { value: 'Very_High', label: 'Very High', color: '#EF4444' },
];

export default function EditTaskScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const taskQuery = useQuery(trpc.task.get.queryOptions({ id: id! }));

  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'Medium' as Priority,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskQuery.data) {
      setForm({
        name: taskQuery.data.name,
        description: taskQuery.data.description ?? '',
        priority: taskQuery.data.priority,
      });
    }
  }, [taskQuery.data]);

  const updateMutation = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todoList.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.dashboard.getTodaysTasks.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.task.get.queryKey() });
        router.back();
      },
      onError: (err) => {
        setError(err.message);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todoList.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.dashboard.getTodaysTasks.queryKey() });
        router.back();
      },
    }),
  );

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      setError('Task name is required');
      return;
    }
    setError('');
    updateMutation.mutate({
      id: id!,
      name: form.name.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
    });
  }, [form, id, updateMutation]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Task', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate({ id: id! }),
      },
    ]);
  }, [id, deleteMutation]);

  if (taskQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator color="#2DB88A" size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Task',
          presentation: 'modal',
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={8}>
              <Trash2 size={20} color="#EF4444" />
            </Pressable>
          ),
        }}
      />
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
            label="Task Name *"
            value={form.name}
            onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
          />

          <Input
            label="Description"
            value={form.description}
            onChangeText={(description) =>
              setForm((prev) => ({ ...prev, description }))
            }
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Priority Picker */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Priority
            </Text>
            <View className="flex-row gap-2">
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() =>
                    setForm((prev) => ({ ...prev, priority: p.value }))
                  }
                  className={`flex-1 py-2 rounded-lg items-center border ${
                    form.priority === p.value
                      ? 'border-emerald-500'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <View
                    className="w-3 h-3 rounded-full mb-1"
                    style={{ backgroundColor: p.color }}
                  />
                  <Text className="text-xs text-gray-700 dark:text-gray-300">
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button
            title="Save Changes"
            onPress={handleSubmit}
            loading={updateMutation.isPending}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
