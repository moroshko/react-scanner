import type { ProcessorFunctionArgs, ProcessorOptions } from "../types";

type ResultData = {
  instances: number;
  props: Record<string, number>;
};

const countComponentsAndPropsProcessor =
  (options: ProcessorOptions) =>
  ({
    forEachComponent,
    sortObjectKeysByValue,
    output,
  }: ProcessorFunctionArgs) => {
    let result: Record<string, ResultData> = {};

    forEachComponent(({ componentName, component }) => {
      const { instances } = component;

      if (!instances) {
        return;
      }

      const componentResult: ResultData = {
        instances: instances.length,
        props: {},
      };

      instances.forEach((instance) => {
        for (const prop in instance.props) {
          if (componentResult.props[prop] === undefined) {
            componentResult.props[prop] = 0;
          }

          componentResult.props[prop] += 1;
        }
      });

      componentResult.props = sortObjectKeysByValue(componentResult.props);

      result[componentName] = componentResult;
    });

    result = sortObjectKeysByValue(result, (component) => component.instances);

    output(result, options && options.outputTo);

    return result;
  };

export default countComponentsAndPropsProcessor;
