const fs = require("fs");
const path = require("path");
const isPlainObject = require("is-plain-object");

function validateConfig(config, configDir) {
  const result = {
    errors: [],
  };

  if (config.crawlFrom === undefined) {
    result.errors.push(`crawlFrom is missing`);
  } else if (typeof config.crawlFrom !== "string") {
    result.errors.push(`crawlFrom should be a string`);
  } else {
    const crawlFrom = path.resolve(configDir, config.crawlFrom);

    if (fs.existsSync(crawlFrom)) {
      result.crawlFrom = crawlFrom;
    } else {
      result.errors.push(`crawlFrom path doesn't exist (${crawlFrom})`);
    }
  }

  if (config.exclude !== undefined) {
    if (typeof config.exclude !== "function") {
      result.errors.push(`exclude should be a function`);
    }
  }

  if (config.globs !== undefined) {
    if (Array.isArray(config.globs)) {
      for (let i = 0, len = config.globs.length; i < len; i++) {
        if (typeof config.globs[i] !== "string") {
          result.errors.push(
            `every item in the globs array should be a string (${typeof config
              .globs[i]} found)`
          );
          break;
        }
      }
    } else {
      result.errors.push(`globs should be an array`);
    }
  }

  if (config.components !== undefined) {
    if (isPlainObject(config.components)) {
      for (const componentName in config.components) {
        if (config.components[componentName] !== true) {
          result.errors.push(
            `the only supported value in the components object is true`
          );
          break;
        }
      }
    } else {
      result.errors.push(`components should be an object`);
    }
  }

  if (config.includeSubComponents !== undefined) {
    if (typeof config.includeSubComponents !== "boolean") {
      result.errors.push(`includeSubComponents should be a boolean`);
    }
  }

  if (config.importedFrom !== undefined) {
    if (
      typeof config.importedFrom !== "string" &&
      config.importedFrom instanceof RegExp === false
    ) {
      result.errors.push(`importedFrom should be a string or a RegExp`);
    }
  }

  if (config.processReport !== undefined) {
    if (typeof config.processReport !== "function") {
      result.errors.push(`processReport should be a function`);
    }
  }

  return result;
}

function pluralize(count, word) {
  return count === 1 ? `1 ${word}` : `${count} ${word}s`;
}

const forEachComponent = (report) => (callback) => {
  const queue = [{ namePrefix: "", componentsMap: report }];

  while (queue.length > 0) {
    const { namePrefix, componentsMap } = queue.shift();

    for (let componentName in componentsMap) {
      const component = componentsMap[componentName];
      const { components } = component;
      const fullComponentName = `${namePrefix}${componentName}`;

      callback({ componentName: fullComponentName, component });

      if (components) {
        queue.push({
          namePrefix: `${fullComponentName}.`,
          componentsMap: components,
        });
      }
    }
  }
};

function sortObjectKeysByValue(obj, mapValue = (value) => value) {
  const entries = Object.entries(obj);

  entries.sort(([key1, value1], [key2, value2]) => {
    const value1ToCompare = mapValue(value1);
    const value2ToCompare = mapValue(value2);

    return value1ToCompare > value2ToCompare ||
      (value1ToCompare === value2ToCompare && key1 <= key2)
      ? -1
      : 1;
  });

  return Object.fromEntries(entries);
}

module.exports = {
  validateConfig,
  pluralize,
  forEachComponent,
  sortObjectKeysByValue,
};
