import React, { useState, useEffect } from 'react';
import { getUsuarios, createUsuario } from '../services/api';

const TestDB = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Form state
    const [formData, setFormData] = useState({
        id_usuario: '',
        nombre: '',
        apellido: '',
        email: '',
        password: ''
    });

    const fetchUsuarios = async () => {
        try {
            const result = await getUsuarios();
            if (result.success) {
                setUsuarios(result.data);
            }
        } catch (err) {
            setError('Error al conectar con la base de datos (Lectura)');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await createUsuario(formData);
            if (result.success) {
                alert('Usuario insertado correctamente');
                fetchUsuarios(); // Recargar la lista
                setFormData({ id_usuario: '', nombre: '', apellido: '', email: '', password: '' });
            }
        } catch (err) {
            alert('Error al insertar usuario. Asegúrate de que el backend esté corriendo y la DB conectada.');
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Prueba de Integración: React + Express + MySQL</h1>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>1. Prueba de Inserción (Crear Usuario)</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="number" name="id_usuario" placeholder="ID Usuario" value={formData.id_usuario} onChange={handleInputChange} required />
                    <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleInputChange} required />
                    <input type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleInputChange} required />
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                    <input type="password" name="password" placeholder="Contraseña" value={formData.password} onChange={handleInputChange} required />
                    <button type="submit" style={{ padding: '10px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Insertar Usuario
                    </button>
                </form>
            </div>

            <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>2. Prueba de Lectura (Usuarios en DB)</h2>
                {loading ? <p>Cargando datos...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f4f4f4' }}>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nombre</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Apellido</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '10px' }}>No hay usuarios en la base de datos</td></tr>
                            ) : (
                                usuarios.map(user => (
                                    <tr key={user.id_usuario}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{user.id_usuario}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.nombre}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.apellido}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.email}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default TestDB;
