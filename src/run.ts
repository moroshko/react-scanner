import fs from "fs";
import path from "path";
import { fdir } from "fdir";
import { isPlainObject } from "is-plain-object";
import scan from "./scan";
import {
  pluralize,
  forEachComponent,
  sortObjectKeysByValue,
  getExcludeFn,
} from "./utils";
import type { Config, ProcessorFunction, ProcessorName, Report } from "./types";

const DEFAULT_GLOBS = ["**/!(*.test|*.spec).@(js|ts)?(x)"];
const DEFAULT_PROCESSORS: ProcessorName[] = ["count-components-and-props"];

export type RunMethod = "cli" | "programmatic";
type RunArgs = {
  config: Config;
  configDir: string | undefined;
  crawlFrom: string;
  startTime: bigint;
  method: RunMethod;
};

async function run({
  config,
  configDir = "",
  crawlFrom,
  startTime,
  method = "cli",
}: RunArgs) {
  const rootDir = config.rootDir || configDir;
  const globs = config.globs || DEFAULT_GLOBS;
  const files = new fdir()
    .glob(...globs)
    .exclude(getExcludeFn(config.exclude))
    .withFullPaths()
    .crawl(crawlFrom)
    .sync();

  if (!Array.isArray(files)) {
    console.error(`Something went wrong.`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error(`No files found to scan.`);
    process.exit(1);
  }

  const report: Report = {};
  const {
    components,
    includeSubComponents,
    importedFrom,
    getComponentName,
    getPropValue,
  } = config;

  for (let i = 0, len = files.length; i < len; i++) {
    const filePath = files[i];
    if (typeof filePath !== "string") continue;
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
  const prevResults: unknown[] = [];
  const output = (data: unknown, destination?: string) => {
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
        const filePath = path.resolve(rootDir, dest);

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, dataStr);
      }
    }
  };

  for (const processor of processors) {
    let processorFn: ProcessorFunction | undefined = undefined;

    if (typeof processor === "string") {
      processorFn = (await import(`./processors/${processor}`)).default();
    } else if (Array.isArray(processor)) {
      processorFn = (await import(`./processors/${processor[0]}`)).default(
        processor[1]
      );
    } else if (typeof processor === "function") {
      processorFn = processor;
    }

    if (processorFn) {
      const result: unknown = await processorFn({
        report,
        prevResults,
        prevResult: prevResults[prevResults.length - 1],
        forEachComponent: forEachComponent(report),
        sortObjectKeysByValue: sortObjectKeysByValue,
        output,
      });

      prevResults.push(result);
    }
  }

  return prevResults[prevResults.length - 1];
}

export default run;
