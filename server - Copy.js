const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 5000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(bodyParser.json());

// Create a connection to the MySQL database
const db = mysql.createConnection({
  host: 'localhost',
  port: 3307, // Adjust the port if needed
  user: 'root',
  password: '',  // Add your MySQL password here
  database: 'waselni'
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

// API endpoint to handle registration
app.post('/api/register', async (req, res) => {
  const {
    firstname,
    lastname,
    age,
    gender,
    phonenumber,
    email,
    password,
    country
  } = req.body;

  if (!firstname || !lastname || !age || !gender || !phonenumber || !email || !password || !country) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (firstname, lastname, age, gender, phonenumber, email, password, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [firstname, lastname, age, gender, phonenumber, email, hashedPassword, country],
      (err, results) => {
        if (err) {
          console.error('Error inserting user:', err);
          return res.status(500).json({ message: 'Failed to register user' });
        }
        console.log('User registered successfully:', results.insertId);
        res.status(200).json({ message: 'User registered successfully', userId: results.insertId });
      }
    );
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ message: 'Failed to register user due to server error' });
  }
});

// API endpoint to handle login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Simple validation
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Check if the user exists (username can be either email or phone)
  const query = 'SELECT * FROM users WHERE email = ? OR phonenumber = ?';
  db.query(query, [username, username], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ message: 'An error occurred during login' });
    }

    // If user does not exist
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    // Compare password with the hashed password
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Successful login
      res.status(200).json({ message: 'Login successful', userId: user.id });
    } catch (error) {
      console.error('Error comparing passwords:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
