export default {
  transform: {},
  testEnvironment: 'node',
  testTimeout: 30000,  // MongoMemoryServer needs time to download/start
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Replace native bcrypt with pure-JS bcryptjs so tests run without native binaries
    '^bcrypt$': 'bcryptjs',
  },
};
