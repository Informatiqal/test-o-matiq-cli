import { existsSync, writeFileSync } from "fs";
import { minimist } from "@p-mcgowan/minimist";
import { varLoader } from "@informatiqal/variables-loader";

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
  try {
    const runner = new TestOMatiqCLI(argv);

    await runner
      .run()
      .then((result) => {
        if (argv.output || argv.o) writeOut(result, argv.output || argv.o);
        process.exit(0);
      })
      .catch((e) => {
        console.log(e.message);
        process.exit(1);
      });
  } catch (e) {
    // TODO: worth providing more info as a context? like which file was executed etc
    // TODO: output the error to a file if "output" argument is provided?
    console.log(e.message);
    process.exit(1);
  }
}

// if all is ok up to here - start processing
processFile();

function writeOut(result: any, path: string) {
  try {
    writeFileSync(path, JSON.stringify(result, null, 4));
  } catch (e) {
    console.log(`Unable to write the output:`);
    console.log(e.message);
  }
}
