DROP TABLE IF EXISTS Usuarios;
DROP TABLE IF EXISTS Admins;
DROP TABLE IF EXISTS Roles;
DROP TABLE IF EXISTS Rutinas;
DROP TABLE IF EXISTS Ejercicios;
DROP TABLE IF EXISTS Rutina_Ejercicio;
DROP TABLE IF EXISTS Asistencias;
DROP TABLE IF EXISTS Progreso_Fisico;
DROP TABLE IF EXISTS Maquinas;

CREATE TABLE Roles (
    id_rol INTEGER PRIMARY KEY,
    nombre_rol VARCHAR(30) NOT NULL
);

CREATE TABLE Admins (
    id_admin INTEGER PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE Usuarios (
    id_usuario INTEGER PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    edad INTEGER,
    peso REAL,
    altura REAL,
    objetivo VARCHAR(100),
    nivel_entrenamiento VARCHAR(20),
    fecha_registro DATE,
    activo INTEGER,
    id_admin INTEGER,

    FOREIGN KEY (id_admin)
    REFERENCES Admins(id_admin)
);

CREATE TABLE Rutinas (
    id_rutina INTEGER PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    id_usuario INTEGER,

    FOREIGN KEY (id_usuario)
    REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Ejercicios (
    id_ejercicio INTEGER PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    grupo_muscular VARCHAR(50),
    descripcion VARCHAR(255),
    gif VARCHAR(255)
);

CREATE TABLE Rutina_Ejercicio (
    id_rutina INTEGER,
    id_ejercicio INTEGER,

    series INTEGER,
    repeticiones INTEGER,

    PRIMARY KEY(id_rutina,id_ejercicio),

    FOREIGN KEY(id_rutina)
    REFERENCES Rutinas(id_rutina),

    FOREIGN KEY(id_ejercicio)
    REFERENCES Ejercicios(id_ejercicio)
);

CREATE TABLE Asistencias (
    id_asistencia INTEGER PRIMARY KEY,
    id_usuario INTEGER,
    fecha DATE,

    FOREIGN KEY(id_usuario)
    REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Progreso_Fisico (
    id_progreso INTEGER PRIMARY KEY,

    id_usuario INTEGER,

    fecha DATE,

    peso REAL,
    grasa_corporal REAL,
    masa_muscular REAL,

    observaciones VARCHAR(255),

    FOREIGN KEY(id_usuario)
    REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Maquinas (
    id_maquina INTEGER PRIMARY KEY,
    nombre VARCHAR(100),
    estado VARCHAR(20)
);