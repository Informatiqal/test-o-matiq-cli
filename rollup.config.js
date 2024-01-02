import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
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
      format: "cjs",
    },
  ],
  external: [
    // ...Object.keys(pkg.dependencies || {}),
    // ...Object.keys(pkg.peerDependencies || {}),
    "fs",
    "https",
    "path",
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
    commonjs(),
    nodeResolve({
      preferBuiltins: true,
    }),
    json({
      compact: true,
      include: [
        "node_modules/enigma.js/schemas/12.20.0.json",
        "node_modules/cli-spinners/spinners.json",
        "node_modules/spinnies/spinners.json",
        "node_modules/ajv/dist/refs/json-schema-draft-07.json"
      ],
    }),
    typescript(),
  ],
};
