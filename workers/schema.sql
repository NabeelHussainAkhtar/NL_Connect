DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS presence;
DROP TABLE IF EXISTS typing;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  display_name TEXT,
  status TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  sender_uid TEXT NOT NULL,
  receiver_uid TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  media_name TEXT,
  media_size INTEGER,
  status TEXT DEFAULT 'sent',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sender_uid) REFERENCES users(uid),
  FOREIGN KEY(receiver_uid) REFERENCES users(uid)
);

CREATE TABLE presence (
  uid TEXT PRIMARY KEY,
  is_online INTEGER DEFAULT 0,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  peer_id TEXT
);

CREATE TABLE typing (
  chat_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chat_id, uid)
);
