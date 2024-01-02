import { load } from "js-yaml";
import { TestOMatiq } from "test-o-matiq";
import Spinnies from "spinnies";

import { Runbook } from "test-o-matiq/dist/interface/Specs.js";
// import { Engine } from "./Engine.js";

const spinnies = new Spinnies({
  spinner: { interval: 80, frames: ["◐", "◓", "◑", "◒"] },
});

export class TestOMatiqCLI {
  private isJSON: boolean;
  private testSuite: Runbook;
  private testOMatiq: TestOMatiq;
  private rawTestSuiteBook: string;
  // private qlikApp: EngineAPI.IApp;
  // private engine: Engine;

  constructor(
    rawTestSuiteBook: string,
    isJSON: boolean,
    outputTraffic: string
  ) {
    this.rawTestSuiteBook = rawTestSuiteBook;
    this.isJSON = isJSON;

    this.testSuiteSet();

    //@ts-ignore
    this.engine = new Engine(this.testSuite.environment, outputTraffic);
  }

  async run() {
    console.log("");
    console.log(`Test-O-Matiq`);
    console.log(`----------------------------`);
    console.log("");

    spinnies.add("connection", {
      text: "Establishing connection",
      status: "spinning",
    });

    // try {
    //   this.qlikApp = await this.engine
    //     .openDoc(spinnies)
    //     .then((_) => this.engine.doc);
    // } catch (e) {
    //   const message = `Error while opening the app. Make sure that the appId exists and you have access to it. Original message:\n${e.message}`;
    //   spinnies.update("connection", {
    //     status: "fail",
    //     text: message,
    //   });
    //   process.exit(1);
    // }

    spinnies.update("connection", {
      status: "succeed",
      text: "App open",
    });
    spinnies.remove("connection");
    console.log("");

    if (this.testSuite.description) {
      console.log(`${this.testSuite.description}`);
      console.log(`----------------------------`);
      console.log("");
    }

    this.testOMatiq = new TestOMatiq(this.testSuite, false);
    this.emittersSet();

    const result = await this.testOMatiq.run();

    // await this.engine.closeSession();

    console.log(`----------------------------`);
    console.log("");
    console.log("\u001B[32m√\u001B[39m Session closed");
    console.log("");
    console.log(`\u001b[1mSummary\u001b[0m
  Total tests: ${result.failedTests + result.passedTests}
  Failed tests: ${result.failedTests}
  Run time: ${result.totalTime}s`);

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

    this.testOMatiq.emitter.on("testResult", function (result) {
      const spinnerMessage = `${result.name}\n\t${result.message}\n`;
      result.status
        ? spinnies.update(result.name, {
            text: spinnerMessage,
            status: "succeed",
          })
        : spinnies.update(result.name, {
            text: spinnerMessage,
            status: "fail",
          });

      spinnies.remove(result.name);
    });

    this.testOMatiq.emitter.on("testStart", function (name) {
      spinnies.add(name, {
        text: name,
        status: "spinning",
      });
    });
  }

  async checkConnectivity() {
    const testOMatiq = new TestOMatiq(this.testSuite, false);
    // return await testOMatiq.checkConnection();
  }
}
