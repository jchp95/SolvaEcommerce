import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { formatImageUrl } from '../../utils/Images';
import {
  Container,
  Row,
  Col,
  Card,
  ListGroup,
  Badge,
  Alert
} from 'react-bootstrap';
import '../checkoutPage/CheckoutPage.css';

const Orders = () => {
  const { state } = useLocation();
  const [completedOrders, setCompletedOrders] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (state?.order) {
      setCompletedOrders([state.order]);
    }
    if (state?.successMessage) {
      setSuccessMessage(state.successMessage);

      // Limpiar mensaje después de unos segundos
      const timeout = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  return (
    <Container fluid className="checkout-page">
      <h2 className="checkout-title mb-4">Mis Pedidos</h2>

      {/* Mensaje de éxito */}
      {successMessage && (
        <Alert variant="success" className="text-center fw-bold">
          {successMessage}
        </Alert>
      )}

      {completedOrders.length === 0 ? (
        <Card className="checkout-subcard p-4 text-center">
          <p className="text-light">Aún no has realizado ningún pedido.</p>
        </Card>
      ) : (
        completedOrders.map((order, index) => (
          <Card key={index} className="mb-5 checkout-subcard shadow-lg">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-light">Pedido #{order.orderId || index + 1}</h5>
              <Badge bg="success" pill>{order.status}</Badge>
            </Card.Header>

            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="text-light mb-3">Información del Cliente</h6>
                  <p className="mb-1 text-light"><strong>Nombre y Apellidos:</strong> {order.customer?.fullName}</p>
                  <p className="mb-1 text-light"><strong>Correo:</strong> {order.customer?.email}</p>
                  <p className="mb-1 text-light">
                    <strong>Dirección:</strong> {order.customer?.address}, {order.customer?.city}, {order.customer?.zipCode}
                  </p>
                </Col>
                <Col md={6} className="text-md-end text-light">
                  <h6 className="mb-3">Fecha del Pedido</h6>
                  <p>{new Date(order.date).toLocaleString()}</p>
                </Col>
              </Row>

              <h6 className="text-light mb-3">Productos Comprados</h6>
              <ListGroup variant="flush" className="mb-4">
                {order.products?.map((product, idx) => (
                  <ListGroup.Item
                    key={idx}
                    className="bg-dark bg-opacity-25 mb-3 rounded p-3"
                  >
                    <Row className="align-items-center">
                      {/* Imagen */}
                      <Col xs={2} md={1}>
                        {product.imageUrl ? (
                          <img
                            src={formatImageUrl(product.imageUrl) || '/placeholder.png'}
                            alt={product.name}
                            className="img-fluid rounded border"
                            style={{ maxHeight: '80px', objectFit: 'cover' }}
                            onError={(e) => {
                              if (e.target.src !== window.location.origin + '/placeholder.png') {
                                e.target.src = '/placeholder.png';
                              }
                            }}
                          />
                        ) : (
                          <div
                            className="bg-secondary rounded"
                            style={{ width: '80px', height: '80px' }}
                          ></div>
                        )}
                      </Col>

                      {/* Detalles del producto */}
                      <Col xs={6} md={5} className="d-flex flex-column justify-content-center">
                        <div className="text-light fw-semibold mb-1">{product.name}</div>
                        <div className="text-muted small justify-content-start mb-1">Cantidad: {product.quantity}</div>
                        <div className="text-muted small justify-content-start mb-1">Precio: ${(product.price).toFixed(2)}</div>
                      </Col>

                      {/* Precio total */}
                      <Col xs={3} md={6} className="text-end">
                        <div className="text-light fw-bold fs-6">
                          ${(product.price * product.quantity).toFixed(2)}
                        </div>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>

            </Card.Body>

            <Card.Footer className="d-flex justify-content-between align-items-center bg-transparent border-top-0 px-4 py-3">
              <strong className="text-light fs-5">Total del Pedido:</strong>
              <strong className="text-light fs-5">
                ${typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}
              </strong>
            </Card.Footer>
          </Card>
        ))
      )}
    </Container>
  );
};

export default Orders;
