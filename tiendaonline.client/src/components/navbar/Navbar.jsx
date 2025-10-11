import { Col, Row, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Navbar.css'; // Archivo CSS separado para los estilos
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSignInAlt,
    faUserPlus,
    faStore,
    faShoppingCart,
    faEnvelope,
    faInfoCircle,
    faGear
} from '@fortawesome/free-solid-svg-icons';
import CartSidebar from '../sidebar/CartSidebar'; // Asegúrate de que la ruta sea correcta
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteSettings } from '../../features/reduxSlices/siteSettings/siteSettingsSlice';


function CustomNavbar() {
    const [lastScrollY, setLastScrollY] = useState(0);
    const [navbarHidden, setNavbarHidden] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const dispatch = useDispatch();
    const store = useSelector(state => state.siteSettings);
    const { data: siteSettings } = useSelector(state => state.siteSettings);

    const [formData, setFormData] = useState({
        siteName: '',
    });

     useEffect(() => {
        dispatch(fetchSiteSettings());
    }, [dispatch]);

    useEffect(() => {
        if (siteSettings) {
            setFormData({
                siteName: siteSettings.siteName || '',
                logoUrl: siteSettings.logoUrl || ''
            });
        }
    }, [siteSettings]);

    // Ejemplo básico: estado local de carrito
    const [cartItems, setCartItems] = useState([
        // Ejemplo de items, luego reemplaza con tu estado global o contexto
        { id: 1, name: 'Producto 1', price: 12.99, quantity: 2, imageUrl: '/img1.jpg' },
        { id: 2, name: 'Producto 2', price: 5.5, quantity: 1, imageUrl: '/img2.jpg' },
    ]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setNavbarHidden(true);
            } else {
                setNavbarHidden(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const toggleCart = () => setCartOpen(!cartOpen);

    const handleRemoveItem = (id) => {
        setCartItems(items => items.filter(item => item.id !== id));
    };

    const handleCheckout = () => {
        alert('Redirigir a la página de checkout');
        setCartOpen(false);
    };

    return (
        <>
            <Navbar expand="lg" collapseOnSelect className={`custom-navbar ${navbarHidden ? 'hidden' : ''}`}>
                <Col >
                    <Row className="container-navbar">
                        <Navbar.Collapse id="main-navbar">
                            <Row className='container-logo me-2'>
                                <img src={formData.logoUrl} alt="Logo" className="logo" />
                            </Row>
                           
                            <Navbar.Brand as={Link} to="/" className="navbar-brand">
                                <span className="brand-name">{formData.siteName}</span>
                            </Navbar.Brand>
                            <Nav className="ms-auto">
                                <Nav.Link as={Link} to="/dashboard" className="nav-link"><FontAwesomeIcon icon={faGear} className='icons' />
                                    Dashboard</Nav.Link>
                                <Nav.Link as={Link} to="/register" className="nav-link"><FontAwesomeIcon icon={faUserPlus} className='icons' />
                                    Register</Nav.Link>
                                <Nav.Link as={Link} to="/login" className="nav-link"><FontAwesomeIcon icon={faSignInAlt} className='icons' />
                                    Login
                                </Nav.Link>
                            </Nav>
                        </Navbar.Collapse>
                    </Row>


                    <Row className="container-navbar-end">
                        <Navbar.Collapse className='navbar-collapse' id="main-navbar-end">
                            <Nav>
                                <Nav.Link as={Link} to="/store" className="nav-link-site"><FontAwesomeIcon icon={faStore} className='icons' /> Store</Nav.Link>
                                {/* Cambiamos el enlace del carrito por un botón que abre el sidebar */}
                                <Nav.Link as="button" onClick={toggleCart} className="nav-link-site btn btn-link">
                                    <FontAwesomeIcon icon={faShoppingCart} className='icons' /> Cart
                                </Nav.Link>
                                <Nav.Link as={Link} to="/contact" className="nav-link-site"><FontAwesomeIcon icon={faEnvelope} className='icons' /> Contact</Nav.Link>
                                <Nav.Link as={Link} to="/about" className="nav-link-site"><FontAwesomeIcon icon={faInfoCircle} className='icons' /> About Us</Nav.Link>
                            </Nav>
                        </Navbar.Collapse>
                    </Row>
                </Col>
            </Navbar>

            <CartSidebar
                isOpen={cartOpen}
                onClose={() => setCartOpen(false)}
                cartItems={cartItems}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
            />
        </>
    );
}

export default CustomNavbar;