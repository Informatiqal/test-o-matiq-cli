import { readFileSync } from "fs";
import { load } from "js-yaml";
import { TestOMatiq } from "test-o-matiq";
import * as enigma from "enigma.js";
import * as WebSocket from "ws";
import * as schema from "enigma.js/schemas/12.20.0.json";
import { docMixin } from "enigma-mixin";
import ora from "ora";

import { IEventError, Root } from "test-o-matiq/dist/interface/Specs";

import { IArguments } from "./interfaces";

export class TestOMatiqCLI {
  private argv: IArguments;
  private testSuite: Root;
  private result: [];
  private httpsAgent: any;
  private testOMatiq: TestOMatiq;
  private rawTestSuiteBook: string;
  private qlikApp: EngineAPI.IApp;
  private qlikSession: enigmaJS.ISession;
  private erroredTest: IEventError[];
  private totalTestsCount: number;
  private failedTestsCount: number;
  private totalRunTime: number;

  constructor(argv: IArguments) {
    this.argv = argv;
    this.result = [];
    this.erroredTest = [] as IEventError[];
    this.totalRunTime = 0;
    this.totalTestsCount = 0;
    this.failedTestsCount = 0;

    const enigmaConfig: enigmaJS.IConfig = {
      Promise: Promise,
      schema: schema,
      mixins: docMixin,
      url: "ws://localhost:4848/app/engineData",
      createSocket: (url) => new WebSocket(url),
    };

    const enigmaClass = (enigma as any).default as IEnigmaClass;
    this.qlikSession = enigmaClass.create(enigmaConfig);

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
    try {
      this.testOMatiq = new TestOMatiq(this.testSuite, this.httpsAgent);
    } catch (e) {
      if (e.context) {
        console.log(e.context);
        process.exit(1);
      }
      if (e.message) {
        console.log(e.message);
        if (e.errors) console.log(JSON.stringify(e.errors, null, 4));
        process.exit(1);
      }
    }
    // this.emittersSet();
    console.log("");
    console.log(`Test-O-Matiq`);
    console.log("");
    console.log(`Suite description
    ${this.testSuite.description}`);
    console.log(`============================`);
    console.log("");
  }

  async run() {
    const global: EngineAPI.IGlobal = await this.qlikSession.open();
    this.qlikApp = await global.openDoc(
      `C:/Users/countnazgul/Documents/Qlik/Sense/Apps/Consumer_Sales(2).qvf`
    ); //as IAppMixin;
    this.testOMatiq = new TestOMatiq(this.testSuite, this.qlikApp);
    this.emittersSet();
    const b = await this.testOMatiq.run();
    // if (this.argv.output || this.argv.o) this.writeOut();

    console.log(`----------------------------`);
    console.log(`
\u001b[1mSummary\u001b[0m

  Total tests: ${this.totalTestsCount}
  Failed tests: ${this.failedTestsCount}
  Run time: ${this.totalRunTime} ms
`);
    console.log("");

    if (this.erroredTest.length > 0) this.printErrors();

    return this.result;
  }
  /**
   * @description set the test suite based on the provided yaml/json file
   */
  private testSuiteSet() {
    // if the config is yaml
    if (!this.argv.json) {
      try {
        this.testSuite = load(this.rawTestSuiteBook) as Root;
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

    let spinners = {};

    // const spinners =
    this.testOMatiq.testGroups.map((group) => {
      const spinner = ora(group);

      spinners[group] = {
        spinner,
      };
    });

    this.testOMatiq.emitter.on("group", async function (a) {
      // const spinner = ora("Loading unicorns").start();

      if (a.isFinished == false)
        spinners[a.group].spinner.start(`${a.group} ...`);

      if (a.isFinished == true) {
        const message = `${a.group} (${a.elapsedTime}ms):
    Total tests: ${a.totalTests}
    Failed tests: ${a.failedTests}
`;
        _this.totalTestsCount += a.totalTests;
        _this.failedTestsCount += a.failedTests;
        _this.totalRunTime += a.elapsedTime;

        if (a.status == true) spinners[a.group].spinner.succeed(message);
        if (a.status == false) spinners[a.group].spinner.fail(message);
      }

      let b = 1;
    });
    this.testOMatiq.emitter.on("testError", function (errorMessage) {
      _this.erroredTest.push(errorMessage);
    });
  }

  printErrors() {
    console.log(`\u001b[1mFailed tests\u001b[0m`);
    for (let i = 0; i < this.erroredTest.length; i++) {
      const r = this.erroredTest[i];
      const subGroupMessage = r.subGroup
        ? `
      Sub-group: ${r.subGroup}`
        : "";

      console.log(`
  ${i + 1}) ${r.name}
      Group: ${r.group}${subGroupMessage}    
      Reason: ${r.reason}`);
    }
  }
}
