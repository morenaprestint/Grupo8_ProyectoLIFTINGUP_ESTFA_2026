CREATE DATABASE IF NOT EXISTS lifting_up;
USE lifting_up;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Rutina_Ejercicio;
DROP TABLE IF EXISTS Asistencias;
DROP TABLE IF EXISTS Progreso_Fisico;
DROP TABLE IF EXISTS Rutinas;
DROP TABLE IF EXISTS Ejercicios;
DROP TABLE IF EXISTS Usuarios;
DROP TABLE IF EXISTS Admins;
DROP TABLE IF EXISTS Roles;
DROP TABLE IF EXISTS Maquinas;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(30) NOT NULL
);

CREATE TABLE Admins (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    edad INT,
    peso DECIMAL(5,2),
    altura DECIMAL(4,2),
    objetivo VARCHAR(100),
    nivel_entrenamiento ENUM('Principiante','Intermedio','Avanzado'),
    fecha_registro DATE,
    activo BOOLEAN DEFAULT TRUE,
    id_admin INT,

    CONSTRAINT fk_usuario_admin
        FOREIGN KEY (id_admin)
        REFERENCES Admins(id_admin)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE Rutinas (
    id_rutina INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_usuario INT,

    CONSTRAINT fk_rutina_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES Usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Ejercicios (
    id_ejercicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    grupo_muscular VARCHAR(50),
    descripcion TEXT,
    gif VARCHAR(255)
);

CREATE TABLE Rutina_Ejercicio (
    id_rutina INT,
    id_ejercicio INT,
    series INT NOT NULL,
    repeticiones INT NOT NULL,

    PRIMARY KEY (id_rutina, id_ejercicio),

    CONSTRAINT fk_re_rutina
        FOREIGN KEY (id_rutina)
        REFERENCES Rutinas(id_rutina)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_re_ejercicio
        FOREIGN KEY (id_ejercicio)
        REFERENCES Ejercicios(id_ejercicio)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Asistencias (
    id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha DATE NOT NULL,

    CONSTRAINT fk_asistencia_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES Usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Progreso_Fisico (
    id_progreso INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha DATE NOT NULL,
    peso DECIMAL(5,2),
    grasa_corporal DECIMAL(5,2),
    masa_muscular DECIMAL(5,2),
    observaciones TEXT,

    CONSTRAINT fk_progreso_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES Usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Maquinas (
    id_maquina INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado ENUM('Disponible','En mantenimiento','Fuera de servicio') DEFAULT 'Disponible'
);