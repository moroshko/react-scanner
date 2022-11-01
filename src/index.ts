import path from "path";
import sade from "sade";
import { run } from "./scanner";
import packageJson from "../package.json";

sade("react-scanner", true)
  .version(packageJson.version)
  .describe(packageJson.description)
  .option("-c, --config", "Path to config file")
  .example("-c /path/to/react-scanner.config.js")
  .action((options) => {
    const configPath = path.resolve(process.cwd(), options.config);
    const configDir = path.dirname(configPath);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require(configPath);
    run(config, configDir, "cli");
  })
  .parse(process.argv);
