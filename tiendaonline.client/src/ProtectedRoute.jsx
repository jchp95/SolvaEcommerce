import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    const isTokenValid = () => {
        if (!token) return false;

        // Verificar que el token tenga 3 partes (header.payload.firma)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.error("Token inválido: no tiene 3 partes");
            return false;
        }

        try {
            const decoded = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch (error) {
            console.error("Error al decodificar el token:", error);
            return false;
        }
    };

    return isTokenValid() ? children : <Navigate to="/" />;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;