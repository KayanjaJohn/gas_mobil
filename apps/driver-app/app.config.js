import "dotenv/config";

const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.VITE_GOOGLE_MAPS_API_KEY;

export default ({ config }) => ({
  ...config,
  owner: "gasmobil-uganda",
  android: {
    ...config.android,
    ...(googleMapsApiKey
      ? {
          config: {
            ...config.android?.config,
            googleMaps: {
              ...config.android?.config?.googleMaps,
              apiKey: googleMapsApiKey,
            },
          },
        }
      : {}),
  },
  plugins: [...(config.plugins || []), "expo-notifications"],
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: "f08f487f-63c6-4116-872a-3ce9f5917c8b",
    },
  },
});
