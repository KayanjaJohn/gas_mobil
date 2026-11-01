import "dotenv/config";

export default ({ config }) => ({
  ...config,
  owner: "gasmobil-uganda",
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: {
      projectId: "f08f487f-63c6-4116-872a-3ce9f5917c8b",
    },
  },
});
