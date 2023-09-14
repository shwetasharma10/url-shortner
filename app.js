const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const ShortUniqueId = require("short-unique-id");
const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: "sql12.freemysqlhosting.net",
  user: "sql12646449",
  password: "95YJ5RkyU4",
  database: "sql12646449",
  port: 3306,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "public/index.html");
});

app.post("/shorten", (req, res) => {
  const longUrl = req.body.longUrl;

  // Check if the long URL already exists in the database
  const checkSql = "SELECT short_code FROM url_mappings WHERE long_url = ?";
  db.query(checkSql, [longUrl], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }

    if (result.length > 0) {
      // If the long URL already exists, return the existing short URL
      const shortCode = result[0].short_code;
      const shortUrl = `http://localhost:3000/${shortCode}`;

      // Send the shortened URL as JSON response
      res.json({ shortUrl });
    } else {
      // If the long URL doesn't exist, generate a new short code
      const uid = new ShortUniqueId({ length: 10 });
      const shortCode = uid.rnd();

      const shortUrl = `http://localhost:3000/${shortCode}`;

      // Store the mapping in the database
      const insertSql =
        "INSERT INTO url_mappings (long_url, short_code) VALUES (?, ?)";
      db.query(insertSql, [longUrl, shortCode], (err, result) => {
        if (err) throw err;
        console.log("URL mapping saved to the database");

        // Send the shortened URL as JSON response
        res.json({ shortUrl });
      });
    }
  });
});

app.get("/:shortCode", (req, res) => {
  const shortCode = req.params.shortCode;

  // Retrieve the long URL from the database based on the short code
  const sql = "SELECT long_url FROM url_mappings WHERE short_code = ?";
  db.query(sql, [shortCode], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }

    if (result.length === 0) {
      // Short code not found in the database
      return res.status(404).send("Short URL not found");
    }

    const longUrl = result[0].long_url;
    res.redirect(longUrl); // Redirect the user to the long URL
  });
});

const createTableSQL = `
  CREATE TABLE IF NOT EXISTS url_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    long_url TEXT NOT NULL,
    short_code VARCHAR(10) NOT NULL
  )
`;

db.query(createTableSQL, (err, result) => {
  if (err) throw err;
  console.log("url_mappings table created");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
