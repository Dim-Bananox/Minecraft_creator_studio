import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/mojang": {
        target: "https://api.mojang.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/mojang/, "")
      },
      "/session": {
        target: "https://sessionserver.mojang.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/session/, "")
      },
      "/textures": {
        target: "https://textures.minecraft.net",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/textures/, "")
      }
    }
  }
});
