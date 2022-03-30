const rawReportProcessor =
  (options) =>
  ({ report, output }) => {
    output(report, options && options.outputTo);

    return report;
  };

module.exports = rawReportProcessor;
