const { Client } = require('pg');

const client = new Client({
    host: 'tfg-postgres-db.cetergow0efk.us-east-1.rds.amazonaws.com',
    user: 'postgres',
    password: 'Marcos2020',
    database: 'postgres',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

async function main() {
    try {
        await client.connect();
        console.log('Connectado a PostgreSQL');

        // Cambiar la fecha de las rutas del usuario id:11 a "hoy" (5 de Marzo 2026) en UTC
        const updateQuery = `
      UPDATE ruta 
      SET fecha = '2026-03-05 12:00:00'::timestamp 
      WHERE conductorid IN (11, 2, 13);
    `;
        const res = await client.query(updateQuery);
        console.log(`Se actualizaron ${res.rowCount} rutas a la fecha de hoy.`);

    } catch (err) {
        console.error('Error al actualizar BD:', err);
    } finally {
        await client.end();
    }
}

main();
