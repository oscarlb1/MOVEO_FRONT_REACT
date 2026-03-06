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

        const updateQuery = `
      UPDATE entrega 
      SET codigoqr = 'QR-TEST-' || id 
      WHERE codigoqr IS NULL OR codigoqr = '';
    `;
        const res = await client.query(updateQuery);
        console.log(`Se actualizaron ${res.rowCount} entregas con un código QR de prueba (ej. QR-TEST-1).`);

        const selectQuery = `
      SELECT id, estado, codigoqr FROM entrega WHERE estado ILIKE 'pendiente' LIMIT 5;
    `;
        const res2 = await client.query(selectQuery);
        console.log('Muestra de entregas pendientes:', res2.rows);

    } catch (err) {
        console.error('Error al actualizar BD:', err);
    } finally {
        await client.end();
    }
}

main();
