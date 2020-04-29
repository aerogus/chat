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
  , port = process.env.PORT || 6667
  , fs = require('fs')
  , sqlite3 = require('sqlite3');

// todo construction DB si n'existe pas
if (!fs.existsSync('./chat.db')) {
  console.log('non');
}

const db = new sqlite3.Database('./chat.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connecté');
});

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

let numUsers = 0;

// connexion d'un nouvel user
io.on('connection', (socket) => {
  let addedUser = false;

  // réception d'un nouveau message
  socket.on('new message', (data) => {
    console.log('new message');
    socket.broadcast.emit('new message', {
      userName: socket.userName,
      message: data,
    });
  });

  // réception d'un 'add user'
  socket.on('add user', (userName) => {
    console.log('add user');
    if (addedUser) {
      return;
    }

    socket.userName = userName;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers,
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      userName: socket.userName,
      numUsers: numUsers,
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    console.log('typing');
    socket.broadcast.emit('typing', {
      userName: socket.userName,
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    console.log('stop typing');
    socket.broadcast.emit('stop typing', {
      userName: socket.userName,
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    console.log('disconnect');
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        userName: socket.userName,
        numUsers: numUsers,
      });
    }
  });
});

// fonctions DB

function findLastEvents() {
  const query = 'SELECT ts, room, user, type, message FROM event ORDER BY ts ASC';
  db.query(query);
}

function userJoinRoom (user, room) {
  const query = 'INSERT INTO room_user (room, user) VALUES(%s,%s)';
  db.query(query);
}

function userLeaveRoom (user, room) {
  const query = 'DELETE FROM room_user WHERE room = %s AND user = %s';
  db.query(query);
}

function findUsersByRoom (room) {
  const query = 'SELECT user FROM room_user WHERE room = %s';
  db.query(query);
}

function addEvent (room, user, type, message) {
  db.query('INSERT INTO chat_event (room, user, type, message) VALUES("main", "gus", "message", "coucou")', (error, results, fields) => {
    if (error) {
      throw error;
    };
  });
}
