import { authService, User } from '@/services/authService';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredData();
    }, []);

    async function loadStoredData() {
        try {
            const data = await authService.getUserFromStorage();
            if (data.user && data.token) {
                setUser(data.user);
                setToken(data.token);
            }
        } catch (e) {
            console.error('Error loading auth data', e);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(email: string, password: string) {
        try {
            const data = await authService.login(email, password);
            setUser(data.user);
            setToken(data.token);
        } catch (e: any) {
            throw e;
        }
    }

    async function logout() {
        await authService.logout();
        setUser(null);
        setToken(null);
    }

    async function updateUser(data: Partial<User>) {
        // This is a local update only for now, ideally should sync with backend
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
