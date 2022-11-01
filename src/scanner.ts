const startTime = process.hrtime.bigint();

import { validateConfig } from "./utils";
import runScan, { RunMethod } from "./run";
import type { Config } from "./types";

const run = async function run(
  config: Config,
  configDir?: string,
  method: RunMethod = "programmatic"
) {
  const { crawlFrom, errors } = validateConfig(config, configDir);

  if (errors.length === 0) {
    return await runScan({
      config,
      configDir,
      crawlFrom: crawlFrom as string,
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
};

const scanner = {
  run,
};

export default scanner;
export { run };
