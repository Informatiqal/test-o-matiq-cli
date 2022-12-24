// import typescript from "@rollup/plugin-typescript";
// import del from "rollup-plugin-delete";
// import json from "@rollup/plugin-json";
// import { readFileSync } from "fs";

// const pkg = JSON.parse(readFileSync("./package.json"));

// export default {
//   input: "src/index.ts",
//   output: {
//     format: "es",
//     dir: "dist",
//     sourcemap: true,
//   },
//   external: [
//     ...Object.keys(pkg.dependencies || {}),
//     ...Object.keys(pkg.peerDependencies || {}),
//     "fs",
//   ],
//   plugins: [
//     del({
//       targets: "dist/*",
//     }),
//     // commonjs(),
//     // terser(),
//     // nodeResolve(),
//     json(),
//     typescript(),
//   ],
// };

import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";
// import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import { readFileSync } from "fs";
import replace from "@rollup/plugin-replace";

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
    // nodeResolve(),
    json(),
    typescript(),
    replace({
      values: {
        __VERSION: pkg.version,
      },
      preventAssignment: true,
    }),
  ],
};
