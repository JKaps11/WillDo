import { Stack } from 'expo-router';

export default function SkillsLayout(): React.ReactElement {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#1A1B2E',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Skills Hub',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Skill Detail',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Skill',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
