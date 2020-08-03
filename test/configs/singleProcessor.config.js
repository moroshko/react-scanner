module.exports = {
  crawlFrom: "../code",
  processors: [
    ["count-components", { outputTo: "../reports/singleProcessor.json" }],
  ],
};
