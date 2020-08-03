module.exports = {
  crawlFrom: "../code",
  includeSubComponents: true,
  importedFrom: /react|basis/,
  processors: [
    "count-components",
    [
      "count-components-and-props",
      {
        outputTo: "../reports/multipleProcessors-countComponentsAndProps.json",
      },
    ],
    ({ output }) => {
      output("something", "../reports/multipleProcessors-custom.txt");
    },
  ],
};
