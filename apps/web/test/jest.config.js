module.exports = {
  rootDir: '..',
  testEnvironment: 'jsdom',
  testRegex: 'test/.*\\.spec\\.tsx$',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  clearMocks: true,
};
