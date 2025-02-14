const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const port = 24853;
const cors = require('cors');
const mysql = require('mysql2')
const dotenv = require('dotenv')

// Used
app.use(express.json());
app.use(cors())
dotenv.config()
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY
const authenticateToken = require('./authMiddleware');


const connection = mysql.createPool({
  host: 'mysql-36a84918-zaidscestudent-9fd6.c.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS_hlOEVAO5xe0J75jZTOb',
  database: 'testing',
  port: 24853,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


app.post('/add', function (req, res) {
  const { title, price, description, image } = req.body

  try {
    let sql = `INSERT INTO testing.products (title, price, description, image) VALUES (?,?,?,?)`;
    connection.query(sql, [title, price, description, image], (err) => {
      if (err) {
        return res.status(400).json({ mesage: "User already exists or an error occurred", error: err.message })
      }
      res.status(201).json({ message: "Successfully Product added" })
    })
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: err.message })
  }

})

app.delete('/delete/:id', function (req, res) {
  const { id } = req.params;

  const sql = `DELETE FROM testing.products WHERE id = ?`;
  console.log(sql);


  connection.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to delete product", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  });
});

app.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { title, price, description } = req.body;

  const sql = `UPDATE testing.products SET title = ?, price = ?, description = ? WHERE id = ?`;

  connection.query(sql, [title, price, description, id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to update product', error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully' });
  });
});

app.get('/search/:id', function (req, res) {
  const { id } = req.params;

  const sql = `SELECT * FROM products WHERE id = ?`;

  connection.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch product", error: err.message });
    }

    if (result.length > 0) {
      return res.status(200).json(result[0]); // Return the first result (single product)
    } else {
      return res.status(404).json({ message: "Product not found" });
    }
  });
});

app.get('/products', function (req, res) {
  const sql = `SELECT * FROM products`;

  connection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch products", error: err.message });
    }

    if (results.length > 0) {
      return res.status(200).json(results); // Return all products
    } else {
      return res.status(404).json({ message: "No products found" });
    }
  });
});

app.get('/', (req, res) => {
  res.send('This is Admin Pannel')
})

// Admin Ends Here 

//  Protected Routes Start From Here

// Register Route
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sqlquery = 'INSERT INTO testing.users (name,email,password) VALUES (?, ?,?)';
    connection.query(sqlquery, [name, email, hashedPassword], (err) => {
      if (err) {
        return res.status(400).json({ message: 'User already exists or an error occurred', error: err.message });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  connection.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error', error: err.message });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);  // Corrected here
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { userId: user.id, name: user.name, email: user.email };  // Corrected here
    const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
  });
});


// Protected Route
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You have accessed protected data!', user: req.user });
});

// Another Example of a Protected Route
app.get('/profile', authenticateToken, (req, res) => {
  const sql = 'SELECT id, name FROM users WHERE id = ?';
  connection.query(sql, [req.user.userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error', error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ profile: results[0] });
  });
});

//  Protected Routes End Here

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
