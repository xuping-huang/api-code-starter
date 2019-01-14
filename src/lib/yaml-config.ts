import fs from 'fs';
import yaml from 'js-yaml';
import merge from 'merge-deep';

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

  const config = envNodes.reduce((previousConfig, currentEnv) => {
    return merge(previousConfig, data[currentEnv] || {});
  }, defaultConfig)

  return config;
};
