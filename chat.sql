CREATE TABLE event (
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  room varchar(30) NOT NULL,
  user varchar(30) NOT NULL,
  type varchar(30) NOT NULL,
  message text
);

CREATE TABLE room_user (
  room varchar(30) NOT NULL,
  user varchar(30) NOT NULL,
  PRIMARY KEY(room, user)
);

