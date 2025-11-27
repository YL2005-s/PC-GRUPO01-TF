import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';

export const register = async (req, res) => {
    const { nombre, correo, contrasena } = req.body;

    try {
        // Validar datos
        if (!nombre || !correo || !contrasena) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const [existingUser] = await db.query(
            'SELECT * FROM Usuario WHERE correo = ?',
            [correo]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // Insertar usuario
        const [result] = await db.query(
            'INSERT INTO Usuario (nombre, correo, contrasena) VALUES (?, ?, ?)',
            [nombre, correo, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario'
        });
    }
};

export const login = async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        // Validar datos
        if (!correo || !contrasena) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const [users] = await db.query(
            'SELECT * FROM Usuario WHERE correo = ?',
            [correo]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = users[0];

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id_usuario, email: user.correo, nombre: user.nombre },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                correo: user.correo
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id_usuario, nombre, correo, fecha_registro FROM Usuario WHERE id_usuario = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil'
        });
    }
};
