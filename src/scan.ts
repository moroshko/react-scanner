import { AST, parse } from "@typescript-eslint/typescript-estree";
import astray from "@mihkeleidast/astray";
import getObjectPath from "dlv";
import { dset } from "dset";
import type { JSXOpeningElement } from "estree-jsx";
import type {
  GetComponentNameFunction,
  ImportInfo,
  GetPropValueFunction,
  Report,
  PropNode,
  InstanceInfo,
} from "./types";

const parseOptions = {
  loc: true,
  jsx: true,
};

function getComponentNameFromAST(nameObj: JSXOpeningElement["name"]): string {
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

function getPropValue(node: PropNode) {
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

type GetInstanceInfoArgs = {
  node: JSXOpeningElement;
  filePath: string;
  importInfo: ImportInfo | undefined;
  getPropValue: GetPropValueFunction | undefined;
  componentName: string;
};

function getInstanceInfo({
  node,
  filePath,
  importInfo,
  getPropValue: customGetPropValue,
  componentName,
}: GetInstanceInfoArgs): InstanceInfo {
  const { attributes } = node;
  const result: InstanceInfo = {
    ...(importInfo !== undefined && { importInfo }),
    props: {},
    propsSpread: false,
    location: {
      file: filePath,
      start: node.name.loc?.start,
    },
  };

  for (let i = 0, len = attributes.length; i < len; i++) {
    const attribute = attributes[i];

    if (attribute && attribute.type === "JSXAttribute") {
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

      result.props[propName.toString()] = propValue;
    } else if (attribute && attribute.type === "JSXSpreadAttribute") {
      result.propsSpread = true;
    }
  }

  return result;
}

type ScanArgs = {
  code: string;
  filePath: string;
  components: Record<string, true> | undefined;
  includeSubComponents?: boolean | undefined;
  importedFrom?: string | RegExp | undefined;
  getComponentName?: GetComponentNameFunction | undefined;
  getPropValue?: GetPropValueFunction | undefined;
  report: Report;
};

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
}: ScanArgs) {
  let ast: AST<Record<string, unknown>>;

  try {
    ast = parse(code, parseOptions);
  } catch (_e) {
    console.error(`Failed to parse: ${filePath}`);
    return;
  }

  const importsMap: Record<string, ImportInfo> = {};

  astray.walk(ast, {
    ImportDeclaration(node) {
      const { source, specifiers } = node;
      const moduleName = source.value;
      const specifiersCount = specifiers.length;

      for (let i = 0; i < specifiersCount; i++) {
        const spec = specifiers[i];
        if (spec) {
          switch (spec.type) {
            case "ImportDefaultSpecifier":
            case "ImportSpecifier":
            case "ImportNamespaceSpecifier": {
              const imported = "imported" in spec ? spec.imported.name : null;
              const local = spec.local.name;

              importsMap[local] = {
                ...(imported !== null && { imported }),
                local,
                moduleName,
                importType: spec.type,
              };
              break;
            }

            /* c8 ignore next 5 */
            default: {
              // @ts-expect-error expected runtime error
              throw new Error(`Unknown import specifier type: ${spec.type}`);
            }
          }
        }
      }
    },
    JSXOpeningElement: {
      exit(node) {
        const name = getComponentNameFromAST(node.name);
        const nameParts = name.split(".");
        const [firstPart, ...restParts] = nameParts;
        if (!firstPart) return;

        const importsItem = importsMap[firstPart];

        const actualFirstPart = importsItem
          ? getComponentName(importsItem)
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
            if (!importsItem) {
              return false;
            }

            const actualImportedFrom = importsItem.moduleName;

            if (
              importedFrom instanceof RegExp &&
              typeof actualImportedFrom === "string"
            ) {
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

        return;
      },
    },
  });
}

export default scan;
