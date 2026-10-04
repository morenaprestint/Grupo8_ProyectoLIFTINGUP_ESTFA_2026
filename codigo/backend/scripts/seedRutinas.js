const db = require('../config/db');

async function seedData() {
    try {
        console.log('Verificando ejercicios en base de datos...');

        const ejerciciosSeed = [
            // Piernas (de las capturas de pantalla)
            { nombre: 'Prensa 45°', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/prensa.gif' },
            { nombre: 'Sillón de cuádriceps', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/sillon.gif' },
            { nombre: 'Hack squat', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/hack.gif' },
            { nombre: 'Sentadillas búlgaras', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/bulgaras.gif' },
            { nombre: 'Abducción con polea', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/abduccion.gif' },
            { nombre: 'Sentadilla clásica', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/sentadilla.gif' },
            { nombre: 'Peso muerto a una pierna', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/pesomuerto.gif' },
            { nombre: 'Puente a una pierna', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/puente.gif' },
            { nombre: 'Estocadas', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/estocadas.gif' },
            { nombre: 'Peso muerto rumano', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/rumano.gif' },
            { nombre: 'Good morning', grupo_muscular: 'Piernas', gif: 'https://www.thingys.com.ar/gymapps/tutorial/goodmorning.gif' },

            // Espalda y Hombros
            { nombre: 'Dominadas', grupo_muscular: 'Espalda', gif: 'https://www.thingys.com.ar/gymapps/tutorial/dominadas.gif' },
            { nombre: 'Remo con barra', grupo_muscular: 'Espalda', gif: 'https://www.thingys.com.ar/gymapps/tutorial/remobarra.gif' },
            { nombre: 'Jalón al pecho', grupo_muscular: 'Espalda', gif: 'https://www.thingys.com.ar/gymapps/tutorial/jalonpecho.gif' },
            { nombre: 'Press militar', grupo_muscular: 'Hombros', gif: 'https://www.thingys.com.ar/gymapps/tutorial/pressmilitar.gif' },
            { nombre: 'Elevaciones laterales', grupo_muscular: 'Hombros', gif: 'https://www.thingys.com.ar/gymapps/tutorial/elevaciones.gif' }
        ];

        for (const ej of ejerciciosSeed) {
            const [existente] = await db.query('SELECT id_ejercicio FROM ejercicios WHERE LOWER(nombre) = LOWER(?)', [ej.nombre]);
            if (existente.length === 0) {
                await db.query(
                    'INSERT INTO ejercicios (nombre, grupo_muscular, gif) VALUES (?, ?, ?)',
                    [ej.nombre, ej.grupo_muscular, ej.gif]
                );
                console.log(`Ejercicio insertado: ${ej.nombre}`);
            }
        }

        // Crear Rutinas Predefinidas si no existen
        const [rutinasExistentes] = await db.query('SELECT id_rutina, nombre FROM rutinas WHERE id_usuario IS NULL');
        const nombresExistentes = rutinasExistentes.map(r => r.nombre.toLowerCase());

        // 1. PIERNAS 1
        if (!nombresExistentes.includes('piernas 1')) {
            const [res] = await db.query(
                'INSERT INTO rutinas (nombre, descripcion, id_usuario, es_favorita, dia_asignado) VALUES (?, ?, NULL, 0, ?)',
                ['PIERNAS 1', 'Enfoque en fuerza e hipertrofia de cuádriceps y glúteos.', 'Lunes']
            );
            const idRutina = res.insertId;
            const [ejs] = await db.query(
                'SELECT id_ejercicio FROM ejercicios WHERE nombre IN (?, ?, ?, ?)',
                ['Prensa 45°', 'Sillón de cuádriceps', 'Hack squat', 'Sentadillas búlgaras']
            );
            for (const e of ejs) {
                await db.query(
                    'INSERT INTO rutina_ejercicio (id_rutina, id_ejercicio, series, repeticiones, peso) VALUES (?, ?, 4, 12, 0)',
                    [idRutina, e.id_ejercicio]
                );
            }
            console.log('Rutina predefinida creada: PIERNAS 1');
        }

        // 2. PIERNAS 2
        if (!nombresExistentes.includes('piernas 2')) {
            const [res] = await db.query(
                'INSERT INTO rutinas (nombre, descripcion, id_usuario, es_favorita, dia_asignado) VALUES (?, ?, NULL, 0, ?)',
                ['PIERNAS 2', 'Enfoque en femoral, glúteo y estabilidad unilateral.', 'Jueves']
            );
            const idRutina = res.insertId;
            const [ejs] = await db.query(
                'SELECT id_ejercicio FROM ejercicios WHERE nombre IN (?, ?, ?)',
                ['Abducción con polea', 'Sentadilla clásica', 'Peso muerto a una pierna']
            );
            for (const e of ejs) {
                await db.query(
                    'INSERT INTO rutina_ejercicio (id_rutina, id_ejercicio, series, repeticiones, peso) VALUES (?, ?, 4, 10, 0)',
                    [idRutina, e.id_ejercicio]
                );
            }
            console.log('Rutina predefinida creada: PIERNAS 2');
        }

        // 3. ESPALDA Y HOMBROS
        if (!nombresExistentes.includes('espalda y hombros')) {
            const [res] = await db.query(
                'INSERT INTO rutinas (nombre, descripcion, id_usuario, es_favorita, dia_asignado) VALUES (?, ?, NULL, 0, ?)',
                ['ESPALDA Y HOMBROS', 'Tracción vertical, horizontal y deltoides.', 'Martes']
            );
            const idRutina = res.insertId;
            const [ejs] = await db.query(
                'SELECT id_ejercicio FROM ejercicios WHERE nombre IN (?, ?, ?, ?)',
                ['Dominadas', 'Remo con barra', 'Press militar', 'Elevaciones laterales']
            );
            for (const e of ejs) {
                await db.query(
                    'INSERT INTO rutina_ejercicio (id_rutina, id_ejercicio, series, repeticiones, peso) VALUES (?, ?, 4, 12, 0)',
                    [idRutina, e.id_ejercicio]
                );
            }
            console.log('Rutina predefinida creada: ESPALDA Y HOMBROS');
        }

        console.log('Seeding completado exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error durante el seed:', err);
        process.exit(1);
    }
}

seedData();
