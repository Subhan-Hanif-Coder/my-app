const productionApiUrl = "https://my-app-backend-jade.vercel.app";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:4000"
    : productionApiUrl);
