import React, { createContext, useCallback, useContext, useState } from 'react';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onConfirm?: () => void;
}

interface AlertContextType {
    showAlert: (title: string, message: string, type?: AlertType, onConfirm?: () => void) => void;
    hideAlert: () => void;
    alert: AlertState;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alert, setAlert] = useState<AlertState>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = useCallback((title: string, message: string, type: AlertType = 'info', onConfirm?: () => void) => {
        setAlert({ visible: true, title, message, type, onConfirm });
    }, []);

    const hideAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert, alert }}>
            {children}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
