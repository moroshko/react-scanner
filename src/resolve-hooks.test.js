const { suite } = require("uvu");
const assert = require("uvu/assert");
const path = require("path");
const scan = require("./scan");
const scanner = require("./scanner");
const { validateConfig } = require("./utils");

const Hooks = suite("resolve hooks");
const filePath = "example.tsx";
const importInfo = {
  imported: "Button",
  local: "Alias",
  moduleName: "example-ui",
  importType: "ImportSpecifier",
};
const getReport = (code, config = {}) => {
  const report = {};
  scan({ code, filePath, report, ...config });
  return report;
};

Hooks("records unused imports with their specifier location", () => {
  const report = getReport(
    'import { Button as Alias, Label } from "example-ui";',
    {
      resolveImport: ({
        filePath: file,
        node,
        specifier,
        importInfo: info,
      }) => {
        assert.is(node.type, "ImportDeclaration");
        return {
          componentName: info.imported,
          importRecord: { ...info, file, start: specifier.loc.start },
        };
      },
    }
  );
  assert.equal(report.Button, {
    instances: [],
    imports: [{ ...importInfo, file: filePath, start: { line: 1, column: 9 } }],
  });
  assert.is(report.Label.imports.length, 1);
});

Hooks("can decline imports and append repeated import records", () => {
  const report = getReport(
    'import { Button } from "example-ui";\nimport { Button as Other } from "example-ui";\nimport { Ignore } from "other-ui";',
    {
      resolveImport: ({ importInfo: info }) => {
        if (info.moduleName !== "example-ui") return null;
        return { componentName: "Button", importRecord: info.local };
      },
    }
  );
  assert.equal(report.Button, { instances: [], imports: ["Button", "Other"] });
  assert.is(report.Ignore, undefined);
});

Hooks("keeps import records separate from rendered instances", () => {
  const report = getReport('import { Button } from "example-ui"; <Button />;', {
    resolveImport: () => ({ componentName: "Button", importRecord: "import" }),
  });
  assert.equal(report.Button.imports, ["import"]);
  assert.is(report.Button.instances.length, 1);
});

Hooks("stores nested imports with no rendered root", () => {
  const report = getReport('import { Item } from "example-ui";', {
    resolveImport: () => ({ componentName: "Menu.Item", importRecord: "item" }),
  });
  assert.equal(report.Menu.components.Item, {
    instances: [],
    imports: ["item"],
  });
});

Hooks("exposes default, namespace and type-only import metadata", () => {
  const report = getReport(
    'import Default from "example-ui"; import * as Menu from "example-ui"; import type { Button } from "example-ui"; import { type Label } from "example-ui";',
    {
      resolveImport: ({ node, specifier, importInfo: info }) => ({
        componentName: info.imported || info.local,
        importRecord: {
          importType: info.importType,
          typeOnly:
            node.importKind === "type" || specifier.importKind === "type",
        },
      }),
    }
  );
  assert.equal(report.Default.imports, [
    { importType: "ImportDefaultSpecifier", typeOnly: false },
  ]);
  assert.equal(report.Menu.imports, [
    { importType: "ImportNamespaceSpecifier", typeOnly: false },
  ]);
  assert.equal(report.Button.imports, [
    { importType: "ImportSpecifier", typeOnly: true },
  ]);
  assert.equal(report.Label.imports, [
    { importType: "ImportSpecifier", typeOnly: true },
  ]);
});

Hooks("resolves a tag imported through a different module", () => {
  const report = getReport(
    'import { Alias } from "./barrel"; <Alias tone="quiet" />;',
    {
      importedFrom: "example-ui",
      getComponentName: () => "Ignored",
      resolveComponent: ({ filePath: file, node, name }) => {
        assert.is(file, filePath);
        assert.is(node.type, "JSXOpeningElement");
        assert.is(name, "Alias");
        return { componentName: "Button", importInfo };
      },
    }
  );
  assert.equal(report.Button.instances[0].importInfo, importInfo);
  assert.equal(report.Button.instances[0].props, { tone: "quiet" });
  assert.is(report.Alias, undefined);
  assert.is(report.Ignored, undefined);
});

Hooks("declines a shadowed tag without falling back to the import name", () => {
  const report = getReport(
    'import { Button } from "example-ui"; function Example(Button) { return <Button />; }',
    { resolveComponent: () => null }
  );
  assert.equal(report, {});
});

Hooks("uses resolved names for component and subcomponent filters", () => {
  const resolveComponent = () => ({ componentName: "Menu.Item", importInfo });
  assert.equal(getReport("<Alias />", { resolveComponent }), {});
  assert.equal(
    getReport("<Alias />", {
      resolveComponent,
      includeSubComponents: true,
      components: { Button: true },
    }),
    {}
  );
  const report = getReport("<Alias />", {
    resolveComponent,
    includeSubComponents: true,
    components: { "Menu.Item": true },
  });
  assert.is(report.Menu.components.Item.instances.length, 1);
});

Hooks("uses resolved import metadata for module filters", () => {
  const resolveComponent = () => ({ componentName: "Button", importInfo });
  assert.equal(
    getReport("<Alias />", { resolveComponent, importedFrom: "other-ui" }),
    {}
  );
  assert.equal(
    getReport("<Alias />", { resolveComponent, importedFrom: /other-ui/ }),
    {}
  );
  assert.is(
    getReport("<Alias />", { resolveComponent, importedFrom: /example-ui/ })
      .Button.instances.length,
    1
  );
  assert.equal(
    getReport("<Alias />", {
      resolveComponent: () => ({ componentName: "Button" }),
      importedFrom: "example-ui",
    }),
    {}
  );
  assert.is(
    getReport("<Alias />", {
      resolveComponent: () => ({ componentName: "Button" }),
    }).Button.instances.length,
    1
  );
});

Hooks("forwards resolver options through scanner.run", async () => {
  let imports = 0;
  let components = 0;
  const output = await scanner.run({
    rootDir: path.resolve("test"),
    crawlFrom: "code",
    resolveImport: () => {
      imports += 1;
      return { componentName: "Example", importRecord: "import" };
    },
    resolveComponent: () => {
      components += 1;
      return { componentName: "Example" };
    },
    processors: [({ report }) => report],
  });
  assert.ok(imports > 0);
  assert.ok(components > 0);
  assert.is(output.Example.imports.length, imports);
  assert.is(output.Example.instances.length, components);
});

Hooks("validates both optional callback types", () => {
  const config = { crawlFrom: "test" };
  assert.equal(validateConfig(config, process.cwd()).errors, []);
  for (const hook of ["resolveImport", "resolveComponent"]) {
    assert.equal(
      validateConfig({ ...config, [hook]: () => {} }, process.cwd()).errors,
      []
    );
    assert.equal(
      validateConfig({ ...config, [hook]: "invalid" }, process.cwd()).errors,
      [`${hook} should be a function`]
    );
  }
});

Hooks.run();
