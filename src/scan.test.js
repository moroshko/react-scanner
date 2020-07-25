const { suite } = require("uvu");
const assert = require("uvu/assert");
const scan = require("./scan");

const Scan = suite("scan");

Scan.before((context) => {
  context.getReport = (filePath, code, { includeSubComponents } = {}) => {
    const report = {};

    scan({
      code,
      filePath,
      components: {
        Header: true,
        Text: true,
      },
      ...(includeSubComponents != null && { includeSubComponents }),
      report,
    });

    return report;
  };
});

Scan.after((context) => {
  context.getReport = undefined;
});

Scan("invalid code", ({ getReport }) => {
  const originalConsoleError = global.console.error;
  let errors = [];

  global.console.error = (...args) => {
    errors = errors.concat(args);
  };

  const report = getReport("invalid-code.js", `<foo`);

  assert.equal(errors, ["Failed to parse: invalid-code.js"]);
  assert.equal(report, {});

  global.console.error = originalConsoleError;
});

Scan("unknown components", ({ getReport }) => {
  const report = getReport(
    "unknown-components.js",
    `
    <div>
      <Button>Submit</Button>
      <Footer />
    </div>
  `
  );

  assert.equal(report, {});
});

Scan("ignores comments", ({ getReport }) => {
  const report = getReport("ignores-comments.js", `{/* <Text>Hello</Text> */}`);

  assert.equal(report, {});
});

Scan("self closing", ({ getReport }) => {
  const report = getReport("self-closing.js", `<Header />`);

  assert.equal(report, {
    Header: {
      instances: [
        {
          props: {},
          propsSpread: false,
          location: {
            file: "self-closing.js",
            start: {
              line: 1,
              column: 1,
            },
          },
        },
      ],
    },
  });
});

Scan("no props", ({ getReport }) => {
  const report = getReport("no-props.js", `<Text>Hello</Text>`);

  assert.equal(report, {
    Text: {
      instances: [
        {
          props: {},
          propsSpread: false,
          location: {
            file: "no-props.js",
            start: {
              line: 1,
              column: 1,
            },
          },
        },
      ],
    },
  });
});

Scan("prop with no value", ({ getReport }) => {
  const report = getReport(
    "prop-with-no-value.js",
    `<Text foo bar={true}>Hello</Text>`
  );

  assert.equal(report, {
    Text: {
      instances: [
        {
          props: {
            foo: null,
            bar: true,
          },
          propsSpread: false,
          location: {
            file: "prop-with-no-value.js",
            start: {
              line: 1,
              column: 1,
            },
          },
        },
      ],
    },
  });
});

Scan("props with literal values", ({ getReport }) => {
  const report = getReport(
    "props-with-literal-values.js",
    `<Text textStyle="heading2" wrap={false} columns={3}>Hello</Text>`
  );

  assert.equal(report, {
    Text: {
      instances: [
        {
          props: {
            textStyle: "heading2",
            wrap: false,
            columns: 3,
          },
          propsSpread: false,
          location: {
            file: "props-with-literal-values.js",
            start: {
              line: 1,
              column: 1,
            },
          },
        },
      ],
    },
  });
});

Scan("props with other values", ({ getReport }) => {
  const report = getReport(
    "props-with-other-values.js",
    `<Text foo={bar} style={{object}}>Hello</Text>`
  );

  assert.equal(report, {
    Text: {
      instances: [
        {
          props: {
            foo: "(Identifier)",
            style: "(ObjectExpression)",
          },
          propsSpread: false,
          location: {
            file: "props-with-other-values.js",
            start: {
              line: 1,
              column: 1,
            },
          },
        },
      ],
    },
  });
});

Scan("with props spread", ({ getReport }) => {
  const report = getReport(
    "with-props-spread.js",
    `<Text {...someProps}>Hello</Text>`
  );

  assert.equal(report, {
    Text: {
      instances: [
        {
          props: {},
          propsSpread: true,
          location: {
            file: "with-props-spread.js",
            start: {
              line: 1,
              column: 1,
            },
          },
        },
      ],
    },
  });
});

Scan("no sub components by default", ({ getReport }) => {
  const report = getReport(
    "no-sub-components-by-default.js",
    `
    <Header>
      <Header.Logo />
    </Header>
  `
  );

  assert.equal(report, {
    Header: {
      instances: [
        {
          props: {},
          propsSpread: false,
          location: {
            file: "no-sub-components-by-default.js",
            start: {
              line: 2,
              column: 5,
            },
          },
        },
      ],
    },
  });
});

Scan("with sub components", ({ getReport }) => {
  const report = getReport(
    "with-sub-components.js",
    `
    <Header>
      <Header.Logo />
    </Header>
  `,
    {
      includeSubComponents: true,
    }
  );

  assert.equal(report, {
    Header: {
      instances: [
        {
          props: {},
          propsSpread: false,
          location: {
            file: "with-sub-components.js",
            start: {
              line: 2,
              column: 5,
            },
          },
        },
      ],
      components: {
        Logo: {
          instances: [
            {
              props: {},
              propsSpread: false,
              location: {
                file: "with-sub-components.js",
                start: {
                  line: 3,
                  column: 7,
                },
              },
            },
          ],
        },
      },
    },
  });
});

Scan("deeply nested sub components", ({ getReport }) => {
  const report = getReport(
    "deeply-nested-sub-components.js",
    `
    <Header>
      <Header.Logo name="foo" />
      <Header.Content>
        <Header.Content.Column>
          Hello
          <Header.Content.Column.Title variant="important">
            Title
          </Header.Content.Column.Title>
        </Header.Content.Column>
      </Header.Content>
    </Header>
  `,
    {
      includeSubComponents: true,
    }
  );

  assert.equal(report, {
    Header: {
      instances: [
        {
          props: {},
          propsSpread: false,
          location: {
            file: "deeply-nested-sub-components.js",
            start: {
              line: 2,
              column: 5,
            },
          },
        },
      ],
      components: {
        Logo: {
          instances: [
            {
              props: {
                name: "foo",
              },
              propsSpread: false,
              location: {
                file: "deeply-nested-sub-components.js",
                start: {
                  line: 3,
                  column: 7,
                },
              },
            },
          ],
        },
        Content: {
          instances: [
            {
              props: {},
              propsSpread: false,
              location: {
                file: "deeply-nested-sub-components.js",
                start: {
                  line: 4,
                  column: 7,
                },
              },
            },
          ],
          components: {
            Column: {
              instances: [
                {
                  props: {},
                  propsSpread: false,
                  location: {
                    file: "deeply-nested-sub-components.js",
                    start: {
                      line: 5,
                      column: 9,
                    },
                  },
                },
              ],
              components: {
                Title: {
                  instances: [
                    {
                      props: {
                        variant: "important",
                      },
                      propsSpread: false,
                      location: {
                        file: "deeply-nested-sub-components.js",
                        start: {
                          line: 7,
                          column: 11,
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  });
});

Scan("ignores non-JSX stuff", ({ getReport }) => {
  const report = getReport(
    "ignores-non-jsx-stuff.js",
    `
    import React from "react";

    function GoodbyeMessage({ languageStyle }) {
      return languageStyle === "formal" ? (
        <Text>Goodbye</Text>
      ) : (
        <Text>See ya</Text>
      );
    }

    function App() {
      return (
        <div css={{ padding: 20 }}>
          <Text color="blue">Hello</Text>
          <GoodbyeMessage languageStyle="formal" />
        </div>
      )
    }

    export default App;
  `
  );

  assert.equal(report, {
    Text: {
      instances: [
        {
          props: {},
          propsSpread: false,
          location: {
            file: "ignores-non-jsx-stuff.js",
            start: {
              line: 6,
              column: 9,
            },
          },
        },
        {
          props: {},
          propsSpread: false,
          location: {
            file: "ignores-non-jsx-stuff.js",
            start: {
              line: 8,
              column: 9,
            },
          },
        },
        {
          props: {
            color: "blue",
          },
          propsSpread: false,
          location: {
            file: "ignores-non-jsx-stuff.js",
            start: {
              line: 15,
              column: 11,
            },
          },
        },
      ],
    },
  });
});

Scan.run();
