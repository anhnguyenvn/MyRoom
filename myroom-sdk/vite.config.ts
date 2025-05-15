import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      include: "**/*/tsx",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
     watch: {
      usePolling: true,
    },
    port: 5173,
    host: true,
    open: true,
  },
});
