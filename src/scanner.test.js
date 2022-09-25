const path = require("path");
const { suite } = require("uvu");
const assert = require("uvu/assert");

const scanner = require("./scanner");

const Scanner = suite("Scanner");

Scanner("no processors", async () => {
  const output = await scanner.run({
    crawlFrom: "code",
    rootDir: path.resolve("./test"),
  });

  assert.snapshot(
    JSON.stringify(output, undefined, 2),
    JSON.stringify(
      {
        Text: {
          instances: 2,
          props: {
            margin: 1,
            textStyle: 1,
          },
        },
        App: {
          instances: 1,
          props: {},
        },
        BasisProvider: {
          instances: 1,
          props: {
            theme: 1,
          },
        },
        Home: {
          instances: 1,
          props: {},
        },
        Link: {
          instances: 1,
          props: {
            href: 1,
            newTab: 1,
          },
        },
        div: {
          instances: 1,
          props: {
            style: 1,
          },
        },
      },
      null,
      2
    )
  );
});

Scanner("single processor", async () => {
  const output = await scanner.run({
    crawlFrom: "code",
    rootDir: path.resolve("./test"),
    processors: ["count-components"],
  });

  assert.snapshot(
    JSON.stringify(output, undefined, 2),
    JSON.stringify(
      {
        Text: 2,
        App: 1,
        BasisProvider: 1,
        Home: 1,
        Link: 1,
        div: 1,
      },
      null,
      2
    )
  );
});

Scanner.run();
