type RetryConfig = {
  retryCount?: number;
  delayInterval?: number;
};

const DEFAULT_RETRY_COUNT = 5;
const DEFAULT_DELAY_INTERVAL = 500;

const defaultRetryConfig = {
  retryCount: DEFAULT_RETRY_COUNT,
  delayInterval: DEFAULT_DELAY_INTERVAL,
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default <N>(successFn: (_: N) => boolean, retryConfig: RetryConfig = defaultRetryConfig) =>
  async (fn: (...x: any) => N | Promise<N>, ...args: Parameters<typeof fn>) => {
    const { retryCount, delayInterval } = {
      ...defaultRetryConfig,
      ...retryConfig,
    };
    let res = await Promise.resolve(fn(...args));
    let retryN = 0;
    let interval = delayInterval;
    while (!(await Promise.resolve(successFn(res)))) {
      await delay(interval);
      interval = 2 * interval;
      res = await Promise.resolve(fn(...args));
      retryN++;
      if (retryN >= retryCount) {
        throw new Error("Condition timeout");
      }
    }

    return res;
  };
