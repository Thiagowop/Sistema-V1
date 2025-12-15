// Configuração de usuários autorizados do sistema DailyFlow
// Usuários são carregados do arquivo .env para maior segurança

interface User {
  email: string;
  password: string;
  name: string;
}

// Função para carregar usuários do .env
const loadUsersFromEnv = (): User[] => {
  const envUsers = import.meta.env.VITE_AUTHORIZED_USERS;
  
  // Se não configurado no .env, usa usuários padrão (apenas dev)
  if (!envUsers) {
    console.warn('⚠️  VITE_AUTHORIZED_USERS não configurado. Usando usuários padrão.');
    return [
      {
        email: 'thiago.vitorio@mcsarc.com.br',
        password: 'Mcsa@2025!',
        name: 'Thiago Vitório'
      },
      {
        email: 'admin@mcsarc.com.br',
        password: 'Mcsa@2025!',
        name: 'Administrador'
      },
      {
        email: 'user@mcsarc.com.br',
        password: 'usermcsa',
        name: 'User'
      }
    ];
  }

  // Parse do formato: email:senha:nome|email2:senha2:nome2
  try {
    return envUsers.split('|').map((userStr: string) => {
      const [email, password, name] = userStr.split(':');
      return { email: email.trim(), password: password.trim(), name: name.trim() };
    });
  } catch (error) {
    console.error('❌ Erro ao carregar usuários do .env:', error);
    return [];
  }
};

// Lista de usuários autorizados (carregados do .env)
export const AUTHORIZED_USERS: User[] = loadUsersFromEnv();

// Função para autenticar usuário
export const authenticateUser = (email: string, password: string): boolean => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = AUTHORIZED_USERS.find(
    u => u.email.toLowerCase() === normalizedEmail && u.password === password
  );
  
  return !!user;
};

// Função para obter nome do usuário
export const getUserName = (email: string): string | null => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = AUTHORIZED_USERS.find(u => u.email.toLowerCase() === normalizedEmail);
  return user ? user.name : null;
};
