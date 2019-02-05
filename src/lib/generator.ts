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

const prepareOutputDir = (outputDir: string) => {
  const srcDir = path.resolve(outputDir, 'src');
  if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
    fs.mkdirSync(srcDir);
  } else {
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir);
    }
  }
}

export const run = (config: any): any => {
  const templateDir = path.resolve(__dirname, '../../templates', config.project.templateSwitch);
  debug("template dir:"+templateDir);
  const outputDir = path.resolve(__dirname, '../../output');
  prepareOutputDir(outputDir);

  const templates = findTemplates(templateDir, []);
  templates.forEach((template) =>{
    debug(`${template.filePath} -->\n`);
    const renderContent = codeGenerate(template.filePath, config);
    const renderDir = template.fileDir.toString().replace(templateDir.toString(), outputDir.toString());
    if (!fs.existsSync(renderDir)){
      fs.mkdirSync(renderDir);
    }
    const renderFile = path.resolve(renderDir, template.name);
    debug(`${renderFile}\n`);
    fs.writeFileSync(renderFile, renderContent);
  })
};
