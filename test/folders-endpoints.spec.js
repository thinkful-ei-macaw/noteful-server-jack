const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray } = require('./folders.fixtures');

describe('Folders endpoints', () => {
  let db;

  before('make a knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () =>
    db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE')
  );

  afterEach('cleanup', () =>
    db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE')
  );

  describe('GET /api/folders', () => {
    context(`Given there are NO folders in the db`, () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app).get('/api/folders').expect(200, []);
      });
    });

    context(`Given there are folders in the db`, () => {
      const testFolders = makeFoldersArray();

      beforeEach('insert test folders', () => {
        return db('folders').insert(testFolders);
      });

      it('responds with 200 and all folders', () => {
        return supertest(app).get('/api/folders').expect(200, testFolders);
      });
    });
  });
});
