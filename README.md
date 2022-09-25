![CI](https://github.com/moroshko/react-scanner/workflows/CI/badge.svg)

# react-scanner

`react-scanner` statically analyzes the given code (TypeScript supported) and extracts React components and props usage.

First, it crawls the given directory and compiles a list of files to be scanned. Then, it scans every file and extracts rendered components and their props into a JSON report.

For example, let's say we have the following `index.js` file:

```jsx
import React from "react";
import ReactDOM from "react-dom";
import {
  BasisProvider,
  defaultTheme,
  Container,
  Text,
  Link as BasisLink,
} from "basis";

function App() {
  return (
    <BasisProvider theme={defaultTheme}>
      <Container margin="4" hasBreakpointWidth>
        <Text textStyle="subtitle2">
          Want to know how your design system components are being used?
        </Text>
        <Text margin="4 0 0 0">
          Try{" "}
          <BasisLink href="https://github.com/moroshko/react-scanner" newTab>
            react-scanner
          </BasisLink>
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
  "BasisProvider": {
    "instances": [
      {
        "importInfo": {
          "imported": "BasisProvider",
          "local": "BasisProvider",
          "moduleName": "basis"
        },
        "props": {
          "theme": "(Identifier)"
        },
        "propsSpread": false,
        "location": {
          "file": "/path/to/index.js",
          "start": {
            "line": 13,
            "column": 5
          }
        }
      }
    ]
  },
  "Container": {
    "instances": [
      {
        "importInfo": {
          "imported": "Container",
          "local": "Container",
          "moduleName": "basis"
        },
        "props": {
          "margin": "4",
          "hasBreakpointWidth": null
        },
        "propsSpread": false,
        "location": {
          "file": "/path/to/index.js",
          "start": {
            "line": 14,
            "column": 7
          }
        }
      }
    ]
  },
  "Text": {
    "instances": [
      {
        "importInfo": {
          "imported": "Text",
          "local": "Text",
          "moduleName": "basis"
        },
        "props": {
          "textStyle": "subtitle2"
        },
        "propsSpread": false,
        "location": {
          "file": "/path/to/index.js",
          "start": {
            "line": 15,
            "column": 9
          }
        }
      },
      {
        "importInfo": {
          "imported": "Text",
          "local": "Text",
          "moduleName": "basis"
        },
        "props": {
          "margin": "4 0 0 0"
        },
        "propsSpread": false,
        "location": {
          "file": "/path/to/index.js",
          "start": {
            "line": 18,
            "column": 9
          }
        }
      }
    ]
  },
  "Link": {
    "instances": [
      {
        "importInfo": {
          "imported": "Link",
          "local": "BasisLink",
          "moduleName": "basis"
        },
        "props": {
          "href": "https://github.com/moroshko/react-scanner",
          "newTab": null
        },
        "propsSpread": false,
        "location": {
          "file": "/path/to/index.js",
          "start": {
            "line": 20,
            "column": 11
          }
        }
      }
    ]
  }
}
```

</details>

This raw JSON report is used then to generate something that is useful to you. For example, you might want to know:

- How often a cetrain component is used in your design system? (see [`count-components`](#count-components) processor)
- How often a certain prop in a given component is used? (see [`count-components-and-props`](#count-components-and-props) processor)
- Looking at some prop in a given component, what's the distribution of values used? (e.g. you might consider deprecating a certain value)

Once you have the result you are interested in, you can write it to a file or simply log it to the console.

## Installation

```
npm install --save-dev react-scanner
```

## Usage

```
npx react-scanner -c /path/to/react-scanner.config.js
```

### Config file

Everything that `react-scanner` does is controlled by a config file.

The config file can be located anywhere and it must export an object like this:

```js
module.exports = {
  crawlFrom: "./src",
  includeSubComponents: true,
  importedFrom: "basis",
};
```

Running `react-scanner` with this config would output something like this to the console:

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

### Running programmatically

It is also possible to run the scanner programmatically. In this case, the config options should be passed directly to the `run` function.

```js
import scanner from "react-scanner";

const output = await scanner.run(config);
```

## Config options

Here are all the available config options:

| Option                 | Type              | Description                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootDir`              | string            | The path to the root directory of your project. <br>If using a config file, this defaults to the config directory.                                                                                                                                                                                                                                   |
| `crawlFrom`            | string            | The path of the directory to start crawling from.<br>Absolute or relative to the config file location.                                                                                                                                                                                                                                               |
| `exclude`              | array or function | Each array item should be a string or a regex. When crawling, if directory name matches exactly the string item or matches the regex item, it will be excluded from crawling.<br>For more complex scenarios, `exclude` can be a a function that accepts a directory name and should return `true` if the directory should be excluded from crawling. |
| `globs`                | array             | Only files matching these globs will be scanned. See [here](https://github.com/micromatch/picomatch#globbing-features) for glob syntax.<br>Default: `["**/!(*.test\|*.spec).@(js\|ts)?(x)"]`                                                                                                                                                         |
| `components`           | object            | Components to report. Omit to report all components.                                                                                                                                                                                                                                                                                                 |
| `includeSubComponents` | boolean           | Whether to report subcomponents or not.<br>When `false`, `Footer` will be reported, but `Footer.Content` will not.<br>When `true`, `Footer.Content` will be reported, as well as `Footer.Content.Legal`, etc.<br>Default: `false`                                                                                                                    |
| `importedFrom`         | string or regex   | Before reporting a component, we'll check if it's imported from a module name matching `importedFrom` and, only if there is a match, the component will be reported.<br>When omitted, this check is bypassed.                                                                                                                                        |
| `getComponentName`     | function          | This function is called to determine the component name to be used in the report based on the `import` declaration.<br>Default: `({ imported, local, moduleName, importType }) => imported \|\| local`                                                                                                                                               |
| `getPropValue`         | function          | Customize reporting for non-trivial prop values. See [Customizing prop values treatment](#customizing-prop-values-treatment)                                                                                                                                                                                                                         |
| `processors`           | array             | See [Processors](#processors).<br>Default: `["count-components-and-props"]`                                                                                                                                                                                                                                                                          |

## Processors

Scanning the files results in a JSON report. Add processors to tell `react-scanner` what to do with this report.

### Built-in processors

`react-scanner` comes with some ready to use processors.

To use a built-in processor, simply specify its name as a string, e.g.:

```
processors: ["count-components"]
```

You can also use a tuple form to pass options to a built-in processor, e.g.:

```
processors: [
  ["count-components", { outputTo: "/path/to/my-report.json" }]
]
```

All the built-in processors support the following options:

| Option     | Type   | Description                                                                                                                           |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `outputTo` | string | Where to output the result.<br>Absolute or relative to the root directory.<br>When omitted, the result is printed out to the console. |

Here are the built-in processors that `react-scanner` comes with:

#### `count-components`

Example output:

```json
{
  "Text": 10,
  "Button": 5,
  "Link": 3
}
```

#### `count-components-and-props`

Example output:

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
      "variant": 4,
      "type": 2
    }
  },
  "Footer": {
    "instances": 1,
    "props": {}
  }
}
```

#### `raw-report`

Example output:

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
          "file": "/path/to/file",
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
          "file": "/path/to/file",
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
          "file": "/path/to/file",
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
          "file": "/path/to/file",
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

### Custom processors

We saw above that built-in processors come in the form of a string or a tuple.

Custom processors are functions, and can be asynchronous!

If the processor function returns a `Promise`, it will be awaited before the next processor kicks in. This way, you can use previous processors results in your processor function.

Here is an example of taking the output of the built-in `count-components-and-props` processor and sending it to your storage solution.

```
processors: [
  "count-components-and-props",
  ({ prevResult }) => {
    return axios.post("/my/storage/solution", prevResult);
  }
]
```

Processor functions receive an object with the following keys in it:

| Key                     | Type     | Description                                                                                                                                                                                                                                                                                                    |
| ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `report`                | object   | The raw JSON report.                                                                                                                                                                                                                                                                                           |
| `prevResults`           | array    | Previous processors results.                                                                                                                                                                                                                                                                                   |
| `prevResult`            | any      | The last item in `prevResults`. Just for convenience.                                                                                                                                                                                                                                                          |
| `forEachComponent`      | function | Helper function to recursively traverse the raw JSON report. The function you pass in is called for every component in the report, and it gets an object with `componentName` and `component` in it. Check the implementation of `count-components-and-props` for a usage example.                             |
| `sortObjectKeysByValue` | function | Helper function that sorts object keys by some function of the value. Check the implementation of `count-components-and-props` for a usage example.                                                                                                                                                            |
| `output`                | function | Helper function that outputs the given data. Its first parameter is the data you want to output. The second parameter is the destination. When the second parameter is omitted, it outputs to the console. To output to the file system, pass an absolute path or a relative path to the config file location. |

## Customizing prop values treatment

When a primitive (strings, numbers, booleans, etc...) is passed as a prop value into a component, the raw report will display this literal value. However, when expressions or variables are passed as a prop value into a component, the raw report will display the AST type. In some instances, we may want to see the actual expression that was passed in.

### getPropValue

Using the `getPropValue` configuration parameter makes this possible.

```typescript
type IGetPropValue = {
    /** The AST node */
    node: Node,
    componentName: string,
    propName: string,
    /** Pass the node back into this method for default handling of the prop value */
    defaultGetPropValue: (node: Node) => string
}
getPropValue({ node, componentName, propName, defaultGetPropValue }: IGetPropValue): string
```

### Example

If we were building out a design system, and wanted to see all the variations of a `style` prop that we passed into an `Input` component, we could do something like this:

```javascript
const escodegen = require("escodegen-wallaby");

getPropValue: ({ node, propName, componentName, defaultGetPropValue }) => {
  if (componentName === "Input" && propName === "style") {
    if (node.type === "JSXExpressionContainer") {
      return escodegen.generate(node.expression);
    } else {
      return escodegen.generate(node);
    }
  } else {
    return defaultGetPropValue(node);
  }
};
```

## License

MIT
