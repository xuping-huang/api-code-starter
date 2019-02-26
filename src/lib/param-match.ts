
import fs from 'fs';
import yaml from 'js-yaml';
import merge from 'merge-deep';
import Debug from 'debug';
import path from 'path';

const debug = Debug('code:param');

// ##########################################################################
// param define
// ##########################################################################
const DATE_PARAM = {
  type: "string",
  format: "date-time",
  description: "date-time",
  example: "\'2019-01-10T07:10:34.623Z\'",
  hasFormat: true,
  isDate: true
}

const BOOL_PARAM = {
  type: "boolean",
  description: "boolean",
  example: false,
  isBool: true
}

const STR_PARAM = {
  type: "string",
  description: "string",
  example: 'str'
}

const INT_PARAM = {
  type: "integer",
  format: "int32",
  description: "int32",
  example: 10,
  isInt: true,
  hasFormat: true
}

const LONG_PARAM = {
  type: "integer",
  format: "int64",
  description: "int64",
  example: 100,
  isLong: true,
  hasFormat: true
}

const FLOAT_PARAM = {
  type: "number",
  format: "float",
  description: "float",
  example: 1.01,
  isFloat: true,
  hasFormat: true
}

const OTHERWISE_PARAM = {
  type: "string",
  description: "",
  example: ""
}

const ID_PARAM = {
  $ref: "#/components/schemas/Id",
  $ref2: "#/definitions/Id",
  description: "id",
  isRef: true,
  isId: true,
  type: "string"
}

const REF_PARAM = {
  $ref: "#/components/schemas/",
  $ref2: "#/definitions/",
  isRef: true
}

const ENUM_PARAM = {
  type: "string",
  enum: '["one", "two"]',
  description: "onetwo",
  isEnum: true,
  example: 'one'
}

const BOOL_ENUM_PARAM = {
  type: "string",
  enum: '["Y", "N"]',
  description: "yes or no",
  isEnum: true,
  example: '\"N\"'
}

const STR_ARRAY_PARAM = {
  type: "array",
  itemType: "string",
  description: "array of ",
  isArray: true,
  example: "['a','b']"
}

const NUM_ARRAY_PARAM = {
  type: "array",
  itemType: "number",
  description: "array of ",
  isArray: true,
  example: '[1.01,2.02,3.03]'
}

const INT_ARRAY_PARAM = {
  type: "array",
  itemType: "integer",
  description: "array of ",
  isArray: true,
  isIntArray: true,
  example: '[1,2,3]'
}

const LONG_ARRAY_PARAM = {
  type: "array",
  itemType: "integer",
  description: "array of ",
  isArray: true,
  isLongArray: true,
  example: '[1,2,3]'
}

const REF_ARRAY_PARAM = {
  type: "array",
  $ref: "#/components/schemas/",
  $ref2: "#/definitions/",
  description: "array of ",
  isArray: true,
  isRefArray: true
}

const OBJ_ARRAY_PARAM = {
  type: "array",
  itemType: "object",
  description: "array of ",
  isArray: true,
  isObjectArray: true
}

const OBJ_PARAM = {
  type: "object",
  description: "object",
  isObject: true
}

// ##########################################################################
// handler define
// ##########################################################################
function matchWrap(paramEx, fun){
  return function(name) {
    const word = parseName(name);
    return fun(word, paramEx);
  }
}


interface ParsedName {
  lowerName: string,
  pureName: string,
  pureNameCamel: string,
  underSuffix: string,
  purePrefix: string,
  pureSuffix: string,
  beforeSuffix: string,
  description: string
}

function parseName(name: string) : ParsedName {
  // name = challengeType_ref
  // lowname = challengetype_ref
  const lowerName = name.toLowerCase().trim();
  // 按照第一个_进行分离
  const underInd = name.indexOf('_');
  let pureName = name ;
  let underSuffix = "";
  if ( underInd > -1 ){
    // pureName = challengeType
    pureName = name.substr(0, underInd);
    // underSuffix = ref
    underSuffix = name.substr(underInd, name.length - underInd);
  }
  // pureNameCamel = ChallengeType
  let pureNameCamel = pureName[0].toUpperCase() + pureName.substr(1, pureName.length - 1);
  let nameWords = pureName.match(/[A-Z]*[^A-Z]+/g); // nameWords = ['challenge', 'Type']
  let lowerWords = nameWords.map(word => word.toLowerCase().trim()); // lowerWords = ['challenge', 'type']
  let purePrefix = lowerWords[0];  // challenge
  let pureSuffix = lowerWords[lowerWords.length-1]; // type
  let description = lowerWords.join(' ');
  let beforeSuffix = pureNameCamel.substr(0, pureNameCamel.length - lowerWords[lowerWords.length-1].length)
  return {
    lowerName,
    pureName,
    pureNameCamel,
    underSuffix,
    purePrefix,
    pureSuffix,
    beforeSuffix,
    description
  }
}

// console.log(parseName("lookupForNewUser_bool_enum"));

function read(filename: fs.PathLike): any {
  const buffer = fs.readFileSync(filename);
  const data = yaml.load(buffer.toString());

  return data;
}

const param_file = path.resolve(__dirname, `./predefineParams.yml`);
const predefine_params = read(param_file);

// lookup in predefine param
const lookupMatch = matchWrap({}, (word: ParsedName) => {
  for( const preParam of predefine_params ){
    if ( preParam.name === word.lowerName )
      return merge(preParam.ex, {pureName: word.pureName});
  }
  return undefined;
})

const arrayMatch = (lookElm: string, word: ParsedName, matches: Array<string>, paramEx) =>{
  if ( matches.find(elm => elm === lookElm) ){
    return merge(paramEx, { beforeSuffix: word.beforeSuffix, description: word.description, pureName: word.pureName });
  }
  return undefined;
}

const endMatch = (word: ParsedName, matches: Array<string>, paramEx) => {
  return arrayMatch(word.pureSuffix, word, matches, paramEx);
}

const startMatch = (word: ParsedName, matches, paramEx) => {
  return arrayMatch(word.purePrefix, word, matches, paramEx);
}

const underMatch = (word: ParsedName, matches, paramEx) => {
  return arrayMatch(word.underSuffix, word, matches, paramEx);
}

const dateEndMatch = matchWrap(DATE_PARAM, (word: ParsedName, paramEx) => {
  return endMatch( word, ['on', 'at', 'date', 'time'], paramEx);
});

const dateStartMatch = matchWrap(DATE_PARAM, (word: ParsedName, paramEx) => {
  return startMatch( word, ['date','time'], paramEx);
});

const boolStartMatch = matchWrap(BOOL_PARAM, (word: ParsedName, paramEx) => {
  return startMatch( word, ['is', 'has', 'have', 'had', 'been'], paramEx);
});

const boolUnderMatch = matchWrap(BOOL_PARAM, (word: ParsedName, paramEx) => {
  return underMatch( word, ['_bool'], paramEx);
});

const intEndMatch = matchWrap(INT_PARAM, (word: ParsedName, paramEx)=>{
  return endMatch( word, ['count', 'total', 'index', 'level', 'score', 'version', 'number'], paramEx);
});

const strUnderMatch = matchWrap(STR_PARAM, (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_str', '_string'], paramEx);
});

const intUnderMatch = matchWrap(INT_PARAM, (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_int'], paramEx);
});

const longUnderMatch = matchWrap(LONG_PARAM, (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_long'], paramEx);
});

const floatUnderMatch = matchWrap(FLOAT_PARAM, (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_num', '_number', '_float'], paramEx);
});

const enumUnderMatch = matchWrap(ENUM_PARAM, (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_enum'], paramEx);
});

const boolEnumUnderMatch = matchWrap(BOOL_ENUM_PARAM, (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_bool_enum', '_enum_bool'], paramEx);
});

const arrayUnderMatch = (word, matches, paramEx) => {
  const param = underMatch( word, matches, paramEx);
  if ( param ) {
    param.description = "array of " + word.description;
  }
  return param;
}

const strArrayUnderMatch = matchWrap(STR_ARRAY_PARAM, (word: ParsedName, paramEx)=>{
  return arrayUnderMatch(word, ['_array', '_array_str', '_array_string', '_str_array', '_string_array'], paramEx);
});

const numberArrayUnderMatch = matchWrap(NUM_ARRAY_PARAM, (word: ParsedName, paramEx)=>{
  return arrayUnderMatch(word, ['_array_number', '_array_num', '_num_array', '_number_array'], paramEx);
});

const refArrayUnderMatch = matchWrap(REF_ARRAY_PARAM, (word: ParsedName, paramEx)=>{
  const param = underMatch( word, ['_array_ref','_ref_array'], paramEx);
  if ( param ) {
    param.description = "array of " + word.description;
    param.$ref = param.$ref + word.pureNameCamel;
    param.$ref2 = param.$ref2 + word.pureNameCamel;
  }
  return param;
});

const objUnderMatch = matchWrap(OBJ_PARAM,  (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_obj'], paramEx);
});

const objArrayUnderMatch = matchWrap(OBJ_ARRAY_PARAM, (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_array_obj', '_obj_array'], paramEx);
});

const longArrayUnderMatch = matchWrap(LONG_ARRAY_PARAM, (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_array_long', '_long_array'], paramEx);
});

const intArrayUnderMatch = matchWrap(INT_ARRAY_PARAM, (word: ParsedName, paramEx)=>{
  return underMatch( word, ['_array_int', '_int_array'], paramEx);
});

const refUnderMatch = matchWrap(REF_PARAM, (word: ParsedName, paramEx)=>{
  const param = underMatch( word, ['_ref', '_entity'], paramEx);
  if ( param ) {
    param.$ref = param.$ref + word.pureNameCamel;
    param.$ref2 = param.$ref2 + word.pureNameCamel;
  }
  return param;
});

const idEndMatch = matchWrap(ID_PARAM, (word: ParsedName, paramEx)=>{
  debug('-----------idEndMatch----------------')
  debug(word)
  return endMatch( word, ['id'], paramEx);
});

// otherwise
const otherwiseMatch = matchWrap(OTHERWISE_PARAM, (word: ParsedName, paramEx)=>{
  return merge(paramEx, { description: word.description, example: word.description, pureName: word.pureName});
});

function dispatch(...funs){
  const size = funs.length;

  return function(name) {
    let ret = undefined;
    for( let ind=0; ind < size; ind++){
      const fun = funs[ind];
      ret = fun(name);
      if (ret) return ret;
    }
    return ret;
  }
}

export const nameMatchs = dispatch( lookupMatch, // lookupMatch must at start
  dateEndMatch,
  dateStartMatch,
  boolStartMatch,
  boolUnderMatch,
  intEndMatch,
  intUnderMatch,
  strUnderMatch,
  longUnderMatch,
  floatUnderMatch,
  idEndMatch,
  enumUnderMatch,
  boolEnumUnderMatch,
  refUnderMatch,
  strArrayUnderMatch,
  numberArrayUnderMatch,
  refArrayUnderMatch,
  objArrayUnderMatch,
  objUnderMatch,
  intArrayUnderMatch,
  longArrayUnderMatch,
  otherwiseMatch); // otherwiseMatch must at end
