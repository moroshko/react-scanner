const fs = require("fs");
const path = require("path");
const execa = require("execa");
const { suite } = require("uvu");
const assert = require("uvu/assert");

const Index = suite("index");

Index("minimal config - outputs to console", async () => {
  const { exitCode, stdout } = await execa("./bin/react-scanner", [
    "-c",
    "./test/configs/minimal.config.js",
  ]);

  const firstLineBreakIndex = stdout.indexOf("\n");
  const firstLine = stdout.slice(0, firstLineBreakIndex);
  const restOutput = stdout.slice(firstLineBreakIndex + 1);
  const codePath = path.resolve(__dirname, "../test/code");

  assert.is(exitCode, 0);
  assert.ok(/^Scanned 2 files in [\d.]+ seconds$/.test(firstLine));
  assert.snapshot(
    restOutput,
    JSON.stringify(
      {
        Container: {
          instances: [
            {
              props: {
                margin: "4",
                hasBreakpointWidth: null,
              },
              propsSpread: false,
              location: {
                file: `${codePath}/Home.js`,
                start: {
                  line: 6,
                  column: 5,
                },
              },
            },
          ],
        },
        Text: {
          instances: [
            {
              props: {
                textStyle: "subtitle2",
              },
              propsSpread: false,
              location: {
                file: `${codePath}/Home.js`,
                start: {
                  line: 7,
                  column: 7,
                },
              },
            },
            {
              props: {
                margin: "4 0 0 0",
              },
              propsSpread: false,
              location: {
                file: `${codePath}/Home.js`,
                start: {
                  line: 10,
                  column: 7,
                },
              },
            },
          ],
        },
        Link: {
          instances: [
            {
              props: {
                href: "https://github.com/moroshko/react-scanner",
                newTab: null,
              },
              propsSpread: false,
              location: {
                file: `${codePath}/Home.js`,
                start: {
                  line: 12,
                  column: 9,
                },
              },
            },
          ],
        },
        div: {
          instances: [
            {
              props: {
                style: "(ObjectExpression)",
              },
              propsSpread: false,
              location: {
                file: `${codePath}/Home.js`,
                start: {
                  line: 16,
                  column: 7,
                },
              },
            },
          ],
        },
        BasisProvider: {
          instances: [
            {
              props: {
                theme: "(Identifier)",
              },
              propsSpread: false,
              location: {
                file: `${codePath}/index.js`,
                start: {
                  line: 8,
                  column: 5,
                },
              },
            },
          ],
        },
        Home: {
          instances: [
            {
              props: {},
              propsSpread: false,
              location: {
                file: `${codePath}/index.js`,
                start: {
                  line: 9,
                  column: 7,
                },
              },
            },
          ],
        },
        App: {
          instances: [
            {
              props: {},
              propsSpread: false,
              location: {
                file: `${codePath}/index.js`,
                start: {
                  line: 14,
                  column: 17,
                },
              },
            },
          ],
        },
      },
      null,
      2
    )
  );
});

Index("valid config - outputs to file", async () => {
  const { exitCode, stdout } = await execa("./bin/react-scanner", [
    "-c",
    "./test/configs/withProcessReport.config.js",
  ]);
  const firstLineBreakIndex = stdout.indexOf("\n");
  const firstLine = stdout.slice(0, firstLineBreakIndex);
  const restOutput = stdout.slice(firstLineBreakIndex + 1);
  const reportPath = path.resolve(
    __dirname,
    "../test/reports/withProcessReport.json"
  );
  const report = fs.readFileSync(reportPath, "utf8");

  assert.is(exitCode, 0);
  assert.ok(/^Scanned 2 files in [\d.]+ seconds$/.test(firstLine));
  assert.equal(restOutput, `See: ${reportPath}`);
  assert.snapshot(
    report,
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
        Container: {
          instances: 1,
          props: {
            hasBreakpointWidth: 1,
            margin: 1,
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

Index("invalid config", async () => {
  try {
    await execa("./bin/react-scanner", [
      "-c",
      "./test/configs/invalid.config.js",
    ]);
  } catch ({ exitCode, stderr }) {
    assert.is(exitCode, 1);
    assert.is(
      stderr,
      [
        "Config errors:",
        "- crawlFrom should be a string",
        "- exclude should be a function",
      ].join("\n")
    );
  }
});

Index.run();
