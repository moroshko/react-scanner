const { parse } = require("@typescript-eslint/typescript-estree");
const astray = require("astray");
const getObjectPath = require("dlv");
const { dset } = require("dset");

const parseOptions = {
  loc: true,
  jsx: true,
};

function getComponentNameFromAST(nameObj) {
  switch (nameObj.type) {
    case "JSXIdentifier": {
      return nameObj.name;
    }

    case "JSXMemberExpression": {
      return `${getComponentNameFromAST(
        nameObj.object
      )}.${getComponentNameFromAST(nameObj.property)}`;
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

function getInstanceInfo({
  node,
  filePath,
  importInfo,
  getPropValue: customGetPropValue,
  componentName,
}) {
  const { attributes } = node;
  const result = {
    ...(importInfo !== undefined && { importInfo }),
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
      const propValue = customGetPropValue
        ? customGetPropValue({
            node: value,
            propName,
            componentName,
            defaultGetPropValue: getPropValue,
          })
        : getPropValue(value);

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
  importedFrom,
  getComponentName = ({ imported, local }) =>
    imported === "default" ? local : imported || local,
  report,
  getPropValue,
}) {
  let ast;

  try {
    ast = parse(code, parseOptions);
  } catch (_e) {
    console.error(`Failed to parse: ${filePath}`);
    return;
  }

  const importsMap = {};

  astray.walk(ast, {
    ImportDeclaration(node) {
      const { source, specifiers } = node;
      const moduleName = source.value;
      const specifiersCount = specifiers.length;

      for (let i = 0; i < specifiersCount; i++) {
        switch (specifiers[i].type) {
          case "ImportDefaultSpecifier":
          case "ImportSpecifier":
          case "ImportNamespaceSpecifier": {
            const imported = specifiers[i].imported
              ? specifiers[i].imported.name
              : null;
            const local = specifiers[i].local.name;

            importsMap[local] = {
              ...(imported !== null && { imported }),
              local,
              moduleName,
              importType: specifiers[i].type,
            };
            break;
          }

          /* c8 ignore next 5 */
          default: {
            throw new Error(
              `Unknown import specifier type: ${specifiers[i].type}`
            );
          }
        }
      }
    },
    JSXOpeningElement: {
      exit(node) {
        const name = getComponentNameFromAST(node.name);
        const nameParts = name.split(".");
        const [firstPart, ...restParts] = nameParts;
        const actualFirstPart = importsMap[firstPart]
          ? getComponentName(importsMap[firstPart])
          : firstPart;
        const shouldReportComponent = () => {
          if (components) {
            if (nameParts.length === 1) {
              if (components[actualFirstPart] === undefined) {
                return false;
              }
            } else {
              const actualComponentName = [actualFirstPart, ...restParts].join(
                "."
              );

              if (
                components[actualFirstPart] === undefined &&
                components[actualComponentName] === undefined
              ) {
                return false;
              }
            }
          }

          if (includeSubComponents === false) {
            if (nameParts.length > 1) {
              return false;
            }
          }

          if (importedFrom) {
            if (!importsMap[firstPart]) {
              return false;
            }

            const actualImportedFrom = importsMap[firstPart].moduleName;

            if (importedFrom instanceof RegExp) {
              if (importedFrom.test(actualImportedFrom) === false) {
                return false;
              }
            } else if (actualImportedFrom !== importedFrom) {
              return false;
            }
          }

          return true;
        };

        if (!shouldReportComponent()) {
          return astray.SKIP;
        }

        const componentParts = [actualFirstPart, ...restParts];

        const componentPath = componentParts.join(".components.");
        const componentName = componentParts.join(".");
        let componentInfo = getObjectPath(report, componentPath);

        if (!componentInfo) {
          componentInfo = {};
          dset(report, componentPath, componentInfo);
        }

        if (!componentInfo.instances) {
          componentInfo.instances = [];
        }

        const info = getInstanceInfo({
          node,
          filePath,
          importInfo: importsMap[firstPart],
          getPropValue,
          componentName,
        });

        componentInfo.instances.push(info);
      },
    },
  });
}

module.exports = scan;
