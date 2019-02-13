import Debug from 'debug';
import fs from 'fs';
import * as Mustache from 'mustache' ;
import path from 'path';

const debug = Debug('code:generator');

interface TemplateInfo {
  filePath: fs.PathLike,
  fileDir: fs.PathLike,
  name: string
}

const findTemplates = (rootPath: fs.PathLike, templates: TemplateInfo[]): TemplateInfo[] => {
  const root = fs.readdirSync(rootPath)
  root.forEach((subItem) => {
    const subDir = path.resolve(rootPath.toString(), subItem);
    const info = fs.statSync(subDir)
    if (info.isDirectory()) {
      findTemplates(subDir, templates);
    } else {
      const mustacheEnd = '.mustache';
      if (subItem.endsWith(mustacheEnd)) {
        templates.push({
          filePath: subDir,
          fileDir: rootPath,
          name: subItem.substr(0, subItem.length - mustacheEnd.length),
        })
      }
    }
  })
  return templates
}

const codeGenerate = (templatePath: any, config: any) => {
  const bf = fs.readFileSync(templatePath)
  const renderContent = Mustache.render(bf.toString('utf8'), config)

  return renderContent;
}

const mkdirs = (dirpath, callback) => {
  fs.exists(dirpath, function (exists) {
    if (exists) {
      callback(dirpath);
    } else {
      //尝试创建父目录，然后再创建当前目录
      mkdirs(path.dirname(dirpath), function () {
        fs.mkdir(dirpath, callback);
      });
    }
  });
};

const mkdirsSync = (dirpath: string) => {
      try
      {
          if (!fs.existsSync(dirpath)) {
              let pathtmp : fs.PathLike;
              dirpath.split(/[/\\]/).forEach(function (dirname) {
                  if (pathtmp) {
                      pathtmp = path.join(pathtmp.toString(), dirname);
                  }
                  else {
                      pathtmp = dirname;
                  }
                  if (!fs.existsSync(pathtmp)) {
                      fs.mkdirSync(pathtmp);
                  }
              });
          }
          return true;
      }catch(e)
      {
          debug("create director fail! path=" + dirpath +" errorMsg:" + e);
          return false;
      }
  }

export const run = (config: any): any => {
  const templateDir = path.resolve(__dirname, '../../templates', config.project.templateSwitch);
  debug("template dir:"+templateDir);
  const outputDir = path.resolve(__dirname, '../../output');

  const templates = findTemplates(templateDir, []);
  templates.forEach((template) =>{
    debug(`${template.filePath} -->\n`);
    const renderContent = codeGenerate(template.filePath, config);
    const renderDir = template.fileDir.toString().replace(templateDir.toString(), outputDir.toString());
    const genDir = renderDir.replace("java\\com\\project\\app", `java\\com\\${config.project.name}\\app`);
    debug(`${genDir}\n`);
    mkdirsSync(genDir);
    const renderFile = path.resolve(genDir, template.name);
    debug(`render file: ${renderFile}\n`);
    fs.writeFileSync(renderFile, renderContent);
  })
};
