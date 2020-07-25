const { parse } = require("meriyah");
const astray = require("astray");
const getObjectPath = require("dlv");
const setObjectPath = require("dset");

const parseOptions = {
  module: true,
  next: true,
  loc: true,
  jsx: true,
};

function getComponentName(nameObj) {
  switch (nameObj.type) {
    case "JSXIdentifier": {
      return nameObj.name;
    }

    case "JSXMemberExpression": {
      return `${getComponentName(nameObj.object)}.${getComponentName(
        nameObj.property
      )}`;
    }

    /* c8 ignore next 3 */
    default: {
      throw new Error(`Unknown name type: ${nameObj.type}`);
    }
  }
}

function getPropValue(node) {
  if (node === null) {
    return null;
  }

  if (node.type === "Literal") {
    return node.value;
  }

  if (node.type === "JSXExpressionContainer") {
    if (node.expression.type === "Literal") {
      return node.expression.value;
    }

    return `(${node.expression.type})`;
    /* c8 ignore next 3 */
  }

  throw new Error(`Unknown node type: ${node.type}`);
}

function getInstanceInfo(node, filePath) {
  const { attributes } = node;
  const result = {
    props: {},
    propsSpread: false,
    location: {
      file: filePath,
      start: node.name.loc.start,
    },
  };

  for (let i = 0, len = attributes.length; i < len; i++) {
    const attribute = attributes[i];

    if (attribute.type === "JSXAttribute") {
      const { name, value } = attribute;
      const propName = name.name;
      const propValue = getPropValue(value);

      result.props[propName] = propValue;
    } else if (attribute.type === "JSXSpreadAttribute") {
      result.propsSpread = true;
    }
  }

  return result;
}

function scan({
  code,
  filePath,
  components,
  includeSubComponents = false,
  report,
}) {
  let ast;

  try {
    ast = parse(code, parseOptions);
  } catch (_e) {
    console.error(`Failed to parse: ${filePath}`);
    return;
  }

  astray.walk(
    ast,
    {
      JSXOpeningElement(node, report) {
        const name = getComponentName(node.name);
        const nameParts = name.split(".");
        const shouldScanComponent =
          !components ||
          (components[nameParts[0]] &&
            (nameParts.length === 1 || includeSubComponents));

        if (!shouldScanComponent) {
          return astray.SKIP;
        }

        const componentPath = nameParts.join(".components.");
        let componentInfo = getObjectPath(report, componentPath);

        if (!componentInfo) {
          componentInfo = {};
          setObjectPath(report, componentPath, componentInfo);
        }

        if (!componentInfo.instances) {
          componentInfo.instances = [];
        }

        const info = getInstanceInfo(node, filePath);

        componentInfo.instances.push(info);
      },
    },
    report
  );
}

module.exports = scan;
