const http = require('http');

const data = JSON.stringify({ codigoQr: 'QR-DELICIAS-003' }); // Probaremos con un QR real
const options = {
    hostname: 'localhost',
    port: 5079,
    path: '/api/Entregas/16/validar-qr', // ID 16 corresponde a QR-DELICIAS-003
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, res => {
    console.log(`Status Code de la API: ${res.statusCode}`);
    let body = '';
    res.on('data', chunk => {
        body += chunk;
    });
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ ¡Todo funciona correctamente! La API devolvió:');
            console.log(body);
        } else if (res.statusCode === 404) {
            console.error('❌ ERROR 404: El backend sigue sin encontrar la ruta. ¿Reiniciaste el proyecto .NET C#?');
        } else {
            console.log(`⚠️ Respuesta inesperada: ${body}`);
        }
    });
});

req.on('error', error => {
    console.error(`❌ Error de conexión: NO se pudo contactar con el backend en el puerto 5079. ¿Está encendido? (${error.message})`);
});

req.write(data);
req.end();
