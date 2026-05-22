const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a PostgreSQL establecida');

    app.listen(env.port, () => {
      console.log(`Territorio App API corriendo en http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
