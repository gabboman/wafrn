import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,html}"],
    excludedFiles: ["*inline-template-*.component.html"],
    extends: [
      "plugin:@angular-eslint/template/recommended",
      "plugin:prettier/recommended",
    ],
    rules: {
      "prettier/prettier": ["error", { parser: "angular" }],
    },
  },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
