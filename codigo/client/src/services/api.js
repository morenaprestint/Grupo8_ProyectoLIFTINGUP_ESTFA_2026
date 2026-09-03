const cleanUrl = (rawUrl) => {
    if (!rawUrl) return 'https://lifting-up-backend.onrender.com/api';
    let cleaned = rawUrl.replace(/[\[\]"']/g, '').trim();
    if (cleaned.includes('(') && cleaned.includes(')')) {
        const match = cleaned.match(/\(([^)]+)\)/);
        if (match) cleaned = match[1];
    }
    return cleaned.replace(/\/$/, '');
};

const API_URL = cleanUrl(import.meta.env.VITE_API_URL);
console.log("API_URL configurada actualmente:", API_URL);

// ─── Helper para manejar respuestas ─────────────────────────────────────
const handleResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    let json = null;

    if (contentType && contentType.indexOf("application/json") !== -1) {
        json = await response.json();
    } else {
        const text = await response.text();
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: La respuesta del servidor no es JSON válido.`);
        }
        return text;
    }

    if (!response.ok) {
        const msg = json?.message || `Error HTTP ${response.status}`;
        throw new Error(msg);
    }
    return json;
};

// ─── USUARIOS Y ADMINS ──────────────────────────────────────────────────
export const getUsuarios = async () => {
    const response = await fetch(`${API_URL}/usuarios`);
    return handleResponse(response);
};

export const getUsuarioById = async (id) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`);
    return handleResponse(response);
};

export const createUsuario = async (usuarioData) => {
    const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioData),
    });
    return handleResponse(response);
};

export const createAdmin = async (adminData) => {
    const response = await fetch(`${API_URL}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData)
    });
    return handleResponse(response);
};

export const getAdmins = async () => {
    const response = await fetch(`${API_URL}/admins`);
    return handleResponse(response);
};

export const updateUsuario = async (id, usuarioData) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioData),
    });
    return handleResponse(response);
};

export const deleteUsuario = async (id) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};

// ─── RUTINAS ─────────────────────────────────────────────────────────────
export const getRutinas = async (id_usuario = '') => {
    const query = id_usuario ? `?id_usuario=${id_usuario}` : '';
    const response = await fetch(`${API_URL}/rutinas${query}`);
    return handleResponse(response);
};

export const createRutina = async (data) => {
    const response = await fetch(`${API_URL}/rutinas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const updateRutina = async (id, data) => {
    const response = await fetch(`${API_URL}/rutinas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

// ─── ASISTENCIAS ─────────────────────────────────────────────────────────
export const getAsistencias = async (id_usuario) => {
    const query = id_usuario ? `?id_usuario=${id_usuario}` : '';
    const response = await fetch(`${API_URL}/asistencia${query}`);
    return handleResponse(response);
};

export const createAsistencia = async (data) => {
    const response = await fetch(`${API_URL}/asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

// ─── EJERCICIOS ──────────────────────────────────────────────────────────
export const getEjercicios = async () => {
    const response = await fetch(`${API_URL}/ejercicios`);
    return handleResponse(response);
};

export const createEjercicio = async (data) => {
    const response = await fetch(`${API_URL}/ejercicios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};