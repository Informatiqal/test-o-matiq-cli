import { readFileSync } from "fs";
import { load } from "js-yaml";
import { TestOMatiq } from "test-o-matiq";
import ora, { Ora } from "ora";

import { Runbook } from "test-o-matiq/dist/interface/Specs.js";

import { IArguments } from "./interfaces.js";
import { Engine } from "./Engine.js";

export class TestOMatiqCLI {
  private argv: IArguments;
  private testSuite: Runbook;
  private testOMatiq: TestOMatiq;
  private rawTestSuiteBook: string;
  private qlikApp: EngineAPI.IApp;
  private engine: Engine;

  constructor(argv: IArguments) {
    this.argv = argv;

    try {
      this.rawTestSuiteBook = readFileSync(
        this.argv.file || this.argv.f,
        "utf8"
      ).toString();
    } catch (e) {
      console.log(`\u274C ERROR 1000: while reading the test suite file`);
      console.log(e.message);
      process.exit(1);
    }

    this.testSuiteSet();

    this.engine = new Engine(this.testSuite.environment);
  }

  async run() {
    console.log("");
    console.log(`Test-O-Matiq`);
    console.log(`----------------------------`);
    console.log("");

    const spinner = ora("Establishing connection").start();

    try {
      this.qlikApp = await this.engine.openDoc(spinner).then((_) => this.engine.doc);
    } catch (e) {
      spinner.fail(e.message);
      process.exit(1);
    }

    spinner.succeed("App open");
    console.log("");

    if (this.testSuite.description) {
      console.log(`${this.testSuite.description}`);
      console.log(`----------------------------`);
      console.log("");
    }

    this.testOMatiq = new TestOMatiq(this.testSuite, this.qlikApp, false);
    this.emittersSet();
    
    const result = await this.testOMatiq.run();

    console.log(`----------------------------`);
    console.log(`\u001b[1mSummary\u001b[0m
  Total tests: ${result.failedTests + result.passedTests}
  Failed tests: ${result.failedTests}
  Run time: ${result.totalTime} s`);

    return result;
  }

  /**
   * @description set the test suite based on the provided yaml/json file
   */
  private testSuiteSet() {
    // if the config is yaml
    if (!this.argv.json) {
      try {
        this.testSuite = load(this.rawTestSuiteBook) as Runbook;
      } catch (e) {
        console.log(`\u274C ERROR 1003: while parsing the yaml file`);
        console.log(e.message);
        process.exit(1);
      }
    }
    // if the config is json
    if (this.argv.json) {
      try {
        this.testSuite = JSON.parse(this.rawTestSuiteBook);
      } catch (e) {
        console.log(`\u274C ERROR 1004: while parsing the json file`);
        console.log(e.message);
        process.exit(1);
      }
    }
  }

  /**
   * @description create all required emitters
   */
  private emittersSet() {
    const _this = this;

    let spinners: { [k: string]: Ora } = {};

    this.testOMatiq.emitter.on("testResult", function (result) {
      const spinnerMessage = `${result.name}\n\t${result.message}\n`;
      result.status
        ? spinners[result.name].succeed(spinnerMessage)
        : spinners[result.name].fail(spinnerMessage);
      // console.log(`END -> ${result.name}`);
    });

    this.testOMatiq.emitter.on("testStart", function (name) {
      const spinner = ora({
        spinner: "circleHalves",
        text: name,
      });
      spinners[name] = spinner;
      spinners[name].start();

      // console.log(`START -> ${name}`);
    });
  }
}
