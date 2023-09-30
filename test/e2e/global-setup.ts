import 'colors';
import * as dotenv from 'dotenv';
import * as tsNode from 'ts-node';
import { cacheEnv, divider } from '../test-utils';

tsNode.register();
dotenv.config();

export let origEnv: NodeJS.ProcessEnv;

const globalSetup = async (): Promise<void> => {
  console.log('\n\nRun e2e Tests');
  console.log(`${divider.cyan}`);
  console.log('Setup...'.italic);
  origEnv = cacheEnv();
};

export default globalSetup;
