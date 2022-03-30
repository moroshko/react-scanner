const countComponentsProcessor =
  (options) =>
  ({ forEachComponent, sortObjectKeysByValue, output }) => {
    let result = {};

    forEachComponent(({ componentName, component }) => {
      const { instances } = component;

      if (instances) {
        result[componentName] = instances.length;
      }
    });

    result = sortObjectKeysByValue(result);

    output(result, options && options.outputTo);

    return result;
  };

module.exports = countComponentsProcessor;
