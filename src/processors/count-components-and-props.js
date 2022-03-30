const countComponentsAndPropsProcessor =
  (options) =>
  ({ forEachComponent, sortObjectKeysByValue, output }) => {
    let result = {};

    forEachComponent(({ componentName, component }) => {
      const { instances } = component;

      if (!instances) {
        return;
      }

      result[componentName] = {
        instances: instances.length,
        props: {},
      };

      instances.forEach((instance) => {
        for (const prop in instance.props) {
          if (result[componentName].props[prop] === undefined) {
            result[componentName].props[prop] = 0;
          }

          result[componentName].props[prop] += 1;
        }
      });

      result[componentName].props = sortObjectKeysByValue(
        result[componentName].props
      );
    });

    result = sortObjectKeysByValue(result, (component) => component.instances);

    output(result, options && options.outputTo);

    return result;
  };

module.exports = countComponentsAndPropsProcessor;
