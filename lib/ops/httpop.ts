import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import BaseOp from './baseop';


export default class HttpOp<D, R> extends BaseOp<AxiosRequestConfig<D>, Promise<AxiosResponse<R, any>>> {
  exec = axios;
}
