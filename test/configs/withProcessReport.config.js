module.exports = {
  crawlFrom: "../code",
  processReport: ({ forEachComponent, sortObjectKeysByValue, writeFile }) => {
    let output = {};

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

    writeFile("../reports/withProcessReport.json", output);
  },
};
