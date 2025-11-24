
import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  // No tabs - just stack navigation
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen key="home" name="(home)" />
    </Stack>
  );
}
