import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTRPC } from '@/lib/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@/components/ui';
import { ChevronDown } from 'lucide-react-native';
import type { Priority } from '@willdo/shared';

const PRIORITIES: Array<{ value: Priority; label: string; color: string }> = [
  { value: 'Very_Low', label: 'Very Low', color: '#9CA3AF' },
  { value: 'Low', label: 'Low', color: '#3B82F6' },
  { value: 'Medium', label: 'Medium', color: '#F59E0B' },
  { value: 'High', label: 'High', color: '#F97316' },
  { value: 'Very_High', label: 'Very High', color: '#EF4444' },
];

export default function NewTaskScreen(): React.ReactElement {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'Medium' as Priority,
    subSkillId: '',
  });
  const [error, setError] = useState('');

  // Fetch skills to pick a sub-skill
  const skillsQuery = useQuery(
    trpc.skill.list.queryOptions({ includeArchived: false }),
  );

  const createMutation = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todoList.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.dashboard.getTodaysTasks.queryKey() });
        router.back();
      },
      onError: (err) => {
        setError(err.message);
      },
    }),
  );

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      setError('Task name is required');
      return;
    }
    if (!form.subSkillId) {
      setError('Please select a sub-skill');
      return;
    }
    setError('');
    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      subSkillId: form.subSkillId,
      todoListDate: new Date(),
    });
  }, [form, createMutation]);

  // Flatten skills -> sub-skills for picker
  const subSkillOptions = (skillsQuery.data ?? []).flatMap((skill: { id: string; name: string; color: string; subSkills: Array<{ id: string; name: string }> }) =>
    skill.subSkills.map((sub) => ({
      id: sub.id,
      name: `${skill.name} → ${sub.name}`,
      color: skill.color,
    })),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Task',
          presentation: 'modal',
          headerStyle: { backgroundColor: '#FFFFFF' },
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
            placeholder="What do you need to do?"
            value={form.name}
            onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
            autoFocus
          />

          <Input
            label="Description"
            placeholder="Add details..."
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

          {/* Sub-Skill Picker */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Sub-Skill *
            </Text>
            {subSkillOptions.length === 0 ? (
              <Text className="text-sm text-gray-400">
                No skills found. Create a skill first.
              </Text>
            ) : (
              <View className="gap-1">
                {subSkillOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() =>
                      setForm((prev) => ({ ...prev, subSkillId: option.id }))
                    }
                    className={`flex-row items-center px-3 py-2.5 rounded-lg border ${
                      form.subSkillId === option.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: option.color }}
                    />
                    <Text className="text-sm text-gray-900 dark:text-white flex-1">
                      {option.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Button
            title="Create Task"
            onPress={handleSubmit}
            loading={createMutation.isPending}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
