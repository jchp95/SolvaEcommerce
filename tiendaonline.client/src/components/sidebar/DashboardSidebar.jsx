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
import { useSelector } from 'react-redux';

export const DashboardSidebar = ({
    isOpen,
    onClose,
} ) => {
    const user = useSelector((state) => state.auth.user);
    const isProveedor = user?.roles?.includes('SuperAdmin') || user?.roles?.includes('Proveedor');

    return (
        <Sidebar
            isOpen={isOpen}
            onClose={onClose}
            title="Panel de Administración"
        >
            <ul className="nav flex-column">
                <li className="nav-item">
                    <Link
                        to='/categories'
                        className="nav-link d-flex align-items-center"
                        onClick={onClose}
                    >
                        <PlusCircle className="me-2" />
                        Gestionar categorías
                    </Link>
                </li>
                <li className="nav-item">
                    <Link
                        to='/products'
                        className="nav-link d-flex align-items-center"
                        onClick={onClose}
                    >
                        <BoxSeam className="me-2" />
                        Gestionar productos
                    </Link>
                </li>
                <li className="nav-item">
                    <Link
                        to='/reports'
                        className="nav-link d-flex align-items-center"
                        onClick={onClose}
                    >
                        <FileBarGraph className="me-2" />
                        Ver reportes
                    </Link>
                </li>
                <li className="nav-item">
                    <Link
                        to='/orders'
                        className="nav-link d-flex align-items-center"
                        onClick={onClose}
                    >
                        <CreditCard className="me-2" />
                        Gestión de pedidos
                    </Link>
                </li>
                <li className="nav-item">
                    <Link
                        to='/promotions'
                        className="nav-link d-flex align-items-center"
                        onClick={onClose}
                    >
                        <Megaphone className="me-2" />
                        Promociones
                    </Link>
                </li>
                <li className="nav-item">
                    <Link
                        to='/coupons'
                        className="nav-link d-flex align-items-center"
                        onClick={onClose}
                    >
                        <Ticket className="me-2" />
                        Cupones
                    </Link>
                </li>

                {isProveedor && (
                    <>
                        <li className="nav-item">
                            <Link
                                to='/supplier/profile'
                                className="nav-link d-flex align-items-center"
                                onClick={onClose}
                            >
                                <People className="me-2" />
                                Datos de proveedor
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                to='/users'
                                className="nav-link d-flex align-items-center"
                                onClick={onClose}
                            >
                                <People className="me-2" />
                                Gestión de usuarios
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                to='/settings'
                                className="nav-link d-flex align-items-center"
                                onClick={onClose}
                            >
                                <Gear className="me-2" />
                                Configuración
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                to='/security'
                                className="nav-link d-flex align-items-center"
                                onClick={onClose}
                            >
                                <ShieldCheck className="me-2" />
                                Seguridad
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </Sidebar>
    );
}
