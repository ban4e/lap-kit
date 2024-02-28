module.exports = {
    moduleNameMapper: {
        '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/$1'
    },
    preset: 'ts-jest',
    rootDir: 'src', // The root directory that Jest should scan for tests and modules within.
    setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'], // A list of paths to modules that run some code to configure or set up the testing framework before each test file in the suite is executed
    testEnvironment: 'jsdom', // The test environment that will be used for testing.
    testPathIgnorePatterns: ['<rootDir>/__tests__/setupTests.ts'] // An array of regexp pattern strings that are matched against all test paths before executing the test
};
