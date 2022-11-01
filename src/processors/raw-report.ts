import type { ProcessorFunctionArgs, ProcessorOptions } from "../types";

const rawReportProcessor =
  (options: ProcessorOptions | undefined) =>
  ({ report, output }: ProcessorFunctionArgs) => {
    output(report, options && options.outputTo);

    return report;
  };

export default rawReportProcessor;
