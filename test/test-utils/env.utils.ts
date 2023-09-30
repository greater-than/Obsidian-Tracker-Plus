import { clone } from '../../src/utils/object.utils';
import { successMark } from './console.utils';

export const cacheEnv = (): NodeJS.ProcessEnv => {
  console.log('\nCaching environment...');
  const env = clone(process.env);
  console.log(`${successMark} Environment cached\n`);
  return env;
};

export const restoreEnv = (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv => {
  console.log('\nRestoring environment...');
  process.env = env;
  console.log(`${successMark} Environment restored from cache\n`);
  return process.env;
};
