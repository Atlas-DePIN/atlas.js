import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
import { resolve } from "path";
import { typescriptPaths } from "rollup-plugin-typescript-paths";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";
import resolvePlugin from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  base: "./",
  plugins: [
    tsconfigPaths(),
    dts({
      include: ["src"],
      rollupTypes: true,
      logLevel: "error",
    }),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: [
      { find: "@", replacement: resolve(__dirname, "./src") },
      {
        find: "browserify-aes",
        replacement: resolve(
          __dirname,
          "./node_modules",
          "@jackallabs",
          "browserify-aes",
        ),
      },
    ],
    extensions: [".js", ".ts"],
  },
  build: {
    minify: false,
    reportCompressedSize: true,
    rollupOptions: {
      input: resolve(__dirname, "src/index.ts"),
      preserveEntrySignatures: "allow-extension",
      output: [
        {
          dir: "./dist",
          entryFileNames: "index.cjs.js",
          inlineDynamicImports: true,
          exports: "named",
          format: "cjs",
          name: "Atlas.js",
          plugins: [],
        },
        {
          dir: "./dist",
          entryFileNames: "index.esm.js",
          inlineDynamicImports: true,
          exports: "named",
          format: "esm",
          name: "Atlas.js",
          plugins: [
            nodePolyfills({ include: ["buffer", "util", "events"] }),
          ],
        },
      ],
      external: [
        "grpc-web",
        "ts-proto",
        "protobufjs",
      ],
      plugins: [
        typescriptPaths({ absolute: false }),
        typescript({
          tsconfig: "./tsconfig.esm.json",
          exclude: ["node_modules/**", "**/node_modules/**"],
          noEmitOnError: false,
        }),
        // Resolve node_modules — needed to find cosmjs-types
        resolvePlugin({
          browser: true,
          preferBuiltins: false,
        }),
      ],
    },
  },
});
