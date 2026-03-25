import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTRPC } from '@/lib/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Checkbox, PriorityBadge, EmptyState } from '@/components/ui';
import { Plus, CheckSquare } from 'lucide-react-native';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { usePracticeSession } from '@/components/practice-session';

export default function TodoListScreen(): React.ReactElement {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const { openSession } = usePracticeSession();

  // Generate dates for the horizontal date picker (current week)
  const weekDates = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const todoQuery = useQuery(
    trpc.todoList.list.queryOptions(selectedDate),
  );

  const completeMutation = useMutation(
    trpc.task.completeWithMetricUpdate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.todoList.list.queryKey() });
      },
    }),
  );

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trpc.todoList.list.queryKey() });
  }, [queryClient, trpc]);

  // Find tasks for the selected date
  const todaysTasks = useMemo(() => {
    const days = todoQuery.data ?? [];
    const matchingDay = days.find((day) =>
      isSameDay(new Date(day.date), selectedDate),
    );
    return matchingDay?.tasks ?? [];
  }, [todoQuery.data, selectedDate]);

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Horizontal Date Picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        className="border-b border-gray-200 dark:border-gray-700"
      >
        {weekDates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => setSelectedDate(date)}
              className={`items-center px-3 py-2 mx-1 rounded-xl min-w-[48px] ${
                isSelected
                  ? 'bg-emerald-500'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  isSelected
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {format(date, 'EEE')}
              </Text>
              <Text
                className={`text-lg font-bold mt-0.5 ${
                  isSelected
                    ? 'text-white'
                    : isToday
                      ? 'text-emerald-500'
                      : 'text-gray-900 dark:text-white'
                }`}
              >
                {format(date, 'd')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Task List */}
      <FlatList
        data={todaysTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={todoQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor="#2DB88A"
          />
        }
        renderItem={({ item }) => (
          <Pressable
            className="mb-2"
            onPress={() => router.push(`/task/${item.id}`)}
          >
            <Card>
              <View className="flex-row items-start">
                <Checkbox
                  checked={item.completed}
                  onToggle={() => {
                    if (!item.completed && item.subSkillId) {
                      openSession(
                        { id: item.id, name: item.name, subSkillId: item.subSkillId },
                        selectedDate,
                      );
                    } else {
                      completeMutation.mutate({
                        id: item.id,
                        completed: !item.completed,
                        occurrenceDate: selectedDate,
                      });
                    }
                  }}
                />
                <View className="flex-1 ml-3">
                  <Text
                    className={`text-base font-medium ${
                      item.completed
                        ? 'text-gray-400 line-through'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {item.name}
                  </Text>
                  <View className="flex-row items-center mt-1 gap-2">
                    {item.skillColor ? (
                      <View className="flex-row items-center">
                        <View
                          className="w-2.5 h-2.5 rounded-full mr-1"
                          style={{ backgroundColor: item.skillColor }}
                        />
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          {item.skillName}
                        </Text>
                      </View>
                    ) : null}
                    <PriorityBadge priority={item.priority} />
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          todoQuery.isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#2DB88A" size="large" />
            </View>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="No tasks for this day"
              description="Tap + to add a task"
            />
          )
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/task/new')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={28} color="white" />
      </Pressable>
    </View>
  );
}
