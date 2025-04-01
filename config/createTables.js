const db = require('./dbConfig');

const createTables = () => {
  const queries = `
    DROP TABLE IF EXISTS gastos;
    DROP TABLE IF EXISTS presupuestos;
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE presupuestos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      nombre VARCHAR(255) NOT NULL,
      monto DECIMAL(10, 2) NOT NULL,
      restante DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE gastos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      presupuesto_id INT NOT NULL,
      descripcion VARCHAR(255) NOT NULL,
      monto DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE
    );
  `;
  db.query(queries, (err) => {
    if (err) {
      console.error('Error al crear las tablas:', err.message);
      throw err;
    }
    console.log('Tablas creadas correctamente');
  });
};

module.exports = createTables;
