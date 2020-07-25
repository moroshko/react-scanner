const startTime = process.hrtime.bigint();

const path = require("path");
const sade = require("sade");
const { validateConfig } = require("./utils");
const run = require("./run");
const packageJson = require("../package.json");

sade("react-scanner", true)
  .version(packageJson.version)
  .describe(packageJson.description)
  .option("-c, --config", "Path to config file")
  .example("-c /path/to/react-scanner.config.js")
  .action((options) => {
    const configPath = path.resolve(process.cwd(), options.config);
    const configDir = path.dirname(configPath);
    const config = require(configPath);
    const { crawlFrom, errors } = validateConfig(config, configDir);

    if (errors.length === 0) {
      run({
        config,
        configDir,
        crawlFrom,
        startTime,
      });
    } else {
      console.error(`Config errors:`);

      errors.forEach((error) => {
        console.error(`- ${error}`);
      });
    }
  })
  .parse(process.argv);
