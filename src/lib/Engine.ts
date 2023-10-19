import { WriteStream, createWriteStream } from "fs";
import * as enigma from "enigma.js";
import { WebSocket } from "ws";
import { schema } from "./enigmaSchema";
import { docMixin } from "enigma-mixin";
import { Ora } from "ora";
// import {
//   EnvironmentDesktop,
//   EnvironmentSaaS,
// } from "test-o-matiq/dist/interface/Specs";

export interface EnvironmentDesktop {
  host: string;
  appId: string;
  edition: "desktop";
}
export interface EnvironmentSaaS {
  host: string;
  appId: string;
  edition: "saas";
  authentication?: {
    apiKey: string;
  };
}

//TODO: code repetition for traffic output. To be fixed at some point
export class Engine {
  private enigmaConfig: enigmaJS.IConfig;
  private enigmaSession: enigmaJS.ISession;
  private config: EnvironmentDesktop | EnvironmentSaaS;
  private outputTraffic: string;
  doc: EngineAPI.IApp;

  constructor(
    config: EnvironmentDesktop | EnvironmentSaaS,
    outputTraffic: string
  ) {
    this.config = config;
    const host: string =
      config.edition == "desktop" ? "127.0.0.1" : config.host;
    const port: number = config.edition == "desktop" ? 4848 : 443;
    const protocol: string = config.edition == "desktop" ? "ws" : "wss";
    const appId: string =
      config.edition == "desktop" ? "engineData" : config.appId;
    this.outputTraffic = outputTraffic;

    const socketConfig = {
      rejectUnauthorized: false,
    };

    if (config.edition == "saas") {
      if (!config.authentication?.apiKey)
        throw new Error(
          `Configuration error: Edition is set to "saas" but no API key was provided\n`
        );

      if (config.authentication?.apiKey)
        socketConfig["headers"] = {
          Authorization: `Bearer ${config.authentication.apiKey}`,
        };
    }

    this.enigmaConfig = {
      Promise: Promise,
      schema: schema,
      mixins: docMixin,
      url: `${protocol}://${host}:${port}/app/${appId}`,
      createSocket: (url) => new WebSocket(url, socketConfig),
    };
  }

  async openDoc(spinner: Ora) {
    const enigmaClass = (enigma as any).default as IEnigmaClass;
    this.enigmaSession = enigmaClass.create(this.enigmaConfig);

    let fileStream: WriteStream;

    if (this.outputTraffic) {
      fileStream = createWriteStream(this.outputTraffic);

      this.enigmaSession.on("traffic:sent", (data) =>
        fileStream.write(JSON.stringify(data, null, 4) + "\n")
      );
      this.enigmaSession.on("traffic:received", (data) =>
        fileStream.write(JSON.stringify(data, null, 4) + "\n")
      );
    }

    try {
      const enigmaConnection: EngineAPI.IGlobal =
        await this.enigmaSession.open();
      spinner.text = "Opening the app";

      this.doc = await enigmaConnection.openDoc(this.config.appId);
    } catch (e) {
      fileStream.close();
      throw new Error(e.message);
    }
  }

  async closeSession() {
    try {
      await this.enigmaSession.close();
    } catch (e) {
      // TODO: what shall be executed here?
    }
  }

  async checkConnection() {
    const enigmaClass = (enigma as any).default as IEnigmaClass;
    this.enigmaSession = enigmaClass.create(this.enigmaConfig);

    let fileStream: WriteStream;

    if (this.outputTraffic) {
      fileStream = createWriteStream(this.outputTraffic);

      this.enigmaSession.on("traffic:sent", (data) =>
        fileStream.write(JSON.stringify(data, null, 4) + "\n")
      );
      this.enigmaSession.on("traffic:received", (data) =>
        fileStream.write(JSON.stringify(data, null, 4) + "\n")
      );
    }

    try {
      const enigmaConnection: EngineAPI.IGlobal =
        await this.enigmaSession.open();

      const engineVersion = await enigmaConnection
        .engineVersion()
        .then((r) => r.qComponentVersion);

      return engineVersion;
    } catch (e) {
      fileStream.close();
      throw new Error(e.message);
    }
  }
}
