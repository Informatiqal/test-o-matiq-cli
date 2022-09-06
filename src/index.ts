import { existsSync } from "fs";
import { minimist } from "@p-mcgowan/minimist";

import { TestOMatiqCLI } from "./lib/Cli";
import { printHelp } from "./lib/help";
import { generateSample } from "./lib/sample";

import { IArguments } from "./lib/interfaces";

if (process.argv.length == 2) {
  printHelp();
  process.exit(0);
}

const argv: IArguments = minimist(process.argv.slice(2));

if (argv.help || argv.h) {
  printHelp();
  process.exit(0);
}

if (argv.sample || argv.s) {
  generateSample(argv.sample || argv.s);
  console.log(`\u2705 "test-o-matiq-sample.yaml" generated!`);
  console.log("");
  console.log(
    `\u2705 \x1b[33mMore examples can be found at https://github.com/Informatiqal/test-o-matiq-cli/tree/main/test-suite-examples\x1b[0m`
  );
  process.exit(0);
}

// file argument not provided
if (!argv.file && !argv.f) {
  console.log(`\u274C ERROR 1001: Please provide file location`);
  process.exit(1);
}

// file argument provided but the file do not exists
if (!existsSync(argv.file || argv.f)) {
  console.log(`\u274C ERROR 1002: file not found: "${argv.file || argv.f}"`);
  process.exit(1);
}

// TODO: throw an error when unknown argument is passed

const runner = new TestOMatiqCLI(argv);

runner
  .run()
  .then((d) => {
    let b1 = 1;
    process.exit(0);
  })
  .catch((e) => {
    let b1 = 1;
    process.exit(0);
  });

// let a = 1;
// runner
//   .run()
//   .then((data) => {
//     console.log(`${new Date().toISOString()}\tFinished successfully`);
//     process.exit(0);
//   })
//   .catch((e) => {
//     // console.log(`\u274C ERROR 9999: UNEXPECTED error!`);
//     console.log(`${new Date().toISOString()}\t\t\tFinished with ERROR(s)`);
//     console.log(e.message);
//     process.exit(1);
// });
