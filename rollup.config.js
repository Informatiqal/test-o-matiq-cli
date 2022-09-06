// import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
// import commonjs from "@rollup/plugin-commonjs";
// import { nodeResolve } from "@rollup/plugin-node-resolve";
import del from "rollup-plugin-delete";
import json from "@rollup/plugin-json";
import pkg from "./package.json";

export default {
  input: "src/index.ts",
  output: {
    format: "es",
    dir: "dist",
    sourcemap: false,
  },
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    "fs",
  ],
  plugins: [
    del({
      targets: "dist/*",
    }),
    // commonjs(),
    // terser(),
    // nodeResolve(),
    json(),
    typescript({
      typescript: require("typescript"),
    }),
  ],
};
