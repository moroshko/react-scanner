const fs = require("fs");
const path = require("path");
const fdir = require("fdir");
const scan = require("./scan");
const {
  pluralize,
  forEachComponent,
  sortObjectKeysByValue,
} = require("./utils");

const DEFAULT_GLOBS = ["**/!(*.test|*.spec).@(js|ts)?(x)"];

function run({ config, configDir, crawlFrom, startTime }) {
  const globs = config.globs || DEFAULT_GLOBS;
  const files = new fdir()
    .glob(...globs)
    .exclude(config.exclude)
    .withFullPaths()
    .crawl(crawlFrom)
    .sync();

  let report = {};
  const { components, includeSubComponents, importedFrom } = config;

  for (let i = 0, len = files.length; i < len; i++) {
    const filePath = files[i];
    const code = fs.readFileSync(filePath, "utf8");

    scan({
      code,
      filePath,
      components,
      includeSubComponents,
      importedFrom,
      report,
    });
  }

  const logSummary = () => {
    const endTime = process.hrtime.bigint();

    // eslint-disable-next-line no-console
    console.log(
      `Scanned ${pluralize(files.length, "file")} in ${
        Number(endTime - startTime) / 1e9
      } seconds`
    );
  };

  if (typeof config.processReport === "function") {
    config.processReport({
      report,
      forEachComponent: forEachComponent(report),
      sortObjectKeysByValue,
      writeFile: (outputPath, object) => {
        const data = JSON.stringify(object, null, 2);
        const filePath = path.resolve(configDir, outputPath);

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, data);

        logSummary();

        // eslint-disable-next-line no-console
        console.log(`See: ${filePath}`);
      },
    });
  } else {
    logSummary();

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(report, null, 2));
  }
}

module.exports = run;
