const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // To handle Cross-Origin Resource Sharing

const app = express();
const port = 5000; // Port for the backend server

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '', // Set your database password here
  database: 'waselni'
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database.');
});

// Middleware
app.use(cors());
app.use(express.json());

// Sample endpoint
app.get('/api/data', (req, res) => {
  db.query('SELECT * FROM your_table_name', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
