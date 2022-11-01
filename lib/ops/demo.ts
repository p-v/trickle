import { AxiosResponse } from "axios";
import FuncOp from "./funcop";
import LoggerOp from "./loggerop";
import HttpOp from "./httpop";
import {addLink, walk} from "../path";

type Joke = {
  categories: string[];
  created_at: string;
  icon_url: string;
  id: string;
  updated_at: string;
  url: string;
  value: string;
}

let op2 = new LoggerOp<Promise<Joke>>(console.log);
let op1 = new FuncOp<Promise<AxiosResponse<Joke>>, Promise<Joke>>(
  (x) => Promise.resolve(x).then((x) => x.data)
);
let op3 = new HttpOp<null, Joke>({
  url: 'https://api.chucknorris.io/jokes/random'
});

addLink(op3, op1);
addLink(op1, op2);

walk(op3, null);
