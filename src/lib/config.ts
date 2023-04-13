import * as dotenv from 'dotenv';
dotenv.config();

const tryGet = <T = string>(key: string, transform?: (val: string) => T): T => {
  if (!process.env[key]) {
    throw new Error(`Couldn't find envvar ${key}`);
  }
  if (transform) {
    return transform(process.env[key]);
  }
  return process.env[key] as T;
};

export const config = {
  mongoUrl: tryGet(process.env.MONGO_URL),
};
