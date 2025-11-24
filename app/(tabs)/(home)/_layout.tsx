
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: Platform.OS === 'ios', // Show header on iOS with NativeTabs, hide on Android/Web
          title: 'Home'
        }}
      />
      <Stack.Screen
        name="job/[id]"
        options={{
          headerShown: true,
          title: 'Job Details',
          presentation: 'card'
        }}
      />
    </Stack>
  );
}
