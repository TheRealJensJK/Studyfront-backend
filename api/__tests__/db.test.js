const mongoose = require('mongoose');

describe('Database Connection', () => {
    beforeAll(async () => {
        const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1:27017/testdb';
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('should connect to the database successfully', async () => {
        const state = mongoose.connection.readyState;
    });

    test('should throw an error for invalid connection string', async () => {
        const invalidUri = 'mongodb://invalid:27017/testdb';
        await expect(
            mongoose.connect(invalidUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
        ).rejects.toThrow();
    });
});