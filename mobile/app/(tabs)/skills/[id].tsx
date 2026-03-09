import { useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTRPC } from '@/lib/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, StageBadge, ProgressBar, Checkbox, EmptyState } from '@/components/ui';
import { ChevronRight, Plus, BookOpen } from 'lucide-react-native';
import type { EnrichedSubSkill } from '@willdo/shared';

export default function SkillDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const skillQuery = useQuery(trpc.skill.get.queryOptions({ id: id! }));

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trpc.skill.get.queryKey() });
  }, [queryClient, trpc]);

  const skill = skillQuery.data;

  if (skillQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator color="#2DB88A" size="large" />
      </View>
    );
  }

  if (!skill) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Skill not found"
        description="This skill may have been deleted"
      />
    );
  }

  const sections = (skill.subSkills as Array<EnrichedSubSkill>).map(
    (subSkill) => ({
      subSkill,
      data: subSkill.metrics,
    }),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: skill.name,
          headerStyle: { backgroundColor: skill.color },
          headerTintColor: '#FFFFFF',
        }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={skillQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor="#2DB88A"
          />
        }
        ListHeaderComponent={
          <View className="px-4 pt-4 pb-2">
            {/* Skill Info */}
            <Card className="mb-4">
              {skill.description ? (
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {skill.description}
                </Text>
              ) : null}
              {skill.goal ? (
                <View>
                  <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Goal
                  </Text>
                  <Text className="text-sm text-gray-900 dark:text-white">
                    {skill.goal}
                  </Text>
                </View>
              ) : null}
            </Card>

            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sub-Skills ({skill.subSkills.length})
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View className="px-4 mt-2 mb-1">
            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">
                    {section.subSkill.name}
                  </Text>
                  {section.subSkill.description ? (
                    <Text
                      className="text-sm text-gray-500 dark:text-gray-400 mt-0.5"
                      numberOfLines={2}
                    >
                      {section.subSkill.description}
                    </Text>
                  ) : null}
                </View>
                <StageBadge stage={section.subSkill.stage} />
              </View>

              {/* Metrics */}
              {section.data.length > 0 ? (
                <View className="mt-3 gap-2">
                  {section.data.map((metric) => (
                    <ProgressBar
                      key={metric.id}
                      progress={
                        metric.targetValue > 0
                          ? (metric.currentValue / metric.targetValue) * 100
                          : 0
                      }
                      label={`${metric.name}${metric.unit ? ` (${metric.unit})` : ''}: ${metric.currentValue}/${metric.targetValue}`}
                    />
                  ))}
                </View>
              ) : null}
            </Card>
          </View>
        )}
        renderItem={() => null}
        ListEmptyComponent={
          <View className="px-4">
            <EmptyState
              title="No sub-skills"
              description="This skill doesn't have any sub-skills yet"
            />
          </View>
        }
      />
    </>
  );
}
