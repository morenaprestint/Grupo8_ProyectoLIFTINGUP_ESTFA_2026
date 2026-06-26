const API_URL = 'http://localhost:3001/api';

// ─── Helper para manejar respuestas ─────────────────────────────────────
const handleResponse = async (response) => {
    const json = await response.json();
    if (!response.ok) {
        const msg = json?.message || `Error HTTP ${response.status}`;
        throw new Error(msg);
    }
    return json;
};

// ─── GET /api/usuarios — Obtener todos ──────────────────────────────────
export const getUsuarios = async () => {
    const response = await fetch(`${API_URL}/usuarios`);
    return handleResponse(response);
};

// ─── GET /api/usuarios/:id — Obtener uno por ID ─────────────────────────
export const getUsuarioById = async (id) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`);
    return handleResponse(response);
};

// ─── POST /api/usuarios — Crear usuario ─────────────────────────────────
export const createUsuario = async (usuarioData) => {
    const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioData),
    });
    return handleResponse(response);
};

// ─── PUT /api/usuarios/:id — Actualizar usuario ──────────────────────────
export const updateUsuario = async (id, usuarioData) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioData),
    });
    return handleResponse(response);
};

// ─── DELETE /api/usuarios/:id — Eliminar usuario ─────────────────────────
export const deleteUsuario = async (id) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};
