import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import {
    PlusCircle,
    BoxSeam,
    FileBarGraph,
    Gear,
    People,
    CreditCard,
    Megaphone,
    Ticket,
    ShieldCheck
} from 'react-bootstrap-icons';

const DashboardSidebar = ({ isOpen, onClose }) => {
    const adminMenuItems = [
        {
            id: 'categories',
            label: 'Gestionar Categorías',
            icon: <PlusCircle className="me-2" />,
            path: '/categories'
        },
        {
            id: 'products',
            label: 'Gestionar Productos',
            icon: <BoxSeam className="me-2" />,
            path: '/products'
        },
        {
            id: 'reports',
            label: 'Ver reportes',
            icon: <FileBarGraph className="me-2" />,
            path: '/reports'
        },
        {
            id: 'users',
            label: 'Gestión de usuarios',
            icon: <People className="me-2" />,
            path: '/users'
        },
        {
            id: 'orders',
            label: 'Gestión de pedidos',
            icon: <CreditCard className="me-2" />,
            path: '/orders'
        },
        {
            id: 'promotions',
            label: 'Promociones',
            icon: <Megaphone className="me-2" />,
            path: '/promotions'
        },
        {
            id: 'coupons',
            label: 'Cupones',
            icon: <Ticket className="me-2" />,
            path: '/coupons'
        },
        {
            id: 'settings',
            label: 'Configuración',
            icon: <Gear className="me-2" />,
            path: '/settings'
        },
        {
            id: 'security',
            label: 'Seguridad',
            icon: <ShieldCheck className="me-2" />,
            path: '/security'
        }
    ];

    return (
        <Sidebar
            isOpen={isOpen}
            onClose={onClose}
            title="Panel de Administración"
        >
            <ul className="nav flex-column">
                {adminMenuItems.map((item) => (
                    <li key={item.id} className="nav-item">
                        <Link
                            to={item.path}
                            className="nav-link d-flex align-items-center"
                            onClick={onClose}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </Sidebar>
    );
};

export default DashboardSidebar;