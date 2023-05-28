import express from "express";
import Logger from "./library/logger.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

globalThis = {
  __dirname: path.dirname(fileURLToPath(import.meta.url))
};

Logger.logsDirectory = "logs";
Logger.testing = true;

const expressServer = express();
const PORT = 80;

expressServer.use(express.json());
expressServer.use(express.urlencoded({ extended: false }));

expressServer.use("/", express.static(path.join(globalThis.__dirname, "public")));

expressServer.listen(PORT, function(){
  Logger.log("SERVER", `started on PORT '${PORT}'`);
});