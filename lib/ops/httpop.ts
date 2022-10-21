import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import BaseOp from "./baseop";

export default class HttpOp<D, R> extends BaseOp<
  D,
  Promise<AxiosResponse<R, any>>
> {
  private config: AxiosRequestConfig<D>;

  constructor(config: AxiosRequestConfig<D>) {
    super();
    this.config = config;
  }

  exec = (data: D) => axios({
    ...this.config,
    data
  });
}
