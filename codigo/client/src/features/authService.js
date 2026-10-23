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

export const login = async (email, password) => {
  try {
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password.trim() : '';

    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });

    const result = await response.json().catch(() => null);

    if (response.status === 403 && result?.email_no_verificado) {
      const { password: _password, ...userWithoutPassword } = result.data || {};
      return {
        ...userWithoutPassword,
        email_no_verificado: true,
        email_verificado: 0
      };
    }

    if (!response.ok) {
      return null;
    }

    if (result?.success && result?.data) {
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