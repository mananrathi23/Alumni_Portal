export default {
  transform: {},
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Replace native bcrypt with pure-JS bcryptjs so tests run without native binaries
    '^bcrypt$': 'bcryptjs',
  },
};
