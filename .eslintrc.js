module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "MCSERVER": "writeable",
        "__dirname": "writeable",
        "Buffer": "writeable",
        "process": "writeable",
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "no-unused-vars": "warn",
        "no-use-before-define": "warn",
        "no-undef": "warn",
        "no-use-before-define": "off",
        "no-prototype-builtins": "off",
    }
};