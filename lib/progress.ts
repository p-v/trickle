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
    (step, aid, opts: { ignoreLogs: boolean } = { ignoreLogs: false }) => {
      stepMap.set(aid, { step, opts });
    }
  );

  progress.on(ProgressEvent.START, () => {
    setTimeout(() => {
      const table = new Table({
        head: ["Steps to execute"],
      });
      for (let [_, { step, opts }] of stepMap) {
        if (opts.ignoreLogs) continue;

        table.push([step]);
      }
      logger.info(table.toString());
    }, 0);
  });

  progress.on(ProgressEvent.RESULT, (aid, result) => {
    const { step, opts } = stepMap.get(aid);
    if (!disableDebugLogs) {
      logger.debug(`Result for "${step}": \n${JSON.stringify(result) ?? ""}`);
    }
    stepMap.set(aid, { step, opts, result });
  });

  progress.on(ProgressEvent.FAILURE, (aid: string, err: any) => {
    setTimeout(() => {
      const table = new Table({
        head: ["Step", "Result"],
        colAligns: ["left", "left"],
        ...extraTableOpts,
      });
      for (let [key, { step, opts, result }] of stepMap) {
        if (opts.ignoreLogs) continue;

        if (key === aid) {
          table.push([step, err.toString()]);
        } else {
          table.push([step, JSON.stringify(result, null, 4) ?? ""]);
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
      for (let [_, { step, opts, result }] of stepMap) {
        if (opts.ignoreLogs) continue;

        table.push([step, JSON.stringify(result, null, 4) ?? ""]);
      }
      logger.info(table.toString());
    }, 0);
  });

  return progress;
};
