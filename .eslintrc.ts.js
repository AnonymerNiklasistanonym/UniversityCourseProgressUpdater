module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2020: true
    },
    extends: [
        'standard'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 11,
        project: "tsconfig.json"
    },
    plugins: [
        '@typescript-eslint'
    ],
    rules: {
        'require-await': 'error',
        indent: ['error', 4],
        '@typescript-eslint/no-floating-promises': 'error'
    }
}
