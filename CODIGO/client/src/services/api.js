const API_URL = 'http://localhost:3001/api';

export const getUsuarios = async () => {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        if (!response.ok) throw new Error('Error al obtener usuarios');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const createUsuario = async (usuarioData) => {
    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(usuarioData),
        });
        if (!response.ok) throw new Error('Error al crear usuario');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};
export const updateUsuario = async (id, usuarioData) => {
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(usuarioData),
        });
        if (!response.ok) throw new Error('Error al actualizar usuario');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const deleteUsuario = async (id) => {
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Error al eliminar usuario');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};
