const fs = require("fs");
const path = require("path");
const { isPlainObject } = require("is-plain-object");
const processors = require("./processors/processors");

function pluralize(count, word) {
  return count === 1 ? `1 ${word}` : `${count} ${word}s`;
}

function validateConfig(config, configDir) {
  const result = {
    errors: [],
  };

  if (config.crawlFrom === undefined) {
    result.errors.push(`crawlFrom is missing`);
  } else if (typeof config.crawlFrom !== "string") {
    result.errors.push(`crawlFrom should be a string`);
  } else {
    const crawlFrom = path.resolve(
      config.rootDir || configDir,
      config.crawlFrom
    );

    if (fs.existsSync(crawlFrom)) {
      result.crawlFrom = crawlFrom;
    } else {
      result.errors.push(`crawlFrom path doesn't exist (${crawlFrom})`);
    }
  }

  if (config.exclude !== undefined) {
    if (Array.isArray(config.exclude)) {
      for (let i = 0, len = config.exclude.length; i < len; i++) {
        if (
          typeof config.exclude[i] !== "string" &&
          config.exclude[i] instanceof RegExp === false
        ) {
          result.errors.push(
            `every item in the exclude array should be a string or a regex (${typeof config
              .exclude[i]} found)`
          );
          break;
        }
      }
    } else if (typeof config.exclude !== "function") {
      result.errors.push(`exclude should be an array or a function`);
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

  if (config.processors !== undefined) {
    if (Array.isArray(config.processors)) {
      for (let i = 0, len = config.processors.length; i < len; i++) {
        const processor = config.processors[i];

        if (typeof processor === "string") {
          if (processors[processor] === undefined) {
            result.errors.push(
              `unknown processor: ${processor} (known processors are: ${Object.keys(
                processors
              ).join(", ")})`
            );
          }
        } else if (Array.isArray(processor)) {
          if (processor.length !== 2) {
            result.errors.push(
              `processor is in a form of array should have exactly 2 items (${pluralize(
                processor.length,
                "item"
              )} found)`
            );
            break;
          }

          const [name, options] = processor;

          if (typeof name !== "string") {
            result.errors.push(
              `when processor is a tuple, the first item is a name and should be a string (${typeof name} found)`
            );
            break;
          } else if (processors[name] === undefined) {
            result.errors.push(
              `unknown processor: ${name} (known processors are: ${Object.keys(
                processors
              ).join(", ")})`
            );
          }

          if (isPlainObject(options) === false) {
            result.errors.push(
              `when processor is a tuple, the second item is options and should be an object`
            );
          }
        } else if (typeof processor !== "function") {
          result.errors.push(
            `processor should be a string, an array, or a function (${typeof processor} found)`
          );
        }
      }
    } else {
      result.errors.push(`processors should be an array`);
    }
  }

  return result;
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

  return entries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
}

function getExcludeFn(configExclude) {
  if (Array.isArray(configExclude)) {
    return (dir) => {
      for (let i = 0, len = configExclude.length; i < len; i++) {
        const item = configExclude[i];

        if (
          (typeof item === "string" && item === dir) ||
          (item instanceof RegExp && item.test(dir))
        ) {
          return true;
        }
      }

      return false;
    };
  }

  if (typeof configExclude === "function") {
    return configExclude;
  }

  return () => false;
}

module.exports = {
  pluralize,
  validateConfig,
  forEachComponent,
  sortObjectKeysByValue,
  getExcludeFn,
};
