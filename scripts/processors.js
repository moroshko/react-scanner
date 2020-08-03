const fs = require("fs");
const path = require("path");
const { fdir } = require("fdir");

const processorsMap = new fdir()
  .glob(["**/!(*.test).js"])
  .crawl(path.resolve(__dirname, "../src/processors"))
  .sync()
  .map((file) => path.parse(file).name)
  .sort()
  .reduce((acc, processor) => {
    acc[processor] = true;
    return acc;
  }, {});

fs.writeFileSync(
  path.resolve(__dirname, "../src/processors/processors.json"),
  JSON.stringify(processorsMap, null, 2) + "\n"
);
