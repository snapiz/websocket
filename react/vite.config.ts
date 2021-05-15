import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";
import fs from "fs-extra";

import { peerDependencies } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/lib.tsx"),
      name: "TimadaWebSocket",
    },
    rollupOptions: {
      external: Object.keys(peerDependencies),
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@react-keycloak/web": "KeycloakWeb",
        },
      },
    },
  },

  server: {
    host: "wss.timada.dev",
    port: 3002,
    https: {
      key: fs.readFileSync("../certs/tls.key"),
      cert: fs.readFileSync("../certs/tls.crt"),
    },
  },

  resolve: {
    alias: [
      { find: /^(lib)/, replacement: "/src/$1" },
      { find: /^(components|utils|hooks)\//, replacement: "/src/$1/" },
    ],
  },

  plugins: [reactRefresh()],
});
