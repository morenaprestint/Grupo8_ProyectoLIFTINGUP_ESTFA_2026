const cleanUrl = (rawUrl) => {
    if (!rawUrl) return 'https://lifting-up-backend.onrender.com/api';
    let cleaned = String(rawUrl).trim();
    // Si contiene formato markdown [texto](url), extraer la URL dentro de los paréntesis
    const markdownMatch = cleaned.match(/\((https?:\/\/[^\s\)]+)\)/);
    if (markdownMatch) {
        cleaned = markdownMatch[1];
    }
    // Elimina corchetes, comillas, backticks y espacios accidentales
    return cleaned.replace(/[\[\]"'`]/g, '').trim().replace(/\/+$/, '');
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

export const updateUsuario = async (id, usuarioData, requesterId = null, requesterEmail = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (requesterId) {
        headers['x-user-id'] = requesterId;
    }
    if (requesterEmail) {
        headers['x-user-email'] = requesterEmail;
    }
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(usuarioData),
    });
    return handleResponse(response);
};

export const deleteUsuario = async (id, requesterId = null, requesterEmail = null) => {
    const headers = {};
    if (requesterId) {
        headers['x-user-id'] = requesterId;
    }
    if (requesterEmail) {
        headers['x-user-email'] = requesterEmail;
    }
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
        headers
    });
    return handleResponse(response);
};

// ─── RUTINAS ─────────────────────────────────────────────────────────────
export const getRutinas = async (id_usuario = '', prearmadas = false, solo_usuario = false) => {
    let query = '';
    const params = [];
    if (prearmadas) {
        params.push('prearmadas=true');
    } else if (solo_usuario && id_usuario) {
        params.push(`id_usuario=${id_usuario}&solo_usuario=true`);
    } else if (id_usuario) {
        params.push(`id_usuario=${id_usuario}`);
    }
    if (params.length > 0) {
        query = `?${params.join('&')}`;
    }
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

export const deleteRutina = async (id) => {
    const response = await fetch(`${API_URL}/rutinas/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};

// ─── ASISTENCIAS ─────────────────────────────────────────────────────────
export const getAsistencias = async (filtro = '') => {
    let query = '';
    if (typeof filtro === 'object' && filtro !== null) {
        const params = [];
        if (filtro.id_usuario) params.push(`id_usuario=${filtro.id_usuario}`);
        if (filtro.fecha) params.push(`fecha=${filtro.fecha}`);
        if (params.length > 0) query = `?${params.join('&')}`;
    } else if (filtro) {
        query = `?id_usuario=${filtro}`;
    }
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

export const deleteAsistencia = async (filtro) => {
    let query = '';
    let url = `${API_URL}/asistencia`;
    if (typeof filtro === 'object' && filtro !== null) {
        if (filtro.id_asistencia) {
            url = `${API_URL}/asistencia/${filtro.id_asistencia}`;
        } else {
            const params = [];
            if (filtro.id_usuario) params.push(`id_usuario=${encodeURIComponent(filtro.id_usuario)}`);
            if (filtro.fecha) params.push(`fecha=${encodeURIComponent(filtro.fecha)}`);
            if (params.length > 0) query = `?${params.join('&')}`;
            url = `${API_URL}/asistencia${query}`;
        }
    } else if (filtro) {
        url = `${API_URL}/asistencia/${filtro}`;
    }
    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
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

export const updateEjercicio = async (id, data) => {
    const response = await fetch(`${API_URL}/ejercicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const deleteEjercicio = async (id) => {
    const response = await fetch(`${API_URL}/ejercicios/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};

// ─── HISTORIAL DE ENTRENAMIENTOS ─────────────────────────────────────────
export const createHistorial = async (data) => {
    const response = await fetch(`${API_URL}/historial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(response);
};

export const getHistorialByUsuario = async (id_usuario) => {
    const response = await fetch(`${API_URL}/historial/${id_usuario}`);
    return handleResponse(response);
};

// ─── PERFIL USUARIO ATLETA ────────────────────────────────────────────────
export const getPerfilUsuario = async (userId, email) => {
    let query = '';
    if (userId) query = `?id=${userId}`;
    else if (email) query = `?email=${encodeURIComponent(email)}`;
    const response = await fetch(`${API_URL}/usuarios/perfil${query}`);
    return handleResponse(response);
};

export const updatePerfilUsuario = async (data) => {
    const response = await fetch(`${API_URL}/usuarios/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(response);
};

// ─── PERFIL USUARIO ADMINISTRADOR ─────────────────────────────────────────
export const getPerfilAdmin = async (adminId, email) => {
    let query = '';
    if (adminId) query = `?id=${adminId}`;
    else if (email) query = `?email=${encodeURIComponent(email)}`;
    const response = await fetch(`${API_URL}/admins/perfil${query}`);
    return handleResponse(response);
};

export const updatePerfilAdmin = async (data) => {
    const response = await fetch(`${API_URL}/admins/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(response);
};

// ─── EQUIPAMIENTO ────────────────────────────────────────────────────────
export const getEquipamiento = async (estatus = '') => {
    const query = estatus ? `?estatus=${encodeURIComponent(estatus)}` : '';
    const response = await fetch(`${API_URL}/equipamiento${query}`);
    return handleResponse(response);
};

export const createEquipamiento = async (data) => {
    const response = await fetch(`${API_URL}/equipamiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(response);
};

export const updateEquipamiento = async (id, data) => {
    const response = await fetch(`${API_URL}/equipamiento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(response);
};

export const deleteEquipamiento = async (id) => {
    const response = await fetch(`${API_URL}/equipamiento/${id}`, {
        method: 'DELETE'
    });
    return handleResponse(response);
};

// ─── SUBIDA DE FOTO DE PERFIL (MULTER) ────────────────────────────────────
export const uploadFotoPerfil = async (userId, file) => {
    const formData = new FormData();
    formData.append('foto', file);
    if (userId) formData.append('id', userId);

    const endpoint = userId ? `${API_URL}/usuarios/${userId}/foto` : `${API_URL}/usuarios/foto-perfil`;
    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
    });
    return handleResponse(response);
};

// ─── SEGURIDAD: CAMBIO DE CORREO ELECTRÓNICO (BCRYPT) ─────────────────────
export const cambiarEmail = async ({ id, nuevo_email, password_actual }) => {
    const response = await fetch(`${API_URL}/usuarios/cambiar-email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nuevo_email, password_actual })
    });
    return handleResponse(response);
};

// ─── SEGURIDAD: CAMBIO DE CONTRASEÑA (BCRYPT) ───────────────────────────
export const cambiarPassword = async ({ id, password_actual, nueva_password, confirm_password }) => {
    const response = await fetch(`${API_URL}/usuarios/cambiar-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password_actual, nueva_password, confirm_password })
    });
    return handleResponse(response);
};

// ─── HELPER PARA URL DE IMÁGENES ESTÁTICAS ───────────────────────────────
export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
// Utilidad exacta para formatear fechas a YYYY-MM-DD sin desfase de zona horaria
export const formatearAFechaISO = (fechaStr) => {
    if (!fechaStr) return '';
    const str = typeof fechaStr === 'string' ? fechaStr : fechaStr.toISOString();
    return str.slice(0, 10);
};
export const getFotoPerfilUrl = (email) => {
    if (!email) return '';
    return `${API_URL}/usuarios/foto-perfil/${email}`;
};

export const formatearFechaEspanol = (fechaStr) => {
    if (!fechaStr || fechaStr === 'null' || fechaStr === 'undefined') return 'No especificada';

    // Si viene como string ISO o con hora (ej. 2008-02-15T00:00:00.000Z)
    const cleanStr = String(fechaStr).slice(0, 10);

    if (!cleanStr.includes('-')) return cleanStr;

    const [anio, mes, dia] = cleanStr.split('-');
    if (!anio || !mes || !dia) return 'No especificada';

    return `${dia}/${mes}/${anio}`;
};
