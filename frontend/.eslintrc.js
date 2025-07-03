module.exports = {
  plugins: ["unused-imports"],
  parserOptions: {
    parser: "@typescript-eslint/parser",
    sourceType: "module"
  },
  extends: ["plugin:vue/vue3-recommended"],
  rules: {
    "vue/max-attributes-per-line": "off",
    "vue/multi-word-component-names": "off",
    "vue/html-self-closing": "off",
    "vue/singleline-html-element-content-newline": "off",
    "no-unused-vars": "warn",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_"
      }
    ]
  }
};
