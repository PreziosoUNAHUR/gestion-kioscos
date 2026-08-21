import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IconName = 'home' | 'grid' | 'stats-chart';

function TabCircle({
  name,
  color,
  focused,
}: {
  name: IconName;
  color: string;
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: focused ? '#6C5CE7' : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: focused ? 0.2 : 0.06,
        shadowRadius: 6,
        elevation: focused ? 4 : 1,
      }}>
      <Ionicons name={name} size={26} color={focused ? '#FFFFFF' : color} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarButton: HapticTab,
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: '#6C5CE7',
        tabBarInactiveTintColor: '#ADB5BD',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          height: 78,
          paddingTop: 6,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          paddingBottom: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabCircle name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="acciones"
        options={{
          title: 'Acciones',
          tabBarIcon: ({ color, focused }) => (
            <TabCircle name="grid" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <TabCircle name="stats-chart" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}