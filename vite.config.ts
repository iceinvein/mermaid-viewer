import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY
      ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
      : "/",
  plugins: [react(), tsconfigPaths(), tailwindcss()],
});
