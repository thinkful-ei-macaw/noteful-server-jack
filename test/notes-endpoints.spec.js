const knex = require('knex');
const app = require('../src/app');
const { makeNotesArray } = require('./notes.fixtures');
const { makeFoldersArray } = require('./folders.fixtures');

describe.only('notes endpoints', () => {
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

  describe('GET /notes ', () => {
    context(`Given no notes in the db`, () => {
      it('returns 200 and an empty array', () => {
        return supertest(app).get('/api/notes').expect(200, []);
      });
    });

    context(`Given there are notes in the db`, () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('insert folders and notes into table', () => {
        return db('folders')
          .insert(testFolders)
          .then(() => db('notes').insert(testNotes));
      });

      it('returns 200 with an array of notes', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200)
          .expect(res => {
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.be.an('object');
            expect(res.body[0]).to.have.all.keys(
              'id',
              'name',
              'modified',
              'folder_id',
              'content'
            );
          });
      });
    });
  });

  describe('POST /notes', () => {
    const testFolders = makeFoldersArray();

    beforeEach('insert folders into table for reference', () => {
      return db('folders').insert(testFolders);
    });

    const validNote = {
      name: 'Test Note',
      content: 'Test note content',
      folder_id: 3
    };

    it('should create a new note when valid info is provided', () => {
      return supertest(app)
        .post('/api/notes')
        .send(validNote)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(validNote.name);
          expect(res.body.content).to.eql(validNote.content);
          expect(res.body.folder_id).to.eql(validNote.folder_id);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`);
        })
        .then(res => {
          return supertest(app)
            .get(`/api/notes/${res.body.id}`)
            .expect(res.body);
        });
    });
  });
});
