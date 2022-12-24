import { EventEmitter } from "events";
import Table from "cli-table";

export type LogOptions = {
  logger: Logger;
  infoLogTableWidth?: [number, number];
  disableDebugLogs?: boolean;
};

type Logger = {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  error(...args: any[]): void;
};

export enum ProgressEvent {
  START = "start",
  ADD = "add",
  RESULT = "result",
  SUCCESS = "success",
  FAILURE = "failure",
}

export const createProgresInstance = (options: LogOptions) => {
  const { logger, infoLogTableWidth, disableDebugLogs } = options;
  const progress = new EventEmitter();

  const stepMap = new Map<string, any>();

  const extraTableOpts = infoLogTableWidth
    ? {
        colWidths: infoLogTableWidth,
      }
    : undefined;

  progress.on(
    ProgressEvent.ADD,
    (step, opts: { ignoreLogs: boolean } = { ignoreLogs: false }) => {
      stepMap.set(step, { opts });
    }
  );

  progress.on(ProgressEvent.START, () => {
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

  progress.on(ProgressEvent.RESULT, (step, result) => {
    if (!disableDebugLogs) {
      logger.debug(`Result for "${step}": \n${JSON.stringify(result) ?? ""}`);
    }
    const { opts } = stepMap.get(step);
    stepMap.set(step, { opts, result });
  });

  progress.on(ProgressEvent.FAILURE, (step: string, err: any) => {
    setTimeout(() => {
      const table = new Table({
        head: ["Step", "Result"],
        colAligns: ["left", "left"],
        ...extraTableOpts,
      });
      for (let [key, { opts, result }] of stepMap) {
        if (opts.ignoreLogs) continue;

        if (key === step) {
          table.push([key, err.toString()]);
        } else {
          table.push([key, JSON.stringify(result, null, 4) ?? ""]);
        }
      }
      logger.info(table.toString());
    }, 0);
  });

  progress.on(ProgressEvent.SUCCESS, () => {
    setTimeout(() => {
      const table = new Table({
        head: ["Step", "Result"],
        colAligns: ["left", "left"],
        truncate: '...',
        ...extraTableOpts,
      });
      for (let [key, { opts, result }] of stepMap) {
        if (opts.ignoreLogs) continue;

        table.push([key, JSON.stringify(result, null, 4) ?? ""]);
      }
      logger.info(table.toString());
    }, 0);
  });

  return progress;
};
