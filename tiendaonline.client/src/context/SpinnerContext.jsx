// src/contexts/SpinnerContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { RingLoader } from 'react-spinners';
import { css } from '@emotion/react';

const SpinnerContext = createContext();

const override = css`
  display: block;
  margin: 0 auto;
`;

export const SpinnerProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [spinnerProps, setSpinnerProps] = useState({
        color: '#36D7B7', // Color principal del spinner
        size: 60,        // Tamaño por defecto
        css: override,
        speedMultiplier: 1 // Velocidad de animación
    });

    // Usar useCallback para memoizar las funciones
    const showSpinner = useCallback((customProps = {}) => {
        setSpinnerProps(prev => ({ ...prev, ...customProps }));
        setLoading(true);
    }, []);

    const hideSpinner = useCallback(() => {
        setLoading(false);
    }, []);

    return (
        <SpinnerContext.Provider value={{ showSpinner, hideSpinner }}>
            {children}
            {loading && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999,
                    pointerEvents: 'none' // Permite interacción con elementos debajo
                }}>
                    <RingLoader
                        color={spinnerProps.color}
                        size={spinnerProps.size}
                        css={spinnerProps.css}
                        speedMultiplier={spinnerProps.speedMultiplier}
                    />
                </div>
            )}
        </SpinnerContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSpinner = () => {
    const context = useContext(SpinnerContext);
    if (!context) {
        throw new Error('useSpinner must be used within a SpinnerProvider');
    }
    return context;
};