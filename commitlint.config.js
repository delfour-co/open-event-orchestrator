export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'cfp',
        'planning',
        'billing',
        'crm',
        'budget',
        'api',
        'core',
        'ui',
        'deps',
        'config',
        'e2e',
        'test',
        'docs',
        'ci'
      ]
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100]
  }
}
