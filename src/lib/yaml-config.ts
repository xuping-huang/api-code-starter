import fs from 'fs';
import yaml from 'js-yaml';
import merge from 'merge-deep';
import Debug from 'debug';

const debug = Debug('code:config');

function read(filename: fs.PathLike): any {
  const buffer = fs.readFileSync(filename);
  const data = yaml.load(buffer.toString());

  return data;
}

/**
 * Loads a yaml configuration
 * If the file has already been parsed, the file is not read again.
 */
export const load = (filename: fs.PathLike, env: string) : any => {
  const data = read(filename);

  const envNode = env || process.env.NODE_ENV || 'development';
  const defaultConfig = data.defaults || {};
  const envNodes = envNode.split(",");
  debug(`envNodes: ${envNodes}`);

  const config = envNodes.reduce((previousConfig, currentEnv) => {
    debug(`previousConfig: `);
    debug(previousConfig);
    debug(`data[${currentEnv}]: `);
    debug(data[currentEnv] );
    return merge(previousConfig, data[currentEnv] || {});
  }, defaultConfig)

  debug(config);
  return config;
};
