import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';

function TabCircle({ focused, icon, color }: { focused: boolean; icon: React.ReactNode; color: string }) {
  return (
    <View
      style={[
        styles.circle,
        focused
          ? { backgroundColor: '#2547F4', shadowOpacity: 0.35, elevation: 8 }
          : { backgroundColor: '#FFFFFF', shadowOpacity: 0.06, elevation: 1 },
      ]}>
      {icon}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarActiveTintColor: '#2547F4',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabCircle
              focused={!!focused}
              color={color}
              icon={<Feather name="home" size={22} color={focused ? '#FFFFFF' : color} />}
            />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen
        name="acciones"
        options={{
          title: 'Acciones',
          tabBarIcon: ({ color, focused }) => (
            <TabCircle
              focused={!!focused}
              color={color}
              icon={<Ionicons name="grid" size={22} color={focused ? '#FFFFFF' : color} />}
            />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color, focused }) => (
            <TabCircle
              focused={!!focused}
              color={color}
              icon={<Feather name="bar-chart-2" size={22} color={focused ? '#FFFFFF' : color} />}
            />
          ),
          tabBarButton: HapticTab,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    position: 'absolute',
  },
  tabBarLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    fontWeight: '600',
    paddingBottom: 2,
  },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -14,
    shadowColor: '#2547F4',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
  },
});