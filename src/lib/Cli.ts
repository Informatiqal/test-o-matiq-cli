import { load } from "js-yaml";
import { TestOMatiq } from "test-o-matiq";
import ora, { Ora } from "ora";

import { Runbook } from "test-o-matiq/dist/interface/Specs.js";

import { Engine } from "./Engine.js";

export class TestOMatiqCLI {
  private isJSON: boolean;
  private testSuite: Runbook;
  private testOMatiq: TestOMatiq;
  private rawTestSuiteBook: string;
  private qlikApp: EngineAPI.IApp;
  private engine: Engine;

  constructor(rawTestSuiteBook: string, isJSON: boolean) {
    this.rawTestSuiteBook = rawTestSuiteBook;
    this.isJSON = isJSON;

    this.testSuiteSet();

    //@ts-ignore
    this.engine = new Engine(this.testSuite.environment);
  }

  async run() {
    console.log("");
    console.log(`Test-O-Matiq`);
    console.log(`----------------------------`);
    console.log("");

    const spinner = ora("Establishing connection").start();

    try {
      this.qlikApp = await this.engine
        .openDoc(spinner)
        .then((_) => this.engine.doc);
    } catch (e) {
      const message = `Error while opening the app. Make sure that the appId exists and you have access to it. Original message:\n${e.message}`;
      spinner.fail(message);
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

    await this.engine.closeSession();

    console.log(`----------------------------`);
    console.log("");
    console.log("\u001B[32m√\u001B[39m Session closed");
    console.log("");
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
    if (!this.isJSON) {
      try {
        this.testSuite = load(this.rawTestSuiteBook) as Runbook;
      } catch (e) {
        console.log(`\u274C ERROR 1003: while parsing the yaml file`);
        console.log(e.message);
        process.exit(1);
      }
    }
    // if the config is json
    if (this.isJSON) {
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

  async checkConnectivity() {
    const engineVersion = await this.engine.checkConnection();
    await this.engine.closeSession();

    return engineVersion;
  }
}
