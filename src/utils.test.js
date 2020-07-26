const fs = require("fs");
const path = require("path");
const { suite } = require("uvu");
const assert = require("uvu/assert");
const {
  validateConfig,
  pluralize,
  forEachComponent,
  sortObjectKeysByValue,
} = require("./utils");

const ValidateConfig = suite("validateConfig");
const Pluralize = suite("pluralize");
const ForEachComponent = suite("forEachComponent");
const SortObjectKeysByValue = suite("sortObjectKeysByValue");

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

ValidateConfig("exclude is not a function", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      exclude: "utils",
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`exclude should be a function`],
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

ValidateConfig("processReport is not a function", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      processReport: true,
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [`processReport should be a function`],
  });
});

ValidateConfig("valid config with all options", () => {
  const result = validateConfig(
    {
      crawlFrom: "./src",
      exclude: (dir) => dir === "utils",
      globs: ["**/*.js"],
      components: {
        Button: true,
        Footer: true,
        Text: true,
      },
      includeSubComponents: true,
      importedFrom: "basis",
      processReport: () => {},
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

ValidateConfig.run();
Pluralize.run();
ForEachComponent.run();
SortObjectKeysByValue.run();
