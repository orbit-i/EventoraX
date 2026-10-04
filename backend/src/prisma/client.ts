import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  // Needed for MySQL 8+ "strong password" auth on a local non-SSL connection.
  // On a hosted database with SSL, this can be removed.
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

export default prisma;