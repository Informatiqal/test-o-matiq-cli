import { existsSync } from "fs";
import { minimist } from "@p-mcgowan/minimist";

import { TestOMatiqCLI } from "./lib/Cli";
import { printHelp } from "./lib/help";
import { generateSample } from "./lib/sample";
import { printError } from "./lib/common";

import { IArguments } from "./lib/interfaces";

const argv: IArguments = minimist(process.argv.slice(2));

// start without arguments - show help
if (process.argv.length == 2) printHelp();
// show help
if (argv.help || argv.h) printHelp();
// generate sample file(s)
if (argv.sample || argv.s) generateSample(argv.sample || argv.s);
// if its not help or sample command and file arg do not exists - exit
if (!argv.file && !argv.f)
  printError(`\u274C ERROR 1001: Please provide file location`);
// file argument provided but the file do not exists - exit
if (!existsSync(argv.file || argv.f))
  printError(`\u274C ERROR 1002: file not found: "${argv.file || argv.f}"`);

async function processFile() {
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
}

// if all is ok up to here - start processing
processFile();
