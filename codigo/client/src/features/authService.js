const cleanUrl = (rawUrl) => {
  if (!rawUrl) return 'http://localhost:3001/api';
  // Elimina corchetes, comillas y espacios accidentales
  let cleaned = rawUrl.replace(/[\[\]"']/g, '').trim();
  // Si contiene paréntesis de un link markdown [texto](url), extrae solo la URL
  if (cleaned.includes('(') && cleaned.includes(')')) {
    const match = cleaned.match(/\(([^)]+)\)/);
    if (match) cleaned = match[1];
  }
  return cleaned.replace(/\/$/, ''); // Quita la barra final si la tiene
};
const API_URL = cleanUrl(import.meta.env.VITE_API_URL);
console.log("API_URL configurada actualmente:", API_URL);

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result.success && result.data) {
      const { password: _password, ...userWithoutPassword } = result.data;
      return userWithoutPassword;
    }

    return null;
  } catch (error) {
    console.error('Error durante el login:', error);
    return null;
  }
};

export const saveUser = (user) => {
  localStorage.setItem("liftingupUser", JSON.stringify(user));
};

export const getCurrentUser = () => {
  const stored = localStorage.getItem("liftingupUser");
  return stored ? JSON.parse(stored) : null;
};

export const logout = () => {
  localStorage.removeItem("liftingupUser");
};