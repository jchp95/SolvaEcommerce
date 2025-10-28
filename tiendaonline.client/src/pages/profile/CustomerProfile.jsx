import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Tabs, Badge, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faShoppingBag, 
    faEye, 
    faCalendarAlt,
    faCreditCard,
    faTruck,
    faCheckCircle,
    faTimesCircle,
    faClock
} from '@fortawesome/free-solid-svg-icons';
import { fetchMyOrders, clearErrors } from '../../features/reduxSlices/orders/ordersSlice';
import OrdersList from '../../components/profile/OrdersList';
import OrderDetails from '../../components/profile/OrderDetails';
import UserProfile from '../../components/profile/UserProfile';
import './CustomerProfile.css';

const CustomerProfile = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const [selectedOrder, setSelectedOrder] = useState(null);
    
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { 
        orders, 
        loading, 
        error 
    } = useSelector(state => state.orders);

    useEffect(() => {
        // Limpiar errores previos y cargar órdenes
        dispatch(clearErrors());
        dispatch(fetchMyOrders());
    }, [dispatch]);

    // Estadísticas de órdenes
    const orderStats = {
        total: orders.length,
        pending: orders.filter(order => 
            order.status === 'Pending' || 
            order.status === 'Pendiente' || 
            order.status === 'Processing' ||
            order.status === 'Procesando'
        ).length,
        completed: orders.filter(order => 
            order.status === 'Delivered' || 
            order.status === 'Entregado' ||
            order.status === 'Completado'
        ).length,
        cancelled: orders.filter(order => 
            order.status === 'Cancelled' || 
            order.status === 'Cancelado' ||
            order.status === 'Refunded' ||
            order.status === 'Reembolsado'
        ).length
    };

    const handleViewOrder = async (order) => {
        try {
            // Si ya tenemos todos los detalles, usar la orden actual
            if (order.items && order.items.length > 0) {
                setSelectedOrder(order);
                setActiveTab('order-details');
                return;
            }

            // Si no, obtener los detalles completos
            const { OrderService } = await import('../../api/endpoints/orders');
            const fullOrderData = await OrderService.getById(order.id);
            
            setSelectedOrder(fullOrderData.data || fullOrderData);
            setActiveTab('order-details');
        } catch (error) {
            console.error('Error al obtener detalles de la orden:', error);
            // Usar la orden básica si falla
            setSelectedOrder(order);
            setActiveTab('order-details');
        }
    };

    const handleBackToOrders = () => {
        setSelectedOrder(null);
        setActiveTab('orders');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Entregado':
            case 'Completado':
                return <FontAwesomeIcon icon={faCheckCircle} className="text-success" />;
            case 'Cancelled':
            case 'Cancelado':
            case 'Refunded':
            case 'Reembolsado':
                return <FontAwesomeIcon icon={faTimesCircle} className="text-danger" />;
            case 'Shipped':
            case 'Enviado':
                return <FontAwesomeIcon icon={faTruck} className="text-primary" />;
            case 'Processing':
            case 'Procesando':
                return <FontAwesomeIcon icon={faCreditCard} className="text-info" />;
            case 'Pending':
            case 'Pendiente':
            default:
                return <FontAwesomeIcon icon={faClock} className="text-warning" />;
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Completado':
                return 'success';
            case 'Cancelado':
                return 'danger';
            case 'Pendiente':
                return 'warning';
            case 'En Proceso':
                return 'info';
            case 'Enviado':
                return 'primary';
            default:
                return 'secondary';
        }
    };

    if (loading && orders.length === 0) {
        return (
            <Container className="customer-profile-container">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-3">Cargando tu perfil...</p>
                </div>
            </Container>
        );
    }

    return (
        <div className="customer-profile-page">
            <Container className="customer-profile-container">
                {/* Header del perfil */}
                <Row className="profile-header mb-4">
                    <Col>
                        <Card className="profile-welcome-card">
                            <Card.Body >
                                <Row className="align-items-center">
                                    <Col md={8}>
                                        <div className="d-flex align-items-center">
                                            <div className="profile-avatar">
                                                <FontAwesomeIcon icon={faUser} size="2x" />
                                            </div>
                                            <div className="ms-3">
                                                <h2 className="welcome-title">
                                                    ¡Bienvenido, {user?.userName || 'Cliente'}!
                                                </h2>
                                                <p className="welcome-subtitle">
                                                    Aquí puedes ver tus pedidos y gestionar tu cuenta
                                                </p>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-end">
                                        <div className="profile-stats">
                                            <div className="stat-item">
                                                <FontAwesomeIcon icon={faShoppingBag} className="stat-icon" />
                                                <span className="stat-number">{orderStats.total}</span>
                                                <span className="stat-label">Pedidos</span>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Estadísticas rápidas */}
                <Row className="quick-stats mb-4">
                    <Col md={3} sm={6}>
                        <Card className="stat-card total-orders">
                            <Card.Body className="text-center">
                                <FontAwesomeIcon icon={faShoppingBag} className="stat-card-icon" />
                                <h3 className="stat-card-number">{orderStats.total}</h3>
                                <p className="stat-card-label">Total Pedidos</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3} sm={6}>
                        <Card className="stat-card pending-orders">
                            <Card.Body className="text-center">
                                <FontAwesomeIcon icon={faClock} className="stat-card-icon" />
                                <h3 className="stat-card-number">{orderStats.pending}</h3>
                                <p className="stat-card-label">Pendientes</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3} sm={6}>
                        <Card className="stat-card completed-orders">
                            <Card.Body className="text-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="stat-card-icon" />
                                <h3 className="stat-card-number">{orderStats.completed}</h3>
                                <p className="stat-card-label">Completados</p>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3} sm={6}>
                        <Card className="stat-card cancelled-orders">
                            <Card.Body className="text-center">
                                <FontAwesomeIcon icon={faTimesCircle} className="stat-card-icon" />
                                <h3 className="stat-card-number">{orderStats.cancelled}</h3>
                                <p className="stat-card-label">Cancelados</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Contenido principal con tabs */}
                <Row>
                    <Col>
                        <Card className="main-content-card">
                            <Card.Body>
                                <Tabs
                                    activeKey={activeTab}
                                    onSelect={(k) => setActiveTab(k)}
                                    className="profile-tabs"
                                >
                                    <Tab eventKey="orders" title="Mis Pedidos">
                                        <div className="tab-content-wrapper">
                                            {error && (
                                                <div className="alert alert-danger" role="alert">
                                                    <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                                                    {error}
                                                </div>
                                            )}
                                            <OrdersList 
                                                orders={orders}
                                                loading={loading}
                                                onViewOrder={handleViewOrder}
                                                getStatusIcon={getStatusIcon}
                                                getStatusVariant={getStatusVariant}
                                            />
                                        </div>
                                    </Tab>
                                    
                                    <Tab eventKey="profile" title="Mi Información">
                                        <div className="tab-content-wrapper">
                                            <UserProfile user={user} />
                                        </div>
                                    </Tab>
                                    
                                    {selectedOrder && (
                                        <Tab eventKey="order-details" title={`Pedido ${selectedOrder.orderNumber || selectedOrder.id}`}>
                                            <div className="tab-content-wrapper">
                                                <OrderDetails 
                                                    order={selectedOrder}
                                                    onBack={handleBackToOrders}
                                                    getStatusIcon={getStatusIcon}
                                                    getStatusVariant={getStatusVariant}
                                                />
                                            </div>
                                        </Tab>
                                    )}
                                </Tabs>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default CustomerProfile;
