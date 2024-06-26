import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import minimist from "minimist";
import { varLoader } from "@informatiqal/variables-loader";

import { TestOMatiqCLI } from "./lib/Cli";
import { printHelp } from "./lib/help";
import { generateSample } from "./lib/sample";
import { printError } from "./lib/common";

import { IArguments } from "./lib/interfaces";

const argv = minimist<IArguments>(process.argv.slice(2));

// start without arguments - show help
if (process.argv.length == 2) printHelp();
// show help
if (argv.help || argv.h) printHelp();
// generate sample file(s)
if (argv.sample || argv.s) generateSample(argv.sample || argv.s);
// if its not help or sample command and file arg do not exists - exit
if (!argv.file && !argv.f) printError(`\u274C Please provide file location`);
// file argument provided but the file do not exists - exit
if (!existsSync(argv.file || argv.f))
  printError(`\u274C File not found: "${argv.file || argv.f}"`);

if (argv.traffic || argv.t) {
  const trafficLocation = argv.traffic || argv.t;
  if (trafficLocation.toString() == "true")
    printError(`\u274C Please provide file name for the traffic log`);

  const parentFolder = resolve(argv.traffic || argv.t, "../");
  const isParentFolderExists = existsSync(parentFolder);

  if (!isParentFolderExists)
    printError(`\u274C Folder do not exists: ${parentFolder}`);
}

async function processFile(testSuite: string) {
  try {
    const runner = new TestOMatiqCLI(
      testSuite,
      argv.json,
      argv.t || argv.traffic
    );

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

async function main() {
  // read the test suite file
  const rawTestSuite = readTestSuite();
  // read the variables file (if any)
  const variablesValues = readVariablesFile(rawTestSuite);
  // replace the variables with their values from the var file (if any)
  const withVarReplaced = replaceVariables(variablesValues, rawTestSuite);

  // if testing the connection
  if (argv.c || argv.connect) {
    const runner = new TestOMatiqCLI(
      withVarReplaced,
      argv.json,
      argv.t || argv.traffic
    );

    await runner
      .checkConnectivity()
      .then((v) => {
        console.log("\u001B[32m√\u001B[39m Connection established");
        console.log(`Engine version: ${v}`);
        process.exit(0);
      })
      .catch((e) => {
        console.log("\u001B[31m×\u001B[39m Failed to connect");
        console.log(e.message);
        process.exit(1);
      });
  }

  // if all is ok up to here - start processing
  processFile(withVarReplaced);
}

function writeOut(result: any, path: string) {
  try {
    writeFileSync(path, JSON.stringify(result, null, 4));
  } catch (e) {
    console.log(`Unable to write the output:`);
    console.log(e.message);
  }
}

/**
 * Read the test suite file
 */
function readTestSuite() {
  let rawTestSuite: string = "";

  try {
    rawTestSuite = readFileSync(argv.file || argv.f, "utf8").toString();
  } catch (e) {
    console.log(`\u274C Error while reading the test suite file`);
    console.log(e.message);
    process.exit(1);
  }

  return rawTestSuite;
}

function readVariablesFile(rawTestSuite: string) {
  // get list of all variables in the test suite
  let runbookVariablesList: string[] = [];

  try {
    runbookVariablesList = rawTestSuite
      .match(/(?<!\$)(\${)(.*?)(?=})/g)
      .map((v) => v.substring(2));
  } catch (e) {}

  // if there are any variables setup but no variables values are provided
  // then exit
  if (
    runbookVariablesList.length > 0 &&
    !argv.v &&
    !argv.var &&
    !argv.variables &&
    !argv.g &&
    !argv.global &&
    !argv.e &&
    !argv.env &&
    !argv.i &&
    !argv.inline
  ) {
    console.log(
      `Variables found in the test suite but no variables argument is provided`
    );
    process.exit(1);
  }

  // if at least one variable values method is provided
  // then get the variables values from one of the possible methods
  if (
    argv.v ||
    argv.var ||
    argv.variables ||
    argv.g ||
    argv.global ||
    argv.e ||
    argv.env ||
    argv.i ||
    argv.inline
  ) {
    const variablesData = varLoader({
      sources: {
        environment: argv.e || argv.env,
        file: argv.v || argv.var || argv.variables,
        inline: argv.i || argv.inline,
        global:
          argv.g || argv.global ? `${homedir()}/.test-o-matiq` : undefined,
      },
      variables: Array.from(runbookVariablesList),
    });

    const variablesValues = variablesData.values;

    // if there is at least one variable, for which value cannot be found
    // then exit directly and do not run any tests
    if (variablesData.missing) {
      const missingValues = variablesData.missing
        .map((v) => `  - ${v}`)
        .join("\n");

      console.log(`Variable(s) value not found:\n${missingValues}`);
      process.exit(1);
    }

    // return mapping of variable name and its value
    return variablesValues;
  } else {
    return {};
  }
}

// TODO: validate
function replaceVariables(variablesValues, rawTestSuite) {
  Object.entries(variablesValues).forEach(([varName, varValue]) => {
    try {
      const v = "\\$\\{" + varName + "\\}";
      const re = new RegExp(v, "g");

      rawTestSuite = rawTestSuite.replace(re, varValue.toString());
    } catch (e) {
      console.log(`INTERNAL ERROR: ${e.message}`);
    }
  });

  return rawTestSuite;
}

main();
