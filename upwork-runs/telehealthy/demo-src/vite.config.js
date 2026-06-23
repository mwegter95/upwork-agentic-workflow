import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "/demos/telehealthy/",
  build: {
    outDir: "../../../../michaelwegter.com/public/demos/telehealthy",
    emptyOutDir: true,
  },
});
