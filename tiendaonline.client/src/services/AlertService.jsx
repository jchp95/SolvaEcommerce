// src/services/AlertService.jsx
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import '../assets/css/sweetAlertStyles.css'; // Importamos los estilos

const MySwal = withReactContent(Swal);

// Configuración global para todas las alertas
MySwal.mixin({
    width: '32rem',
    padding: '2rem',
    showClass: {
        popup: 'swal2-show',
        backdrop: 'swal2-backdrop-show',
        icon: 'swal2-icon-show'
    },
    hideClass: {
        popup: 'swal2-hide',
        backdrop: 'swal2-backdrop-hide',
        icon: 'swal2-icon-hide'
    }
});

class AlertService {
    static async confirm(options) {
        const defaultOptions = {
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: {
                confirmButton: 'btn btn-danger mx-2',
                cancelButton: 'btn btn-secondary mx-2',
                popup: 'dark-swal-popup'
            },
            buttonsStyling: false,
            focusCancel: true
        };

        return await MySwal.fire({
            ...defaultOptions,
            ...options
        });
    }

    static async success(options) {
        const defaultOptions = {
            title: 'Éxito!',
            icon: 'success',
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            customClass: {
                timerProgressBar: 'swal2-timer-progress-bar-dark',
            }
        };

        return await MySwal.fire({
            ...defaultOptions,
            ...options
        });
    }

    static async error(options) {
        const defaultOptions = {
            title: 'Error!',
            icon: 'error',
            confirmButtonText: 'Entendido',
            customClass: {
                confirmButton: 'btn btn-danger',
                popup: 'dark-swal-popup'
            },
            buttonsStyling: false
        };

        return await MySwal.fire({
            ...defaultOptions,
            ...options
        });
    }

    static async info(options) {
        const defaultOptions = {
            title: 'Información',
            icon: 'info',
            confirmButtonText: 'Entendido',
            customClass: {
                confirmButton: 'btn btn-info',
                popup: 'dark-swal-popup'
            },
            buttonsStyling: false
        };

        return await MySwal.fire({
            ...defaultOptions,
            ...options
        });
    }

    static async custom(options) {
        return await MySwal.fire({
            customClass: {
                popup: 'dark-swal-popup'
            },
            buttonsStyling: false,
            ...options
        });
    }
}

export default AlertService;