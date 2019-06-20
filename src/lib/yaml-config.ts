import fs from 'fs';
import yaml from 'js-yaml';
import merge from 'merge-deep';
import Debug from 'debug';
import {nameMatchs} from './param-match';

const debug = Debug('code:config');

function read(filename: fs.PathLike): any {
  const buffer = fs.readFileSync(filename);
  debug(`config file: ${buffer.toString()}`)
  const data = yaml.load(buffer.toString());

  return data;
}

function handleYamlConfig(config) {
  if ( !config.paths ) return config;
  let pathParams
  let tags = []
  for (const path of config.paths) {
    // 判断path是否具有':',如果有生成的路径要加上单引号
    if (path.path && path.path.includes(':')) {
      path.isColonPath = true
      // 提取路径中的参数
      pathParams = path.path.match(/\:\w+/gi)
    }
    for ( const method of path.ops ) {
      debug( `-----------------method: ${method.operationId}`);
      if(method.tag && !tags.includes(method.tag)) {
        tags.push(method.tag)
      }
      if(method.method) {
        switch(method.method){
          case "get":
            method.isGet = true;
            break;
          case "put":
            method.isPut = true;
            break;
          case "patch":
            method.isPatch = true;
            break;
          case "post":
            method.isPost = true;
            break;
          case "delete":
            method.isDelete = true;
            break;
          case "head":
            method.isHead = true;
            break;
        }
      }
      if (pathParams) {
        method.needFound = true
        // 将路径中的参数加入列表
        if (!method.pathParams) method.pathParams = []
        for( const parm of pathParams ){
          method.pathParams.push({ name: parm.substr(1)})
        }
      }
      if (method.pathParams){
        for(let pathParam of method.pathParams){
          pathParam.ex = nameMatchs(pathParam.name);
          pathParam.name = pathParam.ex.pureName;
          pathParam.isPathParam = true;
        }
      }
      if ( method.queryParams ){
        for( let queryParam of method.queryParams ) {
          queryParam.ex = nameMatchs(queryParam.name);
          queryParam.name = queryParam.ex.pureName;
          queryParam.isQueryParam = true;
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
        debug( `method.responseParams` );
        debug( method.responseParams );
      }
      if ( method.refReqEntity ){
        let ext = nameMatchs(method.refReqEntity)
        if (ext.isArray) {
          method.refReqEntity = ext.pureName
          method.isArrayRefReqEntity = true
        }
      }
      if (method.needResponseRef && method.refResponseEntity) {
        let ext = nameMatchs(method.refResponseEntity)
        if (ext.isArray) {
          method.refResponseEntity = ext.pureName
          method.isArrayRefResponseEntity = true
        }
      }

      // 判断方法是否有任何参数定义
      if (method.needNavPage || method.queryParams || method.pathParams || method.reqBodyParams || method.needReqBodyRef) {
        method.hasMethodParameters = true
      }
      // OPEN API 3.0 reqBodyParams参数不再位于parameters中
      if (method.needNavPage || method.queryParams || method.pathParams ) {
        method.hasMethodParametersFor30 = true
      }
    }
  }

  config.tags = []
  for ( const tag of tags ) {
    config.tags.push({name: tag})
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
  const debug2 = Debug('code:name');

  if ( config.schemas ){
    for ( const entity of config.schemas){
      let nameParams = []
      if ( entity.entityParams ){
        for(let entityParam of entity.entityParams){
          entityParam.ex = nameMatchs(entityParam.name);
          entityParam.name = entityParam.ex.pureName;

          // 判断属性名称是否有Id结尾并有前缀，增加以Name结尾的属性
          if (entityParam.name.endsWith('Id') && entityParam.name.length > 2) {
            debug2(entityParam.name)
            nameParams.push(entityParam.name.substr(0, entityParam.name.length - 2) +'Name')
          }
        }
      }
      // 将Name属性加入实体属性列表
      for (const param of nameParams) {
        entity.entityParams.push({ name: param, notRequired: true, ex: { type: 'string' } })
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
