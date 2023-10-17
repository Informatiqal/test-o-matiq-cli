import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import json from "@rollup/plugin-json";
import { readFileSync } from "fs";
import replace from "@rollup/plugin-replace";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const pkg = JSON.parse(readFileSync("./package.json"));

export default {
  input: "src/index.ts",
  output: [
    {
      sourcemap: true,
      file: pkg.main,
      format: "es",
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    "fs",
    "https",
  ],
  plugins: [
    del({
      targets: "dist/*",
    }),
    replace({
      values: {
        __VERSION: pkg.version,
      },
      preventAssignment: true,
    }),
    nodeResolve(),
    json({
      compact: true,
      include: ["node_modules/enigma.js/schemas/12.20.0.json"],
    }),
    typescript(),
  ],
};
