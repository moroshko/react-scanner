import type { Position } from "estree";
import type {
  Literal,
  JSXExpressionContainer,
  JSXElement,
  JSXFragment,
  JSXIdentifier,
} from "estree-jsx";

export type ProcessorName =
  | "count-components"
  | "count-components-and-props"
  | "raw-report";

type ProcessorConfig = {
  outputTo: string;
};
type ProcessorWithConfig = [ProcessorName, ProcessorConfig];
export type ProcessorOptions = {
  outputTo: string;
};
export type ProcessorFunctionArgs = {
  report: Report;
  prevResults: unknown[];
  prevResult: unknown;
  forEachComponent: (callback: ComponentCallback) => void;
  sortObjectKeysByValue: <Value = string>(
    obj: Record<string, Value>,
    mapValue?: undefined | ((value: Value) => string | number)
  ) => Record<string, Value>;
  output: (data: unknown, destination?: string) => void;
};
export type ProcessorFunction = (
  args: ProcessorFunctionArgs
) => Promise<unknown>;
type Processor = ProcessorName | ProcessorWithConfig | ProcessorFunction;

export type ImportInfo = {
  local: string;
  imported?: string;
  moduleName: string | boolean | number | bigint | RegExp | null | undefined;
  importType:
    | "ImportDefaultSpecifier"
    | "ImportSpecifier"
    | "ImportNamespaceSpecifier";
};

export type GetComponentNameFunction = (args: ImportInfo) => string;

export type PropNode =
  | Literal
  | JSXExpressionContainer
  | JSXElement
  | JSXFragment
  | null;

export type PropValue = string | number | boolean | RegExp | null | undefined;

export type GetPropValueFunction = (args: {
  node: PropNode;
  componentName: string;
  propName: string | JSXIdentifier;
  defaultGetPropValue: (node: PropNode) => PropValue;
}) => PropValue;

export type Config = {
  rootDir?: string;
  crawlFrom?: string;
  includeSubComponents?: boolean;
  importedFrom?: string | RegExp;
  processors?: Processor[];
  globs?: string[];
  exclude?: Array<string | RegExp> | ((dir: string) => boolean);
  components?: Record<string, true>;
  getComponentName?: GetComponentNameFunction;
  getPropValue?: GetPropValueFunction;
};

export type InstanceInfo = {
  propsSpread: boolean;
  props: Record<string, PropValue>;
  location: {
    file: string;
    start: Position | undefined;
  };
};

export type Report = Record<
  string,
  {
    id?: number;
    components?: Report | undefined;
    instances?: InstanceInfo[];
  }
>;

export type ComponentCallbackArgs = {
  componentName: string;
  component: {
    id?: number;
    components?: Report | undefined;
    instances?: InstanceInfo[];
  };
};

export type ComponentCallback = (args: ComponentCallbackArgs) => void;
