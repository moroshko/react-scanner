const startTime = process.hrtime.bigint();

const { validateConfig } = require("./utils");
const runScan = require("./run");

const scanner = {
  run: async function run(config, configDir, method = "programmatic") {
    const { crawlFrom, errors } = validateConfig(config, configDir);

    if (errors.length === 0) {
      return await runScan({
        config,
        configDir,
        crawlFrom,
        startTime,
        method: method,
      });
    } else {
      console.error(`Config errors:`);

      errors.forEach((error) => {
        console.error(`- ${error}`);
      });

      process.exit(1);
    }
  },
};

module.exports = scanner;
