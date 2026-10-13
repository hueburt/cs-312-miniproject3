-- ---------- Tables ----------

-- Accounts that can sign in
CREATE TABLE users (
  user_id  VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  name     VARCHAR(255) NOT NULL
);

-- Blog posts. creator_user_id links back to users.user_id
CREATE TABLE blogs (
  blog_id         SERIAL PRIMARY KEY,
  creator_name    VARCHAR(255) NOT NULL,
  creator_user_id VARCHAR(255) REFERENCES users(user_id),
  title           VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  date_created    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------- Sample users (at least 3) ----------

INSERT INTO users (user_id, password, name) VALUES
  ('alice', 'password1', 'Alice Johnson'),
  ('bob',   'password2', 'Bob Smith'),
  ('carol', 'password3', 'Carol Davis');

-- ---------- Sample blogs (at least 5) ----------

INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) VALUES
  ('Alice Johnson', 'alice', 'first post',
   'the fitst post!',
   NOW() - INTERVAL '5 days'),

  ('Bob Smith', 'bob', 'second post',
   E'the second post',
   NOW() - INTERVAL '4 days'),

  ('Carol Davis', 'carol', '3rd',
   'the thrideth posteth?!?!?',
   NOW() - INTERVAL '3 days'),

  ('Alice Johnson', 'alice', '4th',
   E'4th',
   NOW() - INTERVAL '2 days'),

  ('Bob Smith', 'bob', 'last',
   'final post',
   NOW() - INTERVAL '1 day');