import { Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { LayoutDashboard, CheckSquare, BookOpen, Settings } from 'lucide-react-native';

const TAB_ICON_SIZE = 24;
const ACTIVE_COLOR = '#2DB88A';
const INACTIVE_COLOR = '#71717A';

export default function TabLayout(): React.ReactElement {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E4E4E7',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#1A1B2E',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={TAB_ICON_SIZE} color={color} />
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              style={{ marginRight: 16 }}
            >
              <Settings size={22} color={INACTIVE_COLOR} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="todolist"
        options={{
          title: 'Todo List',
          tabBarIcon: ({ color }) => (
            <CheckSquare size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <BookOpen size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
