const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'maxi2008'
});

connection.query('SHOW DATABASES', (err, results) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('Successfully connected to MySQL.');
  console.log('Databases:', results.map(row => row.Database));
  process.exit(0);
});
