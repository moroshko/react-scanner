const fs = require("fs");
const path = require("path");
const execa = require("execa");
const { suite } = require("uvu");
const assert = require("uvu/assert");

const Index = suite("index");

function parseStdout(stdout) {
  const firstLineBreakIndex = stdout.indexOf("\n");

  if (firstLineBreakIndex === -1) {
    return {
      firstLine: stdout,
      restOutput: null,
    };
  }

  return {
    firstLine: stdout.slice(0, firstLineBreakIndex),
    restOutput: stdout.slice(firstLineBreakIndex + 1),
  };
}

Index("no processors", async () => {
  const { exitCode, stdout } = await execa("./bin/react-scanner", [
    "-c",
    "./test/configs/noProcessors.config.js",
  ]);
  const { firstLine, restOutput } = parseStdout(stdout);

  assert.is(exitCode, 0);
  assert.ok(/^Scanned 2 files in [\d.]+ seconds$/.test(firstLine));
  assert.snapshot(
    restOutput,
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

Index("single processor", async () => {
  const { exitCode, stdout } = await execa("./bin/react-scanner", [
    "-c",
    "./test/configs/singleProcessor.config.js",
  ]);
  const { firstLine } = parseStdout(stdout);
  const reportPath = path.resolve(
    __dirname,
    "../test/reports/singleProcessor.json"
  );
  const report = fs.readFileSync(reportPath, "utf8");

  assert.is(exitCode, 0);
  assert.ok(/^Scanned 2 files in [\d.]+ seconds$/.test(firstLine));
  assert.snapshot(
    report,
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

Index("multiple processors", async () => {
  const { exitCode, stdout } = await execa("./bin/react-scanner", [
    "-c",
    "./test/configs/multipleProcessors.config.js",
  ]);
  const { firstLine, restOutput } = parseStdout(stdout);
  const countComponentsAndPropsReportPath = path.resolve(
    __dirname,
    "../test/reports/multipleProcessors-countComponentsAndProps.json"
  );
  const customReportPath = path.resolve(
    __dirname,
    "../test/reports/multipleProcessors-custom.txt"
  );
  const countComponentsAndPropsReport = fs.readFileSync(
    countComponentsAndPropsReportPath,
    "utf8"
  );
  const customReport = fs.readFileSync(customReportPath, "utf8");

  assert.is(exitCode, 0);
  assert.ok(/^Scanned 2 files in [\d.]+ seconds$/.test(firstLine));
  assert.snapshot(
    restOutput,
    JSON.stringify(
      {
        Text: 2,
        BasisProvider: 1,
        Link: 1,
        "React.Fragment": 1,
      },
      null,
      2
    )
  );
  assert.snapshot(
    countComponentsAndPropsReport,
    JSON.stringify(
      {
        Text: {
          instances: 2,
          props: {
            margin: 1,
            textStyle: 1,
          },
        },
        BasisProvider: {
          instances: 1,
          props: {
            theme: 1,
          },
        },
        Link: {
          instances: 1,
          props: {
            href: 1,
            newTab: 1,
          },
        },
        "React.Fragment": {
          instances: 1,
          props: {},
        },
      },
      null,
      2
    )
  );
  assert.is(customReport, "something");
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
        "- exclude should be an array or a function",
      ].join("\n")
    );
  }
});

Index("no files found", async () => {
  try {
    await execa("./bin/react-scanner", [
      "-c",
      "./test/configs/noFilesFound.config.js",
    ]);

    assert.unreachable("should have thrown");
  } catch (err) {
    assert.instance(err, Error);
    assert.match(err.message, "No files found to scan");
  }
});

Index.run();
