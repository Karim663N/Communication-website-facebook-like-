require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Use mysql2's promise-based API
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const { sendEmail } = require('./services/emailService');
const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set this to true if using HTTPS
    maxAge: 15 * 60 * 1000, // Adjust session expiration time (e.g., 15 minutes)
  }
}));

app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["POST", "GET", "DELETE", "PUT"],
  credentials: true,
}));

app.use(bodyParser.json());

// MySQL connection using promise-based API
const db = mysql.createPool({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '', // Add your MySQL password here
  database: 'waselni',
});

// Route to check session
app.get('/', async (req, res) => {
  if (req.session.user) {
    return res.json({ isAuthenticated: true, user: req.session.user, friends: req.session.friends });
  } else {
    return res.json({ isAuthenticated: false });
  }
});

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.originalUrl === process.env.UPLOAD_PROFILE_PIC_API) {
      // Save profile pictures directly in 'uploads'
      cb(null, 'uploads');
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, 'uploads/photos');
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, 'uploads/videos');
    } else if (file.mimetype.startsWith('audio/')) {
      cb(null, 'uploads/songs');
    } else {
      cb(null, 'uploads'); // Default folder if the file type is not recognized
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append a timestamp to the file name
  }
});

const upload = multer({ storage: storage });

// API endpoint to handle registration
app.post(process.env.REGISTER_API, async (req, res) => {
  const {
    firstname,
    lastname,
    age,
    gender,
    phonenumber,
    email,
    password,
    country,
  } = req.body;

  if (!firstname || !lastname || !age || !gender || !phonenumber || !email || !password || !country) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the email already exists
    const [existingUser] = await db.execute(process.env.SELECT_USER_QUERY, [email]);

    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [results] = await db.execute(process.env.INSERT_USER_QUERY, [
      firstname,
      lastname,
      age,
      gender,
      phonenumber,
      email,
      hashedPassword,
      country,
    ]);

    console.log('User registered successfully:', results.insertId);
    res.status(200).json({ message: 'User registered successfully', userId: results.insertId });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Failed to register user due to server error' });
  }
});

// Route for user login
app.post(process.env.LOGIN_API, async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('request : ', process.env.LOGIN_FETCH_FRIENDS_QUERY);
    // Fetch user by email
    const [results] = await db.execute(process.env.SELECT_USER_BY_EMAIL, [username]);
    if (results.length > 0) {
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        req.session.user = {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          country: user.country,
          photo: user.photo,
          age: user.age,
          gender: user.gender,
          password: user.password,
        };

        // Fetch friends using query from .env
        const [friends] = await db.execute(process.env.LOGIN_FETCH_FRIENDS_QUERY, [req.session.user.id, req.session.user.id]);

        req.session.friends = friends; // Store friends in session
        req.session.save((err) => {    // Ensure session is saved before sending response
          if (err) throw err;

          return res.json({
            message: 'Login successful!',
            user: req.session.user,
            friends: req.session.friends, // Return friends in response
          });
        });
      } else {
        return res.status(401).json({ message: 'Incorrect password.' });
      }
    } else {
      return res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'An error occurred during login.' });
  }
});

// Route to get profile data
app.get('/api/myprofile', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: 'User is not logged in.' });
  }
});

// Route for user logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    return res.status(200).json({ message: 'Logout successful!' });
  });
});

// Route for searching users
app.get(process.env.SEARCH_API, async (req, res) => {
  const searchTerm = req.query.q;
  const userId = req.session.user?.id; // Get the authenticated user's ID from the session

  if (!searchTerm) {
    return res.status(400).json({ message: 'Search term is required.' });
  }

  const likeTerm = `%${searchTerm}%`;

  try {
    // Use query from .env
    const [results] = await db.execute(process.env.SEARCH_QUERY, [userId, likeTerm, likeTerm]);

    return res.json({ results });
  } catch (err) {
    console.error('Error executing search query:', err);
    return res.status(500).json({ message: 'Server error during search.' });
  }
});

// Route for updating profile photo
app.post(process.env.UPLOAD_PROFILE_PIC_API, upload.single('profilePic'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const { id } = req.session.user;

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const photoPath = `/uploads/${req.file.filename}`;

  try {
    // Use query from .env
    const [result] = await db.execute(process.env.UPDATE_PROFILE_PIC_QUERY, [photoPath, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile photo updated successfully', photo: photoPath });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Failed to update profile photo' });
  }
});

app.put(process.env.UPDATE_PROFILE_API, async (req, res) => {
  console.log("id session user in function update profile: ", req.session.user.id);

  const { firstname, lastname, email, country, age, phonenumber, gender, newPassword, oldPassword } = req.body;
  const userId = req.session.user.id;

  try {
    // Fetch user from the database
    const [results] = await db.execute(process.env.FETCH_USER_BY_ID_QUERY, [userId]);

    if (results.length > 0) {
      const user = results[0];
      let updateFields = [];

      // Update password if both old and new passwords are provided
      if (oldPassword && newPassword) {
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Incorrect old password.' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateFields.push(['password', hashedPassword]);
      }

      // Collect other fields to update
      if (firstname) updateFields.push(['firstname', firstname]);
      if (lastname) updateFields.push(['lastname', lastname]);
      if (email) updateFields.push(['email', email]);
      if (country) updateFields.push(['country', country]);
      if (age) updateFields.push(['age', age]);
      if (phonenumber) updateFields.push(['phonenumber', phonenumber]);
      if (gender) updateFields.push(['gender', gender]);

      console.log("Profile update fields:", updateFields);

      // Build the SQL UPDATE query dynamically
      const setQuery = updateFields.map(field => `${field[0]} = ?`).join(', ');
      const values = updateFields.map(field => field[1]);

      if (setQuery) {
        // Use the UPDATE query from .env
        const updateQuery = `${process.env.UPDATE_USER_QUERY} ${setQuery} WHERE id = ?`;
        await db.execute(updateQuery, [...values, userId]);

        res.json({ message: 'Profile updated successfully!' });
      } else {
        res.status(400).json({ error: 'No fields to update.' });
      }
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error during profile update.' });
  }
});

app.post(process.env.ADD_FRIEND_API, async (req, res) => {
  const { id_user, id_friend } = req.body;

  console.log('id user in api addfriend:', id_user);
  console.log('id friend in api addfriend:', id_friend);

  try {
    // Check if the friend request already exists
    const [results] = await db.execute(process.env.CHECK_FRIEND_EXISTS_QUERY, [id_user, id_friend]);
    console.log('checking if request already exists', results);

    if (results.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already exists',
        user_request: results[0].user_request,
      });
    }

    // Insert new friend request into the database
    await db.execute(process.env.ADD_FRIEND_QUERY, [id_user, id_friend]);

    // Check for the reciprocal friend request
    const [reciprocalResults] = await db.execute(process.env.CHECK_RECIPROCAL_REQUEST_QUERY, [id_friend, id_user]);

    if (reciprocalResults.length > 0) {
      // Update the accept column to 1 for both requests
      await db.execute(process.env.UPDATE_FRIEND_ACCEPT_QUERY, [id_user, id_friend, id_friend, id_user]);

      // Fetch updated friends list
      const [friends] = await db.execute(process.env.ADDFRIEND_FETCH_FRIENDS_QUERY, [id_user, id_user]);
      console.log('Added friends successfully:', friends);

      // Update session with new friends list
      req.session.friends = friends; // Store updated friends in session
      req.session.save((err) => {    // Ensure session is saved before sending response
        if (err) throw err;

        return res.json({
          success: true,
          message: 'Friend request sent and accepted!',
          accepted: true,
          user_request: 1,
          user: req.session.user,   // Return user data from session
          friends: req.session.friends, // Return updated friends from session
        });
      });
    } else {
      return res.json({
        success: true,
        message: 'Friend request sent successfully!',
        accepted: false,
        user_request: 1,
      });
    }
  } catch (error) {
    console.error('Error adding friend:', error);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.get(process.env.FRIEND_DETAILS_API, async (req, res) => {
  const friendId = req.params.id;

  try {
    // Use the query from the environment variable
    const [results] = await db.execute(process.env.FETCH_FRIEND_DETAILS_QUERY, [friendId]);

    if (results.length > 0) {
      res.json(results[0]); // Send the first result
    } else {
      res.status(404).json({ error: 'Friend not found' });
    }
  } catch (error) {
    console.error('Error fetching friend data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post(process.env.SEND_MESSAGE_API, async (req, res) => {
  const { message, receiverId } = req.body;

  // Check if the session exists
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const senderId = req.session.user.id;
  const messageDate = new Date(); // Get the current date and time

  try {
    // Use the query from the environment variable
    const [results] = await db.execute(process.env.INSERT_MESSAGE_QUERY, [messageDate, message, senderId, receiverId]);
    res.status(201).json({ message: 'Message sent successfully', id: results.insertId });
  } catch (error) {
    console.error('Error inserting message:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.get(process.env.GET_MESSAGES_API, async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;
  const { friendId } = req.query;

  if (!friendId) {
    return res.status(400).json({ error: 'Friend ID is required.' });
  }

  try {
    // Use the query from the environment variable
    const [results] = await db.execute(process.env.GET_MESSAGES_QUERY, [userId, friendId, friendId, userId]);

    res.json(results); // Send back the messages
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post(process.env.RESET_API, async (req, res) => {
  const { username } = req.body;

  try {
    // Use the query from the environment variable
    const [user] = await db.execute(process.env.RESET_USER_QUERY, [username, username]);

    if (!user || user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user[0].id;
    console.log('userId in api reset:', userId);
    req.session.userId = userId;

    // Save the session data immediately to make sure it's available in the next request
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ message: 'Error saving session' });
      }

      // Once session is saved, proceed to send the email
      const resetLink = `${process.env.RESET_LINK_BASE_URL}?userId=${userId}`;
      sendEmail(user[0].email, 'Password Reset', `Click on this link to reset your password: ${resetLink}`)
        .then(() => {
          res.status(200).json({ message: 'Password reset email sent successfully!' });
        })
        .catch((error) => {
          console.error('Error sending reset email:', error);
          res.status(500).json({ message: 'Error sending password reset email' });
        });
    });
  } catch (error) {
    console.error('Error in reset API:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post(process.env.RESET_PASSWORD_API, async (req, res) => {
  const { password, userId } = req.body; // Get userId from request body
  console.log('userId in api resetpassword:', userId);

  if (!userId) {
    return res.status(400).json({ message: 'Session expired or invalid user ID.' });
  }

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password in the database using the query from the environment variable
    await db.execute(process.env.UPDATE_PASSWORD_QUERY, [hashedPassword, userId]);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete(process.env.DELETE_FRIEND_API, async (req, res) => {
  const { friendId } = req.params;
  const userId = req.session.user.id;

  try {
    // Delete the friend relationship from the database using the query from the environment variable
    await db.execute(process.env.DELETE_FRIEND_QUERY, [userId, friendId, friendId, userId]);

    // Fetch updated friends list after deletion using the query from the environment variable
    const [friends] = await db.execute(process.env.DELETEFRIEND_FETCH_FRIENDS_QUERY, [userId, userId]);

    // Update session with the new friends list
    req.session.friends = friends;
    req.session.save((err) => {
      if (err) throw err;

      // Return response with the updated friends list
      return res.json({
        success: true,
        message: 'Friend deleted successfully',
        friends: req.session.friends,
        redirect: '/' // Optional: for frontend to handle redirection
      });
    });
  } catch (error) {
    console.error('Error deleting friend:', error);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.post('/api/uploadpost', upload.single('file'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const { id: posterId } = req.session.user;
  const { postText } = req.body;

  // Determine file paths based on uploaded file type using environment variables
  let photoPath = null;
  let videoPath = null;
  let songPath = null;

  if (req.file) {
    if (req.file.mimetype.startsWith('image/')) {
      photoPath = `${process.env.UPLOAD_PHOTO_PATH}${req.file.filename}`;
    } else if (req.file.mimetype.startsWith('video/')) {
      videoPath = `${process.env.UPLOAD_VIDEO_PATH}${req.file.filename}`;
    } else if (req.file.mimetype.startsWith('audio/')) {
      songPath = `${process.env.UPLOAD_AUDIO_PATH}${req.file.filename}`;
    }
  }

  try {
    // Load the SQL query from the environment variable
    const query = process.env.QUERY_INSERT_POST;

    const [result] = await db.execute(query, [
      postText,
      photoPath,
      videoPath,
      songPath,
      posterId
    ]);

    res.json({ message: 'Post uploaded successfully', postId: result.insertId });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to upload post' });
  }
});

// Endpoint to fetch posts from friends
app.get('/api/posts', async (req, res) => {
  try {
    const userId = req.session.user?.id; // Assuming the user is logged in and their ID is stored in session
    console.log('id user in session in api post: ', userId);

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Load the SQL query from the environment variable
    const postsQuery = process.env.QUERY_FETCH_POSTS;

    // Pass userId for all placeholders in the query
    const [posts] = await db.execute(postsQuery, [userId, userId, userId]);

    console.log('Selected posts:', posts);
    // Return the posts in the response
    return res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ message: 'An error occurred while fetching posts.' });
  }
});

//media side buttons
app.get('/api/music', async (req, res) => {
  console.log('API Music route hit'); // Debugging: Check if the route is being hit
  try {
    const userId = req.session.user?.id;
    console.log('user id session in api music', userId);

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Load the SQL query from the environment variable
    const musicQuery = process.env.QUERY_FETCH_MUSIC;

    // Execute the query with placeholders replaced by userId
    const [musicPosts] = await db.execute(musicQuery, [userId, userId, userId]);

    req.session.music = musicPosts; // Save to session
    console.log('Media in api music: ', musicPosts);

    res.json(musicPosts);
  } catch (error) {
    console.error('Error fetching music:', error);
    res.status(500).json({ message: 'An error occurred while fetching music.' });
  }
});

app.get('/api/video', async (req, res) => {
  console.log('API Video route hit');
  try {
    const userId = req.session.user?.id;
    console.log('user id session in api video', userId);
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Load the SQL query from the environment variable
    const videoQuery = process.env.QUERY_FETCH_VIDEOS;

    // Execute the query with placeholders replaced by userId
    const [videoPosts] = await db.execute(videoQuery, [userId, userId, userId]);

    req.session.video = videoPosts; // Save to session
    console.log('Media in api video: ', videoPosts);

    res.json(videoPosts);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'An error occurred while fetching videos.' });
  }
});

app.get('/api/photo', async (req, res) => {
  console.log('API Photo route hit');
  try {
    const userId = req.session.user?.id;
    console.log('user id session in api photo', userId);
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Load the SQL query from the environment variable
    const photoQuery = process.env.QUERY_FETCH_PHOTOS;

    // Execute the query with placeholders replaced by userId
    const [photoPosts] = await db.execute(photoQuery, [userId, userId, userId]);

    req.session.photo = photoPosts; // Save to session
    console.log('Media in api photo: ', photoPosts);

    res.json(photoPosts);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ message: 'An error occurred while fetching photos.' });
  }
});


// Serve the uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Server start
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
