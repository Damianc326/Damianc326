const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json()); // Permite recibir datos en formato JSON

// Configuración de la base de datos para Azure SQL
const dbConfig = {
    server: 'outsilver-dani-server.database.windows.net', // Servidor de Azure
    database: 'OutSilverDB',
    user: 'CloudSA56309514@outsilver-dani-server', // Formato especial para Azure
    password: 'Daniel.c.h123/', // <-- BORRA ESTO Y ESCRIBE TU CONTRASEÑA REAL ENTRE LAS COMILLAS
    options: {
        encrypt: true, // Requerido para Azure
        trustServerCertificate: false
    }
};

// Conectar a la base de datos PRIMERO, luego arrancar el servidor web
sql.connect(dbConfig)
    .then(() => {
        console.log('✅ Conectado a SQL Server exitosamente.');
        const PORT = 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Servidor puente corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Error FATAL conectando a SQL Server:', err);
        console.log('Por favor verifica que SQL Server esté encendido y el nombre sea correcto.');
    });

// Ruta para el Registro de Usuarios
app.post('/api/register', async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const request = new sql.Request();
        request.input('Nombre', sql.NVarChar(100), nombre);
        request.input('Correo', sql.NVarChar(150), correo);
        request.input('PasswordHash', sql.NVarChar(255), passwordHash);

        await request.query(`
            INSERT INTO Usuarios (Nombre, Correo, PasswordHash)
            VALUES (@Nombre, @Correo, @PasswordHash)
        `);

        res.status(201).json({ success: true, message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('Error en registro:', error);
        if (error.message && error.message.includes('Violation of UNIQUE KEY constraint')) {
            return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// Ruta para el Inicio de Sesión (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { correo, password } = req.body;

        const request = new sql.Request();
        request.input('Correo', sql.NVarChar(150), correo);
        const result = await request.query('SELECT * FROM Usuarios WHERE Correo = @Correo');

        if (result.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'Correo o contraseña incorrectos.' });
        }

        const usuario = result.recordset[0];
        const match = await bcrypt.compare(password, usuario.PasswordHash);

        if (!match) {
            return res.status(400).json({ success: false, message: 'Correo o contraseña incorrectos.' });
        }

        res.status(200).json({ success: true, message: 'Inicio de sesión exitoso.', usuarioId: usuario.ID });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});
