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

ValidateConfig("crawlFrom is missing", () => {
  const originalPathResolve = path.resolve;
  const originFsExistsSync = fs.existsSync;

  path.resolve = () => "";
  fs.existsSync = () => false;

  const result = validateConfig({}, "/Users/misha/oscar");

  assert.equal(result, {
    errors: [`crawlFrom is missing`],
  });

  path.resolve = originalPathResolve;
  fs.existsSync = originFsExistsSync;
});

ValidateConfig("crawlFrom should be a string", () => {
  const originalPathResolve = path.resolve;
  const originFsExistsSync = fs.existsSync;

  path.resolve = () => "";
  fs.existsSync = () => false;

  const result = validateConfig(
    {
      crawlFrom: true,
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    errors: [`crawlFrom should be a string`],
  });

  path.resolve = originalPathResolve;
  fs.existsSync = originFsExistsSync;
});

ValidateConfig("crawlFrom path doesn't exist", () => {
  const originalPathResolve = path.resolve;
  const originFsExistsSync = fs.existsSync;

  path.resolve = () => "/Users/misha/oscar/src";
  fs.existsSync = () => false;

  const result = validateConfig(
    {
      crawlFrom: "./src",
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    errors: [`crawlFrom path doesn't exist (/Users/misha/oscar/src)`],
  });

  path.resolve = originalPathResolve;
  fs.existsSync = originFsExistsSync;
});

ValidateConfig("crawlFrom path exists", () => {
  const originalPathResolve = path.resolve;
  const originFsExistsSync = fs.existsSync;

  path.resolve = () => "/Users/misha/oscar/src";
  fs.existsSync = () => true;

  const result = validateConfig(
    {
      crawlFrom: "./src",
    },
    "/Users/misha/oscar"
  );

  assert.equal(result, {
    crawlFrom: "/Users/misha/oscar/src",
    errors: [],
  });

  path.resolve = originalPathResolve;
  fs.existsSync = originFsExistsSync;
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
