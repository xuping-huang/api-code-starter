import Debug from 'debug';
import path from 'path';

import * as generator from './lib/generator';
import * as nodeConfig from './lib/yaml-config';

const debug = Debug('code:main');


const main = () => {
  const codeEnv = process.env.CODE_ENV || 'development';
  const configFile = path.resolve(__dirname, '../config/common.yml');
  const config = nodeConfig.load(configFile, codeEnv);
  debug(config);

  return generator.run(config);
};

main();
