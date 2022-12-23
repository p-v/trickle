import { EventEmitter } from "events";
import Table from "cli-table";

export type Logger = {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  error(...args: any[]): void;
};

export const createProgresInstance = (logger: Logger) => {
  const progress = new EventEmitter();

  const stepMap = new Map<string, any>();

  progress.on("add", (step) => {
    stepMap.set(step, null);
  });

  progress.on("start", () => {
    setTimeout(() => {
      const table = new Table({
        head: ["Steps to execute"],
      });
      for (let [key, _] of stepMap) {
        table.push([key]);
      }
      logger.info(table.toString());
    }, 0);
  });

  progress.on("result", (step, result) => {
    logger.info(`Result for "${step}": \n${JSON.stringify(result) ?? ""}`);
    stepMap.set(step, result);
  });

  progress.on("end", () => {
    setTimeout(() => {
      const table = new Table({
        head: ["Step", "Result"],
        colAligns: ["left", "left"],
      });
      for (let [key, value] of stepMap) {
        table.push([key, JSON.stringify(value, null, 4) ?? ""]);
      }
      logger.info(table.toString());
    }, 0);
  });

  return progress;
};
