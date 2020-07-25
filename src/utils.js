const fs = require("fs");
const path = require("path");

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

module.exports = {
  validateConfig,
  pluralize,
  forEachComponent,
};
