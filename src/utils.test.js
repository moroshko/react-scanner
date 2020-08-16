const fs = require("fs");
const path = require("path");
const { suite } = require("uvu");
const assert = require("uvu/assert");
const {
  validateConfig,
  pluralize,
  forEachComponent,
  sortObjectKeysByValue,
  getExcludeFn,
} = require("./utils");

const ValidateConfig = suite("validateConfig");
const Pluralize = suite("pluralize");
const ForEachComponent = suite("forEachComponent");
const SortObjectKeysByValue = suite("sortObjectKeysByValue");
const GetExcludeFn = suite("getExcludeFn");

ValidateConfig.before.each((context) => {
  context.originalPathResolve = path.resolve;
  context.originFsExistsSync = fs.existsSync;

  path.resolve = () => "/Users/misha/oscar/src";
  fs.existsSync = () => true;

  context.mock = (fn) => {
    fn();
  };
});

ValidateConfig.after.each((context) => {
  context.mock = undefined;
  path.resolve = context.originalPathResolve;
  fs.existsSync = context.originFsExistsSync;
});

ValidateConfig("crawlFrom is missing", (context) => {
  context.mock(() => {
    path.resolve = () => "";
    fs.existsSync = () => false;
  });

  const result = validateConfig({}, "/Users/misha/oscar");

  assert.equal(result, {
    errors: [`crawlFrom is missing`],
  });
});

ValidateConfig("crawlFrom should be a string", (context) => {
  context.mock(() => {
    path.resolve = () => "";
    fs.existsSync = () => false;
  });

  const result = validateConfig(
    {
      crawlFrom: true,
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    errors: [`crawlFrom should be a string`],
  });
});

ValidateConfig("crawlFrom path doesn't exist", (context) => {
  context.mock(() => {
    fs.existsSync = () => false;
  });

  const result = validateConfig(
    {
      crawlFrom: "./src",
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    errors: [`crawlFrom path doesn't exist (/Users/misha/oscar/src)`],
  });
});

ValidateConfig("exclude is an array with invalid items", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      exclude: ["utils", /node_modules/, undefined],
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [
      `every item in the exclude array should be a string or a regex (undefined found)`,
    ],
  });
});

ValidateConfig("exclude is neither an array nor a function", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      exclude: "utils",
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`exclude should be an array or a function`],
  });
});

ValidateConfig("globs is not an array", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      globs: "**/*.js",
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`globs should be an array`],
  });
});

ValidateConfig("globs has a non string item", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      globs: ["**/*.js", 4],
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`every item in the globs array should be a string (number found)`],
  });
});

ValidateConfig("components is not an object", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      components: "Header",
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`components should be an object`],
  });
});

ValidateConfig("components has a non true value", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      components: {
        Header: false,
      },
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`the only supported value in the components object is true`],
  });
});

ValidateConfig("includeSubComponents is not a boolean", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      includeSubComponents: "yes",
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`includeSubComponents should be a boolean`],
  });
});

ValidateConfig("importedFrom is not a string or a RegExp", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      importedFrom: ["basis"],
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`importedFrom should be a string or a RegExp`],
  });
});

ValidateConfig("processors is not an array", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      processors: "count-components",
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`processors should be an array`],
  });
});

ValidateConfig("string form - unknown processor", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      processors: ["foo"],
    },
    "/Users/misha/oscar"
  );

  assert.is(result.crawlFrom, "/Users/misha/oscar/src");
  assert.is(result.errors.length, 1);
  assert.ok(/^unknown processor: foo/.test(result.errors[0]));
});

ValidateConfig("array form - not a tuple", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      processors: [["count-components"]],
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [
      `processor is in a form of array should have exactly 2 items (1 item found)`,
    ],
  });
});

ValidateConfig("array form - processor name is not a string", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      processors: [[() => {}, "count-components"]],
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [
      `when processor is a tuple, the first item is a name and should be a string (function found)`,
    ],
  });
});

ValidateConfig("array form - unknown processor", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      processors: [["foo", {}]],
    },
    "/Users/misha/oscar"
  );

  assert.is(result.crawlFrom, "/Users/misha/oscar/src");
  assert.is(result.errors.length, 1);
  assert.ok(/^unknown processor: foo/.test(result.errors[0]));
});

ValidateConfig("array form - processor options is not an object", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      processors: [["count-components", () => {}]],
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [
      `when processor is a tuple, the second item is options and should be an object`,
    ],
  });
});

ValidateConfig("array form - processor name is unsupported type", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      processors: [true, () => {}],
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [
      `processor should be a string, an array, or a function (boolean found)`,
    ],
  });
});

ValidateConfig("valid config with all options", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      exclude: ["utils"],
      globs: ["**/*.js"],
      components: {
        Button: true,
        Footer: true,
        Text: true,
      },
      includeSubComponents: true,
      importedFrom: "basis",
      processors: ["count-components"],
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [],
  });
});

Pluralize("count = 1", () => {
  assert.is(pluralize(1, "car"), "1 car");
});

Pluralize("count > 1", () => {
  assert.is(pluralize(3, "car"), "3 cars");
});

ForEachComponent("visits every component", () => {
  const report = {
    Header: {
      id: 1,
      components: {
        Logo: {
          id: 4,
        },
      },
    },
    Footer: {
      id: 2,
      components: {
        Links: {
          id: 5,
          components: {
            Section: {
              id: 6,
            },
          },
        },
      },
    },
    Text: {
      id: 3,
    },
  };

  const visits = [];

  forEachComponent(report)(({ componentName, component }) => {
    visits.push({
      id: component.id,
      name: componentName,
    });
  });

  assert.equal(visits, [
    {
      id: 1,
      name: "Header",
    },
    {
      id: 2,
      name: "Footer",
    },
    {
      id: 3,
      name: "Text",
    },
    {
      id: 4,
      name: "Header.Logo",
    },
    {
      id: 5,
      name: "Footer.Links",
    },
    {
      id: 6,
      name: "Footer.Links.Section",
    },
  ]);
});

SortObjectKeysByValue("default valueMap", () => {
  const result = sortObjectKeysByValue({
    Header: 5,
    Link: 10,
    Accordion: 7,
    Footer: 16,
  });

  assert.equal(result, {
    Footer: 16,
    Link: 10,
    Accordion: 7,
    Header: 5,
  });
});

SortObjectKeysByValue("custom valueMap", () => {
  const result = sortObjectKeysByValue(
    {
      Header: {
        instances: 16,
      },
      Link: {
        instances: 10,
      },
      Accordion: {
        instances: 7,
      },
      Footer: {
        instances: 16,
      },
    },
    (component) => component.instances
  );

  assert.equal(result, {
    Footer: {
      instances: 16,
    },
    Link: {
      instances: 10,
    },
    Accordion: {
      instances: 7,
    },
    Header: {
      instances: 16,
    },
  });
});

GetExcludeFn("array of strings", () => {
  const excludeFn = getExcludeFn(["node_modules", "utils"]);

  assert.is(excludeFn("node_modules"), true);
  assert.is(excludeFn("utils"), true);
  assert.is(excludeFn("foo"), false);
});

GetExcludeFn("array of strings and regexes", () => {
  const excludeFn = getExcludeFn([/image/i, "utils", /test/]);

  assert.is(excludeFn("Images"), true);
  assert.is(excludeFn("utils"), true);
  assert.is(excludeFn("__test__"), true);
  assert.is(excludeFn("foo"), false);
});

GetExcludeFn("custom function", () => {
  const excludeFn = getExcludeFn((dir) => {
    return dir === "foo" || dir.endsWith("bar") || dir.length === 7;
  });

  assert.is(excludeFn("foo"), true);
  assert.is(excludeFn("info-bar"), true);
  assert.is(excludeFn("1234567"), true);
  assert.is(excludeFn("something-else"), false);
});

ValidateConfig.run();
Pluralize.run();
ForEachComponent.run();
SortObjectKeysByValue.run();
GetExcludeFn.run();
