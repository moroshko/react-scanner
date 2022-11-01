import fs from "fs";
import path from "path";
import { fdir } from "fdir";

const processorFiles = new fdir()
  .glob("**/!(*.test).ts")
  .crawl(path.resolve(__dirname, "../src/processors"))
  .sync();

if (Array.isArray(processorFiles)) {
  const processorsMap = processorFiles
    .map((file) =>
      typeof file === "string" ? path.parse(file).name : file.dir
    )
    .sort()
    .reduce<Record<string, true>>((acc, processor) => {
      acc[processor] = true;
      return acc;
    }, {});

  fs.writeFileSync(
    path.resolve(__dirname, "../src/processors/processors.json"),
    JSON.stringify(processorsMap, null, 2) + "\n"
  );
}
