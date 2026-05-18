export default {
  "expo": {
    "name": "evrima",
    "owner": "evrima_vehicle_tracking_service",
    "slug": "evrima",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "evrima",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.evrima.app",
      "config": {
        "googleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      },
      "infoPlist": {
        "NSCameraUsageDescription": "Evrima needs camera access to scan tracker barcodes",
        "NSLocationWhenInUseUsageDescription": "Evrima uses your location to show you on the map"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0A0A0A"
      },
      "package": "com.evrima.app",
      "config": {
        "googleMaps": {
          "apiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-camera",
        {
          "cameraPermission": "Evrima needs camera access to scan tracker barcodes"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#00E5A0"
        }
      ]
    ],
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "extra": {
      "eas": {
        "projectId": "7c4029ec-1362-429c-95a6-c765e9cd7df5"
      }
    }
  }
};