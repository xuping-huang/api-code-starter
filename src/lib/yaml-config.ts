import fs from 'fs';
import yaml from 'js-yaml';
import merge from 'merge-deep';
import Debug from 'debug';
import {nameMatchs} from './param-match';

const debug = Debug('code:config');

function read(filename: fs.PathLike): any {
  const buffer = fs.readFileSync(filename);
  const data = yaml.load(buffer.toString());

  return data;
}

function handleYamlConfig(config) {
  if ( !config.paths ) return config;

  for (const path of config.paths) {
    for ( const method of path.ops ) {
      debug( `method: ${method.operationId}`);
      if ( method.queryParams ){
        for( let queryParam of method.queryParams ) {
          queryParam.ex = nameMatchs(queryParam.name);
          queryParam.name = queryParam.ex.pureName;
        }
        debug( method.queryParams );
      }
      if ( method.reqBodyParams ){
        for( let bodyParam of method.reqBodyParams ) {
          bodyParam.ex = nameMatchs(bodyParam.name);
          bodyParam.name = bodyParam.ex.pureName;
        }
        debug( method.reqBodyParams );
      }
      if ( method.responseParams ){
        for( let resParam of method.responseParams ) {
          resParam.ex = nameMatchs(resParam.name);
          resParam.name = resParam.ex.pureName;
        }
        debug( method.responseParams );
      }
    }
  }

  if ( config.responses ){
    for ( const entity of config.responses){
      if ( entity.entityParams ){
        for(let entityParam of entity.entityParams){
          entityParam.ex = nameMatchs(entityParam.name);
          entityParam.name = entityParam.ex.pureName;
        }
      }
      debug('config.responses.entityParams');
      debug( entity.entityParams );
    }
  }

  if ( config.requestBodies ){
    for ( const entity of config.requestBodies){
      if ( entity.entityParams ){
        for(let entityParam of entity.entityParams){
          entityParam.ex = nameMatchs(entityParam.name);
          entityParam.name = entityParam.ex.pureName;
        }
      }
      debug('config.requestBodies.entityParams');
      debug( entity.entityParams );
    }
  }

  if ( config.schemas ){
    for ( const entity of config.schemas){
      if ( entity.entityParams ){
        for(let entityParam of entity.entityParams){
          entityParam.ex = nameMatchs(entityParam.name);
          entityParam.name = entityParam.ex.pureName;
        }
      }
      debug('config.schemas.entityParams');
      debug( entity.entityParams );
    }
  }

  return config;
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

  const orginConfig = envNodes.reduce((previousConfig, currentEnv) => {
    debug(`previousConfig: `);
    debug(previousConfig);
    debug(`data[${currentEnv}]: `);
    debug(data[currentEnv] );
    return merge(previousConfig, data[currentEnv] || {});
  }, defaultConfig)

  const config = handleYamlConfig(orginConfig);

  debug(config);
  return config;
};
