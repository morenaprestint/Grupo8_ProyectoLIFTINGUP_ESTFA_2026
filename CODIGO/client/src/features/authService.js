export const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3001/api/usuarios/login', {
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