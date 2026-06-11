-- 1. Crear la base de datos (Si no existe)
CREATE DATABASE OutSilverDB;
GO

-- 2. Usar la base de datos recién creada
USE OutSilverDB;
GO

-- 3. Crear la tabla de Usuarios
CREATE TABLE Usuarios (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Correo NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FechaRegistro DATETIME DEFAULT GETDATE()
);
GO

-- 4. Comprobar que la tabla se creó (debe salir vacía)
SELECT * FROM Usuarios;
GO
