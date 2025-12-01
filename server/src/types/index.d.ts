declare global {
  namespace Express {
    interface User {
      id: string;
      role: 'user' | 'admin';
    }
    
    interface Request {
      user?: User;
    }
  }
}

export {};




