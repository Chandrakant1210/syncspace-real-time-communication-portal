const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

/** Starts an in-memory MongoDB and connects Mongoose to it. Call in beforeAll(). */
const connectTestDb = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

/** Disconnects and shuts down the in-memory MongoDB. Call in afterAll(). */
const disconnectTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

/** Clears all collections between tests. Call in afterEach(). */
const clearTestDb = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connectTestDb, disconnectTestDb, clearTestDb };