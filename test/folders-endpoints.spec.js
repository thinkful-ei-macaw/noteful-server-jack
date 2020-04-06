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

  describe('POST /api/folders', () => {
    const validFolder = {
      name: 'Valid Folder'
    };

    it('should create a new folder when name is provided', () => {
      return supertest(app)
        .post('/api/folders')
        .send(validFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(validFolder.name);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        })
        .then(res => {
          return supertest(app)
            .get(`/api/folders/${res.body.id}`)
            .expect(res.body);
        });
    });

    it('should send back a 400 error if name is not provided', () => {
      const invalidFolder = {
        invalid: 'invalid'
      };
      return supertest(app)
        .post('/api/folders')
        .send(invalidFolder)
        .expect(400);
    });
  });
});
