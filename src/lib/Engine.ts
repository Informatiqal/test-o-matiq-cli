import * as enigma from "enigma.js";
import { WebSocket } from "ws";
import { schema } from "./enigmaSchema";
import { docMixin } from "enigma-mixin";
import { Ora } from "ora";
import {
  EnvironmentDesktop,
  EnvironmentSaaS,
} from "test-o-matiq/dist/interface/Specs";

export class Engine {
  private enigmaConfig: enigmaJS.IConfig;
  private enigmaSession: enigmaJS.ISession;
  private config: EnvironmentDesktop | EnvironmentSaaS;
  doc: EngineAPI.IApp;

  constructor(config: EnvironmentDesktop | EnvironmentSaaS) {
    this.config = config;
    const host: string =
      config.edition == "desktop" ? "127.0.0.1" : config.host;
    const port: number = config.edition == "desktop" ? 4848 : 443;
    const protocol: string = config.edition == "desktop" ? "ws" : "wss";
    const appId: string =
      config.edition == "desktop" ? "engineData" : config.appId;

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
    const enigmaConnection: EngineAPI.IGlobal = await this.enigmaSession.open();
    spinner.text = "Opening the app";

    this.doc = await enigmaConnection.openDoc(this.config.appId);
  }
}
