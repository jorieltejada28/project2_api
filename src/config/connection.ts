import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

try {
    await connection.getConnection();
    console.log('Successfully connected to the MySQL database.');
} catch (error) {
    console.error('Database connection failed:', error);
}

export default connection;