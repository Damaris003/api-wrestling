const express = require('express');
const router = express.Router();
const db = require('./db');

// ==========================================
// MIDDLEWARE DE AUTORIZACIÓN
// ==========================================
const verificarAdmin = (req, res, next) => {
    const rolUsuario = req.headers['rol']; 
    if (rolUsuario === 'Head Coach') {
        next(); 
    } else {
        res.status(403).json({ 
            status: "error", 
            message: 'Acceso denegado. Solo el Head Coach tiene permiso.' 
        });
    }
};

// ==========================================
// 1. OBTENER LA LISTA COMPLETA (GET) - Código 200
// ==========================================
router.get('/atletas', (req, res) => {
    db.query('SELECT * FROM atletas', (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(200).json(results);
    });
});

// ==========================================
// 2. OBTENER UN ÚNICO REGISTRO POR ID (GET) - Código 200 o 404
// ==========================================
router.get('/atletas/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM atletas WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ status: "error", message: "Atleta no encontrado" });
        }
        res.status(200).json(results[0]);
    });
});

// ==========================================
// 3. CREAR UN NUEVO REGISTRO (POST) - Código 201
// ==========================================
router.post('/atletas', (req, res) => {
    const { nombre, peso_kg, telefono } = req.body;
    db.query('INSERT INTO atletas (nombre, peso_kg, telefono) VALUES (?, ?, ?)', [nombre, peso_kg, telefono], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        
        res.status(201).json({ 
            status: "success", 
            message: "Registro creado exitosamente", 
            id: result.insertId 
        });
    });
});

// ==========================================
// 4. ACTUALIZAR UN REGISTRO EXISTENTE (PUT) - Código 200 o 404
// ==========================================
router.put('/atletas/:id', verificarAdmin, (req, res) => {
    const id = req.params.id;
    const { nombre, peso_kg, telefono } = req.body;
    
    db.query('UPDATE atletas SET nombre = ?, peso_kg = ?, telefono = ? WHERE id = ?', [nombre, peso_kg, telefono, id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Atleta no encontrado para actualizar" });
        }
        
        res.status(200).json({ 
            status: "success", 
            message: "Registro actualizado correctamente" 
        });
    });
});

// ==========================================
// 5. ELIMINAR UN REGISTRO (DELETE) - Código 200 o 404
// ==========================================
router.delete('/atletas/:id', verificarAdmin, (req, res) => {
    const id = req.params.id;
    
    db.query('DELETE FROM atletas WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Atleta no encontrado para eliminar" });
        }
        
        res.status(200).json({ 
            status: "success", 
            message: "Registro eliminado correctamente" 
        });
    });
});

// ==========================================
// AUTENTICACIÓN Y PROGRAMAS
// ==========================================
router.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    db.query('SELECT * FROM usuarios_web WHERE usuario = ? AND password = ?', [usuario, password], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (results.length > 0) res.status(200).json({ success: true, nombre: results[0].usuario, rol: results[0].rol });
        else res.status(401).json({ success: false, message: "No autorizado" });
    });
});

router.post('/registro', (req, res) => {
    const { usuario, password } = req.body;
    db.query('INSERT INTO usuarios_web (usuario, password, rol) VALUES (?, ?, "Normal")', [usuario, password], (err) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(201).json({ status: "success", message: 'Usuario registrado.' });
    });
});

router.post('/programas', (req, res) => {
    const { nombre, nivel } = req.body;
    db.query('INSERT INTO programas (nombre, nivel) VALUES (?, ?)', [nombre, nivel], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(201).json({ status: "success", message: 'Programa creado.', id: result.insertId });
    });
});

router.get('/programas', (req, res) => {
    db.query('SELECT id, nombre, nivel FROM programas', (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(200).json(results);
    });
});

router.get('/inscripciones', (req, res) => {
    const sql = `
        SELECT inscripciones.id, atletas.nombre, atletas.peso_kg, programas.nombre AS programa, programas.nivel, inscripciones.fecha_ingreso 
        FROM inscripciones 
        JOIN atletas ON inscripciones.atleta_id = atletas.id 
        JOIN programas ON inscripciones.programa_id = programas.id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(200).json(results);
    });
});

router.get('/inscripciones/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
        SELECT inscripciones.id, atletas.nombre, atletas.peso_kg, programas.nombre AS programa, programas.nivel, inscripciones.fecha_ingreso 
        FROM inscripciones 
        JOIN atletas ON inscripciones.atleta_id = atletas.id 
        JOIN programas ON inscripciones.programa_id = programas.id
        WHERE inscripciones.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });

        if (results.length === 0) {
            return res.status(404).json({ status: "error", message: "Inscripción no encontrada" });
        }

        res.status(200).json(results[0]);
    });
});

// ==========================================
// CREAR INSCRIPCIÓN Y ATLETA (POST)
// ==========================================
router.post('/inscripciones', (req, res) => {
    const { nombre, peso_kg, telefono, programa_id, fecha_ingreso } = req.body;

    // 0. VALIDACIÓN: Asegurar que los datos obligatorios existan
    if (!nombre || !peso_kg || !telefono || !programa_id) {
        return res.status(400).json({ 
            status: "error", 
            message: "Faltan datos obligatorios (nombre, peso_kg, telefono, programa_id)" 
        });
    }

    // 1. Crear primero el atleta
    db.query('INSERT INTO atletas (nombre, peso_kg, telefono) VALUES (?, ?, ?)', 
    [nombre, peso_kg, telefono], (err, resultAtleta) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });

        const atleta_id = resultAtleta.insertId;
        const fecha = fecha_ingreso || new Date().toISOString().slice(0, 10);

        // 2. Crear la inscripción vinculando el atleta y el programa
        db.query('INSERT INTO inscripciones (atleta_id, programa_id, fecha_ingreso) VALUES (?, ?, ?)',
        [atleta_id, programa_id, fecha], (errInsc) => {
            if (errInsc) return res.status(500).json({ status: "error", message: errInsc.message });

            res.status(201).json({ 
                status: "success", 
                message: 'Inscripción creada con éxito.' 
            });
        });
    });
});

// ==========================================
// ACTUALIZAR INSCRIPCIÓN (PUT) - Código 200 o 404
// ==========================================
router.put('/inscripciones/:id', verificarAdmin, (req, res) => {
    const id = req.params.id;
    
    // 1. Extraer variables asignando null por defecto si vienen undefined
    const { programa_id, atleta_id = null, fecha_ingreso = null } = req.body;

    // 2. Validar únicamente el campo obligatorio
    if (!programa_id) {
        return res.status(400).json({ 
            status: "error", 
            message: "El campo programa_id es obligatorio" 
        });
    }

    // 3. Consulta SQL usando COALESCE
    const sql = `
        UPDATE inscripciones 
        SET programa_id = ?, 
            atleta_id = COALESCE(?, atleta_id),
            fecha_ingreso = COALESCE(?, fecha_ingreso)
        WHERE id = ?
    `;

    db.query(sql, [programa_id, atleta_id, fecha_ingreso, id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Inscripción no encontrada para actualizar" });
        }

        res.status(200).json({ 
            status: "success", 
            message: "Inscripción actualizada correctamente" 
        });
    });
});

// ==========================================
// ELIMINAR INSCRIPCIÓN (DELETE)
// ==========================================
router.delete('/inscripciones/:id', verificarAdmin, (req, res) => {
    const id = req.params.id;

    db.query('DELETE FROM inscripciones WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Inscripción no encontrada" });
        }

        res.status(200).json({ 
            success: true, 
            status: "success", 
            message: "Registro eliminado correctamente" 
        });
    });
});
// ==========================================
// PROGRAMAS (GET por ID, PUT, DELETE)
// ==========================================

// Obtener un programa por ID
router.get('/programas/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM programas WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (results.length === 0) {
            return res.status(404).json({ status: "error", message: "Programa no encontrado" });
        }
        res.status(200).json(results[0]);
    });
});

// Actualizar un programa
router.put('/programas/:id', verificarAdmin, (req, res) => {
    const id = req.params.id;
    const { nombre, nivel } = req.body;

    if (!nombre || !nivel) {
        return res.status(400).json({ 
            status: "error", 
            message: "Los campos nombre y nivel son obligatorios" 
        });
    }

    db.query('UPDATE programas SET nombre = ?, nivel = ? WHERE id = ?', [nombre, nivel, id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Programa no encontrado para actualizar" });
        }

        res.status(200).json({ 
            status: "success", 
            message: "Programa actualizado correctamente" 
        });
    });
});
// ==========================================
// CREAR UN NUEVO PROGRAMA (POST) - Código 201
// ==========================================
router.post('/programas', verificarAdmin, (req, res) => {
    const { nombre, nivel } = req.body;

    // Validación de campos obligatorios
    if (!nombre || !nivel) {
        return res.status(400).json({ 
            status: "error", 
            message: "Los campos nombre y nivel son obligatorios" 
        });
    }

    db.query('INSERT INTO programas (nombre, nivel) VALUES (?, ?)', [nombre, nivel], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        
        res.status(201).json({ 
            status: "success", 
            message: "Programa creado exitosamente", 
            id: result.insertId 
        });
    });
});
// Eliminar un programa
router.delete('/programas/:id', verificarAdmin, (req, res) => {
    const id = req.params.id;

    db.query('DELETE FROM programas WHERE id = ?', [id], (err, result) => {
        if (err) {
            // Error de restricción de clave foránea en MySQL
            if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
                return res.status(400).json({
                    status: "error",
                    message: "No se puede eliminar el programa porque existen atletas inscritos en él. Elimina primero sus inscripciones."
                });
            }
            return res.status(500).json({ status: "error", message: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Programa no encontrado para eliminar" });
        }

        res.status(200).json({ 
            status: "success", 
            message: "Programa eliminado correctamente" 
        });
    });
});
// ==========================================
// USUARIOS WEB (GET, GET por ID, PUT, DELETE)
// ==========================================

// Obtener la lista de usuarios (sin expender contraseñas por seguridad)
router.get('/usuarios', verificarAdmin, (req, res) => {
    db.query('SELECT id, usuario, rol FROM usuarios_web', (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(200).json(results);
    });
});

// Obtener un único usuario por ID
router.get('/usuarios/:id', verificarAdmin, (req, res) => {
    const id = req.params.id;
    db.query('SELECT id, usuario, rol FROM usuarios_web WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (results.length === 0) {
            return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
        }
        res.status(200).json(results[0]);
    });
});

// ==========================================
// CREAR UN NUEVO USUARIO (POST) - Código 201
// ==========================================
router.post('/usuarios', verificarAdmin, (req, res) => {
    const { usuario, password, rol } = req.body;

    // Validación de campos obligatorios
    if (!usuario || !password || !rol) {
        return res.status(400).json({ 
            status: "error", 
            message: "Los campos usuario, password y rol son obligatorios" 
        });
    }

    db.query('INSERT INTO usuarios_web (usuario, password, rol) VALUES (?, ?, ?)', 
    [usuario, password, rol], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        
        res.status(201).json({ 
            status: "success", 
            message: "Usuario creado exitosamente", 
            id: result.insertId 
        });
    });
});
// Actualizar usuario o rol (y contraseña de forma opcional)
router.put('/usuarios/:id', verificarAdmin, (req, res) => {
    const id = req.params.id;
    const { usuario, password, rol } = req.body;

    if (!usuario || !rol) {
        return res.status(400).json({ 
            status: "error", 
            message: "Los campos usuario y rol son obligatorios" 
        });
    }

    const sql = password 
        ? 'UPDATE usuarios_web SET usuario = ?, password = ?, rol = ? WHERE id = ?' 
        : 'UPDATE usuarios_web SET usuario = ?, rol = ? WHERE id = ?';
    
    const params = password ? [usuario, password, rol, id] : [usuario, rol, id];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Usuario no encontrado para actualizar" });
        }

        res.status(200).json({ 
            status: "success", 
            message: "Usuario actualizado correctamente" 
        });
    });
});

// Eliminar un usuario
router.delete('/usuarios/:id', verificarAdmin, (req, res) => {
    const id = req.params.id;

    db.query('DELETE FROM usuarios_web WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: "Usuario no encontrado para eliminar" });
        }

        res.status(200).json({ 
            status: "success", 
            message: "Usuario eliminado correctamente" 
        });
    });
});

module.exports = router;