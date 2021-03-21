--
-- File generated with SQLiteStudio v3.2.1 on lör okt 10 13:34:01 2020
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;




-- Table: password_reset_tokens
CREATE TABLE password_reset_tokens (
    userid  INTEGER   PRIMARY KEY,
    token   TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        userid
    )
    REFERENCES users (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION
);


-- Table: saved_sessions
CREATE TABLE saved_sessions (
    [key]     TEXT,
    timestamp TIMESTAMP,
    userId    INTEGER
);


-- Table: users
CREATE TABLE users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT
);



-- Index: username_idx
CREATE UNIQUE INDEX username_idx ON users (
    username COLLATE NOCASE
);




-- Table: userinfo
CREATE TABLE userinfo (
    userid        INTEGER PRIMARY KEY,
    password      TEXT,
    email         TEXT,
    phonenr       TEXT,
    name          TEXT,
    sendremainder BOOLEAN DEFAULT 0,
    FOREIGN KEY (
        userid
    )
    REFERENCES users (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION
);





-- View: v_userinfo
CREATE VIEW v_userinfo AS
    SELECT u.username,
           i.*
      FROM users u
           LEFT JOIN
           userinfo i ON u.id = i.userid;


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
