const path = require("path");
const sade = require("sade");
const { run } = require("./scanner");
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
    run(config, configDir, "cli");
  })
  .parse(process.argv);
