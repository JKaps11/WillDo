import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTRPC } from '@/lib/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, ProgressBar, EmptyState } from '@/components/ui';
import { Plus, BookOpen, Archive } from 'lucide-react-native';
import type { SkillWithSubSkills } from '@willdo/shared';

export default function SkillsHubScreen(): React.ReactElement {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);

  const skillsQuery = useQuery(
    trpc.skill.list.queryOptions({ includeArchived: showArchived }),
  );

  const archiveMutation = useMutation(
    trpc.skill.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.skill.list.queryKey() });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.skill.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.skill.list.queryKey() });
      },
    }),
  );

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trpc.skill.list.queryKey() });
  }, [queryClient, trpc]);

  const handleLongPress = useCallback(
    (skill: SkillWithSubSkills) => {
      Alert.alert(skill.name, 'Choose an action', [
        {
          text: skill.archived ? 'Unarchive' : 'Archive',
          onPress: () =>
            archiveMutation.mutate({
              id: skill.id,
              archived: !skill.archived,
            }),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Delete Skill',
              `Are you sure you want to delete "${skill.name}"? This cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteMutation.mutate({ id: skill.id }),
                },
              ],
            ),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [archiveMutation, deleteMutation],
  );

  const skills = (skillsQuery.data ?? []) as Array<SkillWithSubSkills>;

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Archive Toggle */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {skills.length} skill{skills.length !== 1 ? 's' : ''}
        </Text>
        <Pressable
          onPress={() => setShowArchived(!showArchived)}
          className="flex-row items-center"
        >
          <Archive
            size={16}
            color={showArchived ? '#2DB88A' : '#71717A'}
          />
          <Text
            className={`text-sm ml-1 ${
              showArchived ? 'text-emerald-500' : 'text-gray-500'
            }`}
          >
            Archived
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={skills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={skillsQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor="#2DB88A"
          />
        }
        renderItem={({ item }) => {
          const totalSubs = item.subSkills.length;
          const completedSubs = item.subSkills.filter(
            (s) => s.stage === 'complete',
          ).length;
          const progress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;

          return (
            <Pressable
              className="mb-3"
              onPress={() => router.push(`/(tabs)/skills/${item.id}`)}
              onLongPress={() => handleLongPress(item)}
            >
              <Card>
                <View className="flex-row items-center mb-2">
                  <View
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <Text className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                    {item.name}
                  </Text>
                  {item.archived ? (
                    <Archive size={16} color="#9CA3AF" />
                  ) : null}
                </View>
                {item.description ? (
                  <Text
                    className="text-sm text-gray-500 dark:text-gray-400 mb-2"
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}
                <ProgressBar
                  progress={progress}
                  label={`${completedSubs}/${totalSubs} sub-skills`}
                  showPercentage
                />
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          skillsQuery.isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#2DB88A" size="large" />
            </View>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No skills yet"
              description="Create your first skill to start learning"
            />
          )
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/(tabs)/skills/new')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={28} color="white" />
      </Pressable>
    </View>
  );
}
