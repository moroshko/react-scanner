const fs = require("fs");
const path = require("path");
const { fdir } = require("fdir");
const { isPlainObject } = require("is-plain-object");
const scan = require("./scan");
const {
  pluralize,
  forEachComponent,
  sortObjectKeysByValue,
  getExcludeFn,
} = require("./utils");

const DEFAULT_GLOBS = ["**/!(*.test|*.spec).@(js|ts)?(x)"];
const DEFAULT_PROCESSORS = ["count-components-and-props"];

async function run({
  config,
  configDir,
  crawlFrom,
  startTime,
  method = "cli",
}) {
  const rootDir = config.rootDir || configDir;
  const globs = config.globs || DEFAULT_GLOBS;
  const files = new fdir()
    .glob(...globs)
    .exclude(getExcludeFn(config.exclude))
    .withFullPaths()
    .crawl(crawlFrom)
    .sync();

  if (files.length === 0) {
    console.error(`No files found to scan.`);
    throw new Error(`No files found to scan.`);
  }

  let report = {};
  const {
    components,
    includeSubComponents,
    importedFrom,
    getComponentName,
    getPropValue,
  } = config;

  for (let i = 0, len = files.length; i < len; i++) {
    const filePath = files[i];
    const code = fs.readFileSync(filePath, "utf8");

    scan({
      code,
      filePath,
      components,
      includeSubComponents,
      importedFrom,
      getComponentName,
      report,
      getPropValue,
    });
  }

  const endTime = process.hrtime.bigint();

  // eslint-disable-next-line no-console
  console.log(
    `Scanned ${pluralize(files.length, "file")} in ${
      Number(endTime - startTime) / 1e9
    } seconds`
  );

  const processors =
    config.processors && config.processors.length > 0
      ? config.processors
      : DEFAULT_PROCESSORS;
  const prevResults = [];
  const output = (data, destination) => {
    const defaultDestination = method === "cli" ? "stdout" : "return";
    const dest = destination || defaultDestination;
    const dataStr = isPlainObject(data)
      ? JSON.stringify(data, null, 2)
      : String(data);

    switch (dest) {
      case "stdout": {
        // eslint-disable-next-line no-console
        console.log(dataStr);
        break;
      }
      case "return": {
        break;
      }
      default: {
        const filePath = path.resolve(rootDir, destination);

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, dataStr);
      }
    }
  };

  for (const processor of processors) {
    let processorFn;

    if (typeof processor === "string") {
      processorFn = require(`./processors/${processor}`)();
    } else if (Array.isArray(processor)) {
      processorFn = require(`./processors/${processor[0]}`)(processor[1]);
    } else if (typeof processor === "function") {
      processorFn = processor;
    }

    const result = await processorFn({
      report,
      prevResults,
      prevResult: prevResults[prevResults.length - 1],
      forEachComponent: forEachComponent(report),
      sortObjectKeysByValue,
      output,
    });

    prevResults.push(result);
  }

  return prevResults[prevResults.length - 1];
}

module.exports = run;
