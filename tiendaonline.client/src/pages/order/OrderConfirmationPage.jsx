import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Badge, ListGroup } from 'react-bootstrap';
import { CheckCircleFill, ArrowLeft, Receipt } from 'react-bootstrap-icons';
import './OrderConfirmationPage.css';

const OrderConfirmationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { order, successMessage } = location.state || {};

    if (!order) {
        return (
            <Container className="order-confirmation-page">
                <Card className="text-center no-order-card">
                    <Card.Body>
                        <h3>No se encontró información del pedido</h3>
                        <Button variant="primary" onClick={() => navigate('/')}>
                            Volver al Inicio
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            'Pending': { variant: 'warning', text: 'Pendiente' },
            'Confirmed': { variant: 'info', text: 'Confirmado' },
            'Processing': { variant: 'primary', text: 'Procesando' },
            'Shipped': { variant: 'success', text: 'Enviado' },
            'Delivered': { variant: 'success', text: 'Entregado' },
            'Cancelled': { variant: 'danger', text: 'Cancelado' }
        };
        
        const config = statusConfig[status] || { variant: 'secondary', text: status };
        return <Badge bg={config.variant}>{config.text}</Badge>;
    };

    const formatAddress = (address) => {
        if (!address) return 'No disponible';
        return `${address.street}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
    };

    return (
        <Container className="order-confirmation-page">
            {/* Header de Confirmación */}
            <Card className="mb-4 text-center success-card">
                <Card.Body className="py-5">
                    <CheckCircleFill className="success-icon" />
                    <h2 className="success-title">{successMessage}</h2>
                    <p className="lead success-subtitle">Tu pedido ha sido procesado correctamente y está siendo preparado.</p>
                </Card.Body>
            </Card>

            <Row>
                {/* Información del Pedido */}
                <Col lg={8}>
                    <Card className="mb-4 order-detail-card">
                        <Card.Header>
                            <h5 className="mb-0">
                                <Receipt className="me-2" />
                                Detalles del Pedido
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="mb-3 order-info-section">
                                <Col sm={6}>
                                    <div className="order-info-label">Número de Pedido:</div>
                                    <div className="order-info-value">{order.orderNumber}</div>
                                </Col>
                                <Col sm={6}>
                                    <div className="order-info-label">Fecha:</div>
                                    <div className="order-info-value">{new Date(order.orderDate).toLocaleDateString('es-ES')}</div>
                                </Col>
                            </Row>
                            
                            <Row className="mb-3 order-info-section">
                                <Col sm={6}>
                                    <div className="order-info-label">Estado:</div>
                                    <div className="order-info-value">{getStatusBadge(order.status)}</div>
                                </Col>
                                <Col sm={6}>
                                    <div className="order-info-label">Estado de Pago:</div>
                                    <div className="order-info-value">{getStatusBadge(order.paymentStatus)}</div>
                                </Col>
                            </Row>

                            {/* Información del Cliente */}
                            <h6 className="section-title">Información del Cliente</h6>
                            <Row>
                                <Col sm={6}>
                                    <div className="order-info-label">Nombre:</div>
                                    <div className="order-info-value">{order.customerFullName}</div>
                                    <div className="order-info-label">Email:</div>
                                    <div className="order-info-value">{order.customerEmail}</div>
                                </Col>
                                <Col sm={6}>
                                    {order.customerPhone && (
                                        <>
                                            <div className="order-info-label">Teléfono:</div>
                                            <div className="order-info-value">{order.customerPhone}</div>
                                        </>
                                    )}
                                </Col>
                            </Row>

                            {/* Direcciones */}
                            <h6 className="section-title">Direcciones</h6>
                            <Row>
                                <Col md={6}>
                                    <div className="order-info-label">Dirección de Facturación:</div>
                                    <div className="order-info-value address-text">{formatAddress(order.billingAddress)}</div>
                                </Col>
                                <Col md={6}>
                                    <div className="order-info-label">Dirección de Envío:</div>
                                    <div className="order-info-value address-text">{formatAddress(order.shippingAddress)}</div>
                                </Col>
                            </Row>

                            {/* Método de Envío */}
                            {order.shippingMethod && (
                                <>
                                    <h6 className="section-title">Método de Envío</h6>
                                    <div className="order-info-value">{order.shippingMethod}</div>
                                </>
                            )}

                            {/* Notas del Cliente */}
                            {order.customerNotes && (
                                <>
                                    <h6 className="section-title">Notas del Pedido</h6>
                                    <div className="order-info-value">{order.customerNotes}</div>
                                </>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Items del Pedido */}
                    {order.items && order.items.length > 0 && (
                        <Card className="mb-4 order-detail-card">
                            <Card.Header>
                                <h5 className="mb-0">Productos Pedidos</h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <ListGroup variant="flush">
                                    {order.items.map((item, index) => (
                                        <ListGroup.Item key={index} className="p-3 order-item">
                                            <Row className="align-items-center">
                                                <Col>
                                                    <div className="item-name">{item.itemName}</div>
                                                    {item.sku && (
                                                        <div className="item-details">SKU: {item.sku}</div>
                                                    )}
                                                    {item.brand && (
                                                        <div className="item-details">Marca: {item.brand}</div>
                                                    )}
                                                </Col>
                                                <Col xs="auto" className="text-end">
                                                    <div className="item-pricing">Cantidad: {item.quantity}</div>
                                                    <div className="item-pricing">Precio: ${item.unitPrice.toFixed(2)}</div>
                                                    <div className="item-total">Total: ${item.totalPrice.toFixed(2)}</div>
                                                </Col>
                                            </Row>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                {/* Resumen de Totales */}
                <Col lg={4}>
                    <Card className="mb-4 order-summary-card">
                        <Card.Header>
                            <h5 className="mb-0">Resumen de Pago</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="total-section">
                                <div className="total-row">
                                    <span>Subtotal:</span>
                                    <span>${order.subTotal.toFixed(2)}</span>
                                </div>
                                <div className="total-row">
                                    <span>Impuestos:</span>
                                    <span>${order.taxTotal.toFixed(2)}</span>
                                </div>
                                <div className="total-row">
                                    <span>Envío:</span>
                                    <span>
                                        {order.shippingTotal === 0 ? 'GRATIS' : `$${order.shippingTotal.toFixed(2)}`}
                                    </span>
                                </div>
                                {order.discountTotal > 0 && (
                                    <div className="total-row" style={{ color: '#28a745' }}>
                                        <span>Descuento:</span>
                                        <span>-${order.discountTotal.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="total-row final-total">
                                    <span>Total:</span>
                                    <span className="total-amount">${order.orderTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Acciones */}
                    <div className="d-grid gap-2 action-buttons">
                        <Button 
                            variant="outline-primary" 
                            onClick={() => navigate('/orders/my-orders')}
                        >
                            Ver Mis Pedidos
                        </Button>
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => navigate('/')}
                        >
                            <ArrowLeft className="me-2" />
                            Continuar Comprando
                        </Button>
                    </div>

                    {/* Información Adicional */}
                    <Card className="mt-4 info-card">
                        <Card.Body>
                            <h6>¿Qué sigue?</h6>
                            <ul className="small mb-0">
                                <li>Recibirás un email de confirmación</li>
                                <li>Te notificaremos cuando tu pedido sea enviado</li>
                                <li>Puedes hacer seguimiento en "Mis Pedidos"</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default OrderConfirmationPage;
