import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../features/reduxSlices/categories/categoriesSlice';
import {
    Laptop,
    Book,
    House,
    Basket,
    CarFront,
    HeartPulse,
    Phone,
    Tools,
    MusicNote,
    Camera,
    Gift,
    PersonBadge
} from 'react-bootstrap-icons';

const CategoriesSidebar = ({ isOpen, onClose, onNavigate }) => {
    const dispatch = useDispatch();
    const categories = useSelector((state) => state.categories.items);
    const loading = useSelector((state) => state.categories.loading);
    const error = useSelector((state) => state.categories.error);

    useEffect(() => {
        if (isOpen && categories.length === 0 && !loading) {
            dispatch(fetchCategories());
        }
    }, [isOpen, dispatch]);

    // Mapeo flexible: si el nombre contiene la palabra clave, asigna el icono más representativo
    const getCategoryIcon = (categoryName) => {
        const iconMap = [
            { keywords: ['electrónico', 'laptop', 'dispositivo', 'gadget'], icon: <Laptop className="me-2" /> },
            { keywords: ['hogar', 'cocina', 'mueble', 'electrodoméstico'], icon: <House className="me-2" /> },
            { keywords: ['moda', 'ropa', 'calzado', 'accesorio'], icon: <PersonBadge className="me-2" /> },
            { keywords: ['deporte', 'aire libre', 'camping', 'aventura'], icon: <Basket className="me-2" /> },
            { keywords: ['salud', 'cuidado', 'personal', 'vitamina', 'bienestar'], icon: <HeartPulse className="me-2" /> },
            { keywords: ['juguete', 'juego', 'consola'], icon: <Gift className="me-2" /> },
            { keywords: ['libro', 'música', 'cine', 'película', 'serie'], icon: <MusicNote className="me-2" /> },
            { keywords: ['automotriz', 'herramienta', 'vehículo', 'taller'], icon: <Tools className="me-2" /> },
            { keywords: ['mascota', 'animal'], icon: <CarFront className="me-2" /> },
        ];
        const lower = categoryName.toLowerCase();
        for (const { keywords, icon } of iconMap) {
            if (keywords.some(k => lower.includes(k))) {
                return icon;
            }
        }
        return <Gift className="me-2" />;
    };

    // Transform categories to menu items format
    const categoriesMenuItems = categories.map(category => ({
        id: category.id.toString(),
        label: category.name,
        icon: getCategoryIcon(category.name)
    }));

    if (loading) {
        return (
            <Sidebar
                isOpen={isOpen}
                onClose={onClose}
                title="Categorías"
                menuItems={[{ id: 'loading', label: 'Cargando...', icon: <Book className="me-2" /> }]}
            />
        );
    }

    if (error) {
        return (
            <Sidebar
                isOpen={isOpen}
                onClose={onClose}
                title="Categorías"
                menuItems={[{ id: 'error', label: error, icon: <Book className="me-2" /> }]}
            />
        );
    }

    return (
        <Sidebar
            isOpen={isOpen}
            onClose={onClose}
            title="Categorías"
        >
            <ul className="nav flex-column">
                {categoriesMenuItems.map((item) => (
                    <li key={item.id} className="nav-item">
                        <div
                            className="nav-link d-flex align-items-center"
                            onClick={() => {
                                onClose();
                                onNavigate?.();
                            }}
                        >
                            {item.icon}
                            {item.label}
                        </div>
                    </li>
                ))}
            </ul>
        </Sidebar>
    );
};

export default CategoriesSidebar;