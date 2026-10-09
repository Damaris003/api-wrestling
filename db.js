const mysql = require('mysql2');

const db = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'admin.123', 
    database: 'spartan_wrestling_db'
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
    } else {
        console.log('Conectado a MySQL - Spartan Wrestling DB (Pool Activo)');
        connection.release();
    }
});

module.exports = db;