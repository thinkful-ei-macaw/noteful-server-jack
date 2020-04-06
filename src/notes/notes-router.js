const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
  id: note.id,
  name: xss(note.name),
  modified: note.modified,
  content: xss(note.content),
  folder_id: note.folder_id
});

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    NotesService.getAllNotes(knexInstance).then(notes => {
      res.json(notes.map(serializeNote));
    });
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { name, content, folder_id } = req.body;
    const newNote = { name, content, folder_id };

    for (const [key, value] of Object.entries(newNote))
      if (value == null)
        return res.status(400).json({
          error: {
            message: `Missing ${key} in request body`
          }
        });

    NotesService.insertNote(knexInstance, newNote)
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${note.id}`));
      })
      .catch(next);
  });

notesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    NotesService.getById(knexInstance, req.params.note_id)
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: {
              message: `Note doesn't exist`
            }
          });
        }
        res.note = note;
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note));
  });
module.exports = notesRouter;
