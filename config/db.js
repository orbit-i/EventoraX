import 'dotenv/config';
import mysql from 'mysql2';

const db = mysql.createConnection({
    host     : process.env.DB_HOST     || 'localhost',
    port     : process.env.DB_PORT     ? Number(process.env.DB_PORT) : 3306,
    user     : process.env.DB_USER     || 'eventoraX_user',
    password : process.env.DB_PASSWORD || '',
    database : process.env.DB_NAME     || 'eventoraX'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('Connected to MySQL database: eventoraX');
});

export default db;
