const express = require('express');
const path = require('path');
const session = require('express-session');
const pool = require('./db');

// Create express application instance
const app = express();

// The port number
const PORT = 3000;

// ---------- Setup ----------

//Use EJS as the template engine for rendering pages
app.set('view engine', 'ejs');

//Set location
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Track the signed-in user across requests
app.use(session({
  secret: 'mini-blog-session-secret',
  resave: false,
  saveUninitialized: false
}));

// ---------- Routes ----------

// 1) Homepage: show the new-post form and the list of all posts
app.get('/', async function (req, res) {
  // Pull every post, newest first
  const result = await pool.query(
    'SELECT * FROM blogs ORDER BY date_created DESC'
  );
  // Render views/index.ejs hand to current posts and signed-in user
  res.render('index', { posts: result.rows, user: req.session.user });
});

// 2) Create a new post
app.post('/posts', async function (req, res) {
  // Only signed-in users may post
  if (!req.session.user) {
    res.redirect('/signin');
    return;
  }

  // Pull the two fields out of the submitted form data
  const title = req.body.title;
  const content = req.body.content;

  // INSERT a new row into the blogs table
  await pool.query(
    'INSERT INTO blogs (creator_name, creator_user_id, title, body, date_created) ' +
    'VALUES ($1, $2, $3, $4, $5)',
    [req.session.user.name, req.session.user.user_id, title, content, new Date()]
  );

  // Send user back to homepage
  res.redirect('/');
});

// 3) Load edit form for one post
app.get('/posts/:id/edit', async function (req, res) {
  // req.params.id convert to number to compare
  const id = parseInt(req.params.id);

  // Search database for matching post
  const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [id]);
  const foundPost = result.rows[0];

  // if not found, redirect home
  if (!foundPost) {
    res.redirect('/');
    return;
  }

  // Only the creator can edit their own posts
  if (!req.session.user || req.session.user.user_id !== foundPost.creator_user_id) {
    res.redirect('/');
    return;
  }

  // Render edit form, fill with posts current values
  res.render('edit', { post: foundPost });
});

// 4) Edit a post
//Update the row in place
app.post('/posts/:id/edit', async function (req, res) {
  const id = parseInt(req.params.id);

  // Look up the post so we can check ownership before changing anything
  const check = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [id]);
  const post = check.rows[0];

  if (!post || !req.session.user || req.session.user.user_id !== post.creator_user_id) {
    res.redirect('/');
    return;
  }

  // UPDATE the blog row with the new values
  await pool.query(
    'UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3',
    [req.body.title, req.body.content, id]
  );

  // Send user back to homepage
  res.redirect('/');
});

// 5) Delete a post
app.post('/posts/:id/delete', async function (req, res) {
  // Convert URL parameter to number for comparison
  const id = parseInt(req.params.id);

  // Look up the post so we can check ownership before deleting
  const check = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [id]);
  const post = check.rows[0];

  if (!post || !req.session.user || req.session.user.user_id !== post.creator_user_id) {
    res.redirect('/');
    return;
  }

  // Remove the row from the blogs table
  await pool.query('DELETE FROM blogs WHERE blog_id = $1', [id]);

  // Send user back to the homepage
  res.redirect('/');
});

// 6) Show the sign-up page
app.get('/signup', function (req, res) {
  // No error yet on first visit
  res.render('signup', { error: null });
});

// 7) Create a new account
app.post('/signup', async function (req, res) {
  const userId = req.body.user_id;
  const password = req.body.password;
  const name = req.body.name;

  // Check whether the user_id is already taken
  const existing = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

  if (existing.rows.length > 0) {
    // Prompt the user to pick a different user_id
    res.render('signup', { error: 'That user ID is already taken. Please choose another.' });
    return;
  }

  // INSERT the new user into the users table
  await pool.query(
    'INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)',
    [userId, password, name]
  );

  // Send user to the sign-in page
  res.redirect('/signin');
});

// 8) Show the sign-in page
app.get('/signin', function (req, res) {
  // No error yet on first visit
  res.render('signin', { error: null });
});

// 9) Sign in an existing user
app.post('/signin', async function (req, res) {
  const userId = req.body.user_id;
  const password = req.body.password;

  // Look for a matching user_id + password pair
  const result = await pool.query(
    'SELECT * FROM users WHERE user_id = $1 AND password = $2',
    [userId, password]
  );

  if (result.rows.length === 0) {
    // No match. ask them to try again
    res.render('signin', { error: 'Incorrect user ID or password. Please try again.' });
    return;
  }

  // Remember the signed-in user for the rest of the session
  req.session.user = result.rows[0];
  res.redirect('/');
});

// 10) Sign out
app.post('/signout', function (req, res) {
  // Clear the session and send user home
  req.session.destroy(function () {
    res.redirect('/');
  });
});

// ---------- Start Server ----------

// Start listening for requests on chosen port.
app.listen(PORT, function () {
  console.log('Blog app running at http://localhost:' + PORT);
});