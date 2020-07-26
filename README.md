![CI](https://github.com/moroshko/react-scanner/workflows/CI/badge.svg)

# react-scanner

`react-scanner` statically analyzes the given code (TypeScript supported) and extracts React components and props usage.

First, it crawls the given directory and compiles a list of files to be scanned. Then, it scans every file by extracting rendered components and their props into a JSON report.

For example, let's say we have the following `index.js` file:

```jsx
import React from "react";
import ReactDOM from "react-dom";
import { BasisProvider, defaultTheme, Container, Text, Link } from "basis";

function App() {
  return (
    <BasisProvider theme={defaultTheme}>
      <Container margin="4" hasBreakpointWidth>
        <Text textStyle="subtitle2">
          Want to know how your design system components are being used?
        </Text>
        <Text margin="4 0 0 0">
          Try{" "}
          <Link href="https://github.com/moroshko/react-scanner" newTab>
            react-scanner
          </Link>
        </Text>
      </Container>
    </BasisProvider>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```

Running `react-scanner` on it will create the following JSON report:

<details>
  <summary>Click to see it</summary>
  
```json
{
  "Text": {
    "instances": [
      {
        "props": {
          "textStyle": "subtitle2"
        },
        "propsSpread": false,
        "location": {
          "file": "/path/to/index.js",
          "start": {
            "line": 9,
            "column": 9
          }
        }
      },
      {
        "props": {
          "margin": "4 0 0 0"
        },
        "propsSpread": false,
        "location": {
          "file": "/path/to/index.js",
          "start": {
            "line": 12,
            "column": 9
          }
        }
      }
    ]
  },
  "Link": {
    "instances": [
      {
        "props": {
          "href": "https://github.com/moroshko/react-scanner",
          "newTab": null
        },
        "propsSpread": false,
        "location": {
          "file": "/path/to/index.js",
          "start": {
            "line": 14,
            "column": 11
          }
        }
      }
    ]
  },
  "Container": {
    "instances": [
      {
        "props": {
          "margin": "4",
          "hasBreakpointWidth": null
        },
        "propsSpread": false,
        "location": {
          "file": "/path/to/index.js",
          "start": {
            "line": 8,
            "column": 7
          }
        }
      }
    ]
  }
}
```
</details>

At this point, it's up to you what to do with this report. You could store it as is or transform it to something a bit more useful. For example, you could count how many times each component is used, find instances of a specific prop that you consider deprecating, etc.

## Installation

```
npm install --save-dev react-scanner
```

## Usage

```
npx react-scanner -c /path/to/react-scanner.config.js
```

## Config file

Everything that `react-scanner` does is controlled by a config file.

The config file can be located anywhere and it must export an object like this:

```js
module.exports = {
  // [required]
  // Type: string
  // The path of the directory to start crawling from (absolute or relative to the config file location).
  crawlFrom: "./src",

  // [optional]
  // Type: function
  // Directory names to exclude from crawling.
  exclude: (dir) => {
    // Note: dir is just the directory name, not the path.
    return ["utils", "tests"].includes(dir);
  },

  // [optional]
  // Type: array of strings (globs)
  // Default: ["**/!(*.test|*.spec).@(js|ts)?(x)"]
  // Only files matching these globs will be scanned (see here for glob syntax: https://github.com/micromatch/picomatch#globbing-features).
  globs: ["**/*.js"],

  // [optional]
  // Type: object where all values are true
  // Components to report (omit to report all components).
  components: {
    Button: true,
    Footer: true,
    Text: true,
  },

  // [optional]
  // Type: boolean
  // Default: false
  // Whether to report subcomponents or not.
  // false - Footer will be reported, but Footer.Content will not.
  // true - Footer.Content will be reported, as well as Footer.Content.Legal, etc.
  includeSubComponents: true,

  // [optional]
  // Type: string or RegExp.
  // Before reporting a component, we'll check if it's imported from a module name matching importedFrom.
  // Only if there is a match, the component will be reported.
  // When omitted, this check is bypassed.
  importedFrom: "basis",

  // [optional]
  // Type: function
  // Specify what to do with the report.
  // In this example, we count how many times each component and its props is used, sort
  // by count, and write the result to a file.
  // Note, the components in the report will be nested when includeSubComponents is true.
  // To help traversing the report, we provide a convenience forEachComponent function.
  // The processReport function gets an object with the following in it:
  // * report - the full JSON report
  // * forEachComponent - recursively visits every component in the report
  // * sortObjectKeysByValue - sorts object keys by some function of the value (this function is identity by default)
  // * writeFile - use it to store the result object in a file
  // When processReport is not specified, the report is logged out.
  processReport: ({ forEachComponent, sortObjectKeysByValue, writeFile }) => {
    let output = {};

    // count instances
    forEachComponent(({ componentName, component }) => {
      const { instances } = component;

      if (!instances) {
        return;
      }

      output[componentName] = {
        instances: instances.length,
        props: {},
      };

      instances.forEach((instance) => {
        for (const prop in instance.props) {
          if (output[componentName].props[prop] === undefined) {
            output[componentName].props[prop] = 0;
          }

          output[componentName].props[prop] += 1;
        }
      });

      output[componentName].props = sortObjectKeysByValue(
        output[componentName].props
      );
    });

    output = sortObjectKeysByValue(output, (component) => component.instances);

    writeFile(
      "./reports/oscar.json", // absolute or relative to the config file location
      output // must be an object, will be JSON.stringified
    );
  },
};
```

This `processReport` would produce something like this:

```json
{
  "Text": {
    "instances": 17,
    "props": {
      "margin": 6,
      "color": 4,
      "textStyle": 1
    }
  },
  "Button": {
    "instances": 10,
    "props": {
      "width": 10,
      "variant": 5,
      "type": 3
    }
  },
  "Footer": {
    "instances": 1,
    "props": {}
  }
}
```

## License

MIT
