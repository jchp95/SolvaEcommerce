export const formatImageUrl = (url) => {
    if (!url) return null;

    // Si es una URL completa (incluyendo https)
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    // Si es una ruta absoluta (comienza con /) y estamos en producción
    if (url.startsWith('/') && import.meta.env.PROD) {
        return url;
    }

    // Para desarrollo o rutas relativas
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};