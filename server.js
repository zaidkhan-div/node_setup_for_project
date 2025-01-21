const express = require('express');
const app = express();
const port = 24853;
const cors = require('cors');
const mysql = require('mysql2')
require('dotenv').config();

// Used
app.use(express.json());
app.use(cors())


// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'process.env.mysql',
//   database: 'testing'
// })
// const connection = mysql.createConnection({
// host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: 'testing',
//   port: 24853,
// })

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// connection.connect(function (err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

// connection.connect()


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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})