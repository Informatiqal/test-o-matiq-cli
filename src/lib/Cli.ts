import { readFileSync, writeFileSync } from "fs";
import { load } from "js-yaml";
import { QlikTesting } from "test-o-matiq";
import * as enigma from "enigma.js";
import WebSocket from "ws";
import * as schema from "enigma.js/schemas/12.20.0.json";
import { docMixin } from "enigma-mixin";
import ora from "ora";

import { IEventError, Root } from "test-o-matiq/dist/interface/Specs";

import { IArguments } from "./interfaces";

export class TestOMatiqCLI {
  private argv: IArguments;
  private runBook: Root;
  // private result: ITaskResult[];
  private result: [];
  private httpsAgent: any;
  private qlikTesting: QlikTesting.client;
  private rawRunBook: string;
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
      this.rawRunBook = readFileSync(this.argv.file, "utf8").toString();
    } catch (e) {
      console.log(`\u274C ERROR 1000: while reading the runbook file`);
      console.log(e.message);
      process.exit(1);
    }
    // match all strings in between ${ and }
    const variables = this.rawRunBook.match(/(?<=\${)(.*?)(?=})/g);
    if (
      variables &&
      variables.length > 0 &&
      !this.argv.v &&
      !this.argv.variables
    ) {
      console.log(
        `\u274C ERROR 1012: Variable(s) declaration found but no variables file was provided `
      );
      console.log("");
      console.log("Variables found:");
      variables.forEach((v) => console.log(`  ${v}`));
      process.exit(1);
    }
    // this.replaceVariables();
    this.runbookSet();
    // this.prepareCertificates();
    // no need to read any files if only connection is being tested
    // if (!this.argv.c && !this.argv.connect) this.readBuffers();
    try {
      this.qlikTesting = new QlikTesting.client(this.runBook, this.httpsAgent);
    } catch (e) {
      if (e.context) {
        console.log(e.context);
        process.exit(1);
      }
      if (e.message) {
        console.log(e.message);
        process.exit(1);
      }
    }
    // this.emittersSet();
    console.log("");
    console.log(`Test-O-Matiq`);
    console.log("");
    console.log(`Suite description
    ${this.runBook.description}`);
    console.log(`============================`);
    console.log("");
  }

  async run() {
    const global: EngineAPI.IGlobal = await this.qlikSession.open();
    this.qlikApp = await global.openDoc(
      `C:/Users/countnazgul/Documents/Qlik/Sense/Apps/Consumer_Sales(2).qvf`
    ); //as IAppMixin;
    // console.log(
    //   `${new Date().toISOString()}\t\t"${this.runBook.name}"\tStarted`
    // );
    this.qlikTesting = new QlikTesting.client(this.runBook, this.qlikApp);
    this.emittersSet();
    const b = await this.qlikTesting.run();
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
   * @description set the runbook based on the provided yaml/json file
   */
  private runbookSet() {
    // if the config is yaml
    if (!this.argv.json) {
      try {
        this.runBook = load(this.rawRunBook) as Root;
      } catch (e) {
        console.log(`\u274C ERROR 1003: while parsing the yaml file`);
        console.log(e.message);
        process.exit(1);
      }
    }
    // if the config is json
    if (this.argv.json) {
      try {
        this.runBook = JSON.parse(this.rawRunBook);
      } catch (e) {
        console.log(`\u274C ERROR 1004: while parsing the json file`);
        console.log(e.message);
        process.exit(1);
      }
    }
    // if (this.argv.c || this.argv.connect) {
    //   this.runBook.tasks = [
    //     { name: "Test connectivity", operation: "about.get" },
    //   ];
    // }
  }
  // /**
  //  * @description create all required emitters
  //  */
  private emittersSet() {
    const _this = this;

    let spinners = {};

    // const spinners =
    this.qlikTesting.testGroups.map((group) => {
      const spinner = ora(group);

      spinners[group] = {
        spinner,
      };
    });

    this.qlikTesting.emitter.on("group", async function (a) {
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
      // await oraPromise(somePromise);

      // const b: ITaskResult = a as any;
      // if (b.task.operation.indexOf(".export") > -1) {
      //   if (!b.task.location) {
      //     console.log(
      //       `\u274C ERROR 1009: "${b.task.name}" is missing "location" parameter`
      //     );
      //     process.exit(1);
      //   }
      //   try {
      //     _this.writeExports(b.data, b.task.location);
      //     if (b.data && b.data.length > 0) {
      //       b.data = b.data.map((r: any) => {
      //         if (r.file) r.file = "BINARY CONTENT REPLACED!";
      //         return r;
      //       });
      //     }
      //   } catch (e) {
      //     console.log(
      //       `\u274C ERROR 1010: Error in "${b.task.name}". Failed to write file: "${e.path}" `
      //     );
      //     process.exit(1);
      //   }
      //}
      let b = 1;
      // _this.result.push(a);
      // console.log(
      //   `${b.timings.start}\t${b.timings.end}\t${b.timings.totalSeconds}(s)\t"${b.task.name}"\t${b.status}`
      // );
    });
    // this.qlikTesting.emitter.on("runbook:result", function (r) {});
    // this.qlikTesting.emitter.on("runbook:log", function (l) {});
    this.qlikTesting.emitter.on("testError", function (errorMessage) {
      _this.erroredTest.push(errorMessage);
      // console.log(JSON.stringify(errorMessage));
      // process.exit(1);
    });
  }

  printErrors() {
    let a = this.erroredTest;
    let b = 1;

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

  // /**
  //  * @description if "output" flag is present - write the result to a file
  //  */
  // private writeOut() {
  //   try {
  //     writeFileSync(this.argv.output, JSON.stringify(this.result, null, 4));
  //   } catch (e) {
  //     console.log(`\u274C ERROR 1005: while writing the output file`);
  //     console.log(e.message);
  //     process.exit(1);
  //   }
  // }
  // /**
  //  * @description if the authentication is certificates based
  //  *     read the certificates and prepare the httpsAgent
  //  */
  // private prepareCertificates() {
  //   if (this.runBook.environment.authentication.cert) {
  //     let cert: Buffer;
  //     let key: Buffer;
  //     try {
  //       cert = readFileSync(this.runBook.environment.authentication.cert);
  //       key = readFileSync(this.runBook.environment.authentication.key);
  //     } catch (e) {
  //       console.log(`\u274C ERROR 1006: reding certificates`);
  //       console.log(e.message);
  //       process.exit(1);
  //     }
  //     this.httpsAgent = new https.Agent({
  //       rejectUnauthorized: false,
  //       cert: cert,
  //       key: key,
  //     });
  //   } else {
  //     this.httpsAgent = new https.Agent({
  //       rejectUnauthorized: false,
  //     });
  //   }
  // }
  // /**
  //  * @description loop through all the tasks and replace the file location
  //  *     (if any) with the actual file content
  //  */
  // private readBuffers() {
  //   for (let task of this.runBook.tasks) {
  //     if (task.details && (task.details as any).file) {
  //       try {
  //         (task.details as any).file = readFileSync((task.details as any).file);
  //       } catch (e) {
  //         console.log(
  //           `\u274C ERROR 1007: reading file failed in task "${task.name}"`
  //         );
  //         console.log(e.message);
  //         process.exit(1);
  //       }
  //     }
  //     if (task.details && (task.details as any).length > 0) {
  //       task.details = (task.details as any).map((d) => {
  //         if (d.file) {
  //           try {
  //             d.file = readFileSync(d.file);
  //             return d;
  //           } catch (e) {
  //             console.log(
  //               `\u274C ERROR 1007: reading file failed in task "${task.name}"`
  //             );
  //             console.log(e.message);
  //             process.exit(1);
  //           }
  //         }
  //         return d;
  //       });
  //     }
  //   }
  // }
  // /**
  //  * @description replace all runbook variables with their content
  //  */
  // private replaceVariables() {
  //   if (this.argv.var || this.argv.v || this.argv.variables) {
  //     let variablesFileLocation =
  //       this.argv.var || this.argv.v || this.argv.variables;
  //     let rawVariables: string[];
  //     try {
  //       rawVariables = readFileSync(variablesFileLocation)
  //         .toString()
  //         .split(/\r?\n/);
  //     } catch (e) {
  //       console.log(
  //         `\u274C ERROR 1008: reading variables file "${variablesFileLocation}"`
  //       );
  //       console.log(e.message);
  //       process.exit(1);
  //     }
  //     for (let line of rawVariables) {
  //       let [varName, varContent] = line.split("=");
  //       const v = "\\$\\{" + varName + "\\}";
  //       const re = new RegExp(v, "g");
  //       this.rawRunBook = this.rawRunBook.replace(re, varContent);
  //     }
  //   }
  // }
  // private writeExports(files: any[], location: string) {
  //   if (!Array.isArray(files)) {
  //     writeFileSync(`${location}\\${(files as any).name}`, (files as any).file);
  //     return true;
  //   }
  //   files.map((f) => {
  //     if (Array.isArray(f)) {
  //       f.map((f1) =>
  //         writeFileSync(`${location}\\${(f1 as any).name}`, (f1 as any).file)
  //       );
  //       return true;
  //     }
  //     writeFileSync(`${location}\\${(f as any).name}`, (f as any).file);
  //   });
  //   return true;
  // }
}
