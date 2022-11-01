import type { ProcessorFunctionArgs, ProcessorOptions } from "../types";

const countComponentsProcessor =
  (options: ProcessorOptions | undefined) =>
  ({
    forEachComponent,
    sortObjectKeysByValue,
    output,
  }: ProcessorFunctionArgs) => {
    let result: Record<string, number> = {};

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

export default countComponentsProcessor;
