import Debug from 'debug';
import path from 'path';
import * as _ from 'lodash';
import * as generator from './lib/generator';
import * as nodeConfig from './lib/yaml-config';

const debug = Debug('code:main');


const main = () => {
  const codeEnv = process.env.CODE_ENV || 'development';
  const nameEnv = process.env.NAME_ENV || 'project-name';
  const configEnv = process.env.CONFIG_ENV || 'common.yml'
  const configFile = path.resolve(__dirname, `../config/${configEnv}`);
  const config = nodeConfig.load(configFile, codeEnv);
  config.project.name = nameEnv;
  config.project.description = _.startCase(nameEnv);
  debug(config);

  return generator.run(config);
};

main();
