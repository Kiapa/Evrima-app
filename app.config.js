import "dotenv/config";

export default ({ config }) => ({
  ...config,
  name: "Evrima",
  owner: "evrima_vehicle_tracking_service",
  slug: "evrima",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "evrima",
  userInterfaceStyle: "dark",

  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0A0A0A",
  },

  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.evrima.app",
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSCameraUsageDescription:
        "Evrima needs camera access to scan tracker barcodes",
      NSLocationWhenInUseUsageDescription:
        "Evrima uses your location to show you on the map",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Evrima uses your location to show you on the map",
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#0A0A0A",
    },
    package: "com.evrima.app",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    permissions: [
      "android.permission.CAMERA",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.RECEIVE_BOOT_COMPLETED",      // needed for notifications
      "android.permission.VIBRATE",
    ],
  },

  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-camera",
      {
        cameraPermission:
          "Evrima needs camera access to scan tracker barcodes",
      },
    ],
    [
      "expo-notifications",
      {
        // Use a real 96×96 PNG — plain white icon works fine for now
        icon: "./assets/images/notification-icon.png",
        color: "#00E5A0",
        sounds: [],
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: "35.0.0",
        },
        ios: {
          deploymentTarget: "15.1",
        },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    // Runtime env vars accessible via Constants.expoConfig.extra
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    wsUrl: process.env.EXPO_PUBLIC_WS_URL,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: "7c4029ec-1362-429c-95a6-c765e9cd7df5",
    },
  },
});