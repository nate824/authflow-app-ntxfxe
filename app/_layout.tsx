
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Initialize push notifications
  usePushNotifications();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    console.log(
      "Navigation check - Session:",
      !!session,
      "In auth group:",
      inAuthGroup,
      "Segments:",
      segments
    );

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      console.log("Redirecting to login...");
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated
      console.log("Redirecting to home...");
      router.replace("/(tabs)");
    }
  }, [session, segments, loading]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          title: "Standard Modal",
        }}
      />
      <Stack.Screen
        name="formsheet"
        options={{
          presentation: "formSheet",
          title: "Form Sheet Modal",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5, 0.8, 1.0],
          sheetCornerRadius: 20,
        }}
      />
      <Stack.Screen
        name="transparent-modal"
        options={{
          presentation: "transparentModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="job-details"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)",
      background: "rgb(245, 245, 245)",
      card: "rgb(255, 255, 255)",
      text: "rgb(51, 51, 51)",
      border: "rgb(224, 224, 224)",
      notification: "rgb(255, 59, 48)",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)",
      background: "rgb(28, 28, 30)",
      card: "rgb(44, 44, 46)",
      text: "rgb(255, 255, 255)",
      border: "rgb(58, 58, 60)",
      notification: "rgb(255, 69, 58)",
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <KeyboardProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
              <SystemBars style={"auto"} />
            </GestureHandlerRootView>
          </AuthProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </>
  );
}
