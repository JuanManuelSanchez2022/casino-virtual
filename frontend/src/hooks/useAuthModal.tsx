import { createContext, useContext, useState, ReactNode } from 'react';
import AuthModal from '../components/AuthModal';

interface AuthModalContextType {
  openAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAuthModal = () => setIsOpen(true);

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      {children}
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error('useAuthModal must be used within AuthModalProvider');
  return context;
}
