const fs = require("fs");
const path = require("path");
const { fdir } = require("fdir");
const isPlainObject = require("is-plain-object");
const scan = require("./scan");
const {
  pluralize,
  forEachComponent,
  sortObjectKeysByValue,
} = require("./utils");

const DEFAULT_GLOBS = ["**/!(*.test|*.spec).@(js|ts)?(x)"];
const DEFAULT_PROCESSORS = ["count-components-and-props"];

async function run({ config, configDir, crawlFrom, startTime }) {
  const globs = config.globs || DEFAULT_GLOBS;
  const files = new fdir()
    .glob(...globs)
    .exclude(config.exclude)
    .withFullPaths()
    .crawl(crawlFrom)
    .sync();

  let report = {};
  const {
    components,
    includeSubComponents,
    importedFrom,
    getComponentName,
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
  const output = (data, destination = "stdout") => {
    const dataStr = isPlainObject(data)
      ? JSON.stringify(data, null, 2)
      : String(data);

    if (destination === "stdout") {
      // eslint-disable-next-line no-console
      console.log(dataStr);
    } else {
      const filePath = path.resolve(configDir, destination);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, dataStr);
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
}

module.exports = run;
