#!/usr/bin/env node

/**
 * Serveur de salon de discussion
 */

'use strict';

const express = require('express')
  , app = express()
  , path = require('path')
  , server = require('http').createServer(app)
  , io = require('socket.io')(server)
  , fs = require('fs')
  , sqlite3 = require('sqlite3').verbose();;

const port = process.env.PORT || 82
  , dbFile = path.join(__dirname, '/chat.db')

// nombre total d'utilisateurs connectés
let numUsers = 0;

// nom du salon, todo: multi salons
let room = 'main';

// connexion à la DB, la créée si inexistante
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error(err.message);
  }
  db.run(`CREATE TABLE IF NOT EXISTS event (
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    room varchar(30) NOT NULL,
    user varchar(30) NOT NULL,
    type varchar(30) NOT NULL,
    message text
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS room_user (
    room varchar(30) NOT NULL,
    user varchar(30) NOT NULL,
    PRIMARY KEY(room, user)
  )`);
  console.log('Connecté');
});

server.listen(port, () => {
  console.log('Démarrage du serveur sur port %d', port);
});

// fichiers statiques ici
app.use(express.static(path.join(__dirname, 'public')));

// connexion d'un nouvel user
io.on('connection', (socket) => {
  let addedUser = false;

  /**
   * réception d'un 'new message'
   */
  socket.on('new message', (data) => {
    console.log('new message');

    addEvent(room, socket.userName, 'message', data); 

    socket.broadcast.emit('new message', {
      userName: socket.userName,
      message: data,
    });
  });

  /**
   * réception d'un 'add user'
   */
  socket.on('add user', (userName) => {
    console.log('add user');
    if (addedUser) {
      return;
    }

    socket.userName = userName;
    ++numUsers;
    addedUser = true;

    addEvent(room, socket.userName, 'join');
    userJoinRoom(socket.userName, room);

    socket.emit('login', {
      numUsers: numUsers,
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      userName: socket.userName,
      numUsers: numUsers,
    });
  });

  /**
   * réception en cours d'écriture, we broadcast it to others
   */
  socket.on('typing', () => {
    console.log('typing');

    socket.broadcast.emit('typing', {
      userName: socket.userName,
    });
  });

  /**
   * réception fin d'écriture, we broadcast it to others
   */
  socket.on('stop typing', () => {
    console.log('stop typing');

    socket.broadcast.emit('stop typing', {
      userName: socket.userName,
    });
  });

  /**
   * réception déconnexion
   */
  socket.on('disconnect', () => {
    console.log('disconnect');

    if (addedUser) {
      --numUsers;

      addEvent(room, socket.userName, 'leave');
      userLeaveRoom(socket.userName, room);

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        userName: socket.userName,
        numUsers: numUsers,
      });
    }
  });
});

// fonctions DB

function userJoinRoom (user, room) {
  const query = `INSERT INTO room_user (room, user) VALUES (?, ?)`;
  const values = [room, user];
  db.run(query, values, err => {
    console.log(err);
  });
}

function userLeaveRoom (user, room) {
  const query = `DELETE FROM room_user WHERE room = ? AND user = ?`;
  const values = [room, user];
  db.run(query, values, err => {
    console.log(err);
  });
}

function addEvent (room, user, type, message = '') {
  const query = `INSERT INTO event (room, user, type, message) VALUES (?, ?, ?, ?)`;
  const values = [room, user, type, message];
  db.run(query, values, err => {
    console.log(err);
  });
}
