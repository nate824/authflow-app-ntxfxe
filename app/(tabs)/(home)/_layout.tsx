
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { KeyboardProvider } from 'react-native-keyboard-controller';

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
