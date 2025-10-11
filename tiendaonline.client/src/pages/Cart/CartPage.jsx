import React from 'react';
import { Container, Row, Col, Card, Button, Image, ListGroup, ListGroupItem } from 'react-bootstrap';

const CartPage = ({ cartItems, onRemoveFromCart, onCheckout }) => {
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const total = safeCartItems.reduce((sum, item) => sum + (item?.price || 0), 0);

  return (
    <Container fluid className="p-4 bg-light min-vh-100">
      <h2 className="h2 fw-bold text-dark mb-4">Tu Carrito de Compras</h2>
      {safeCartItems.length === 0 ? (
        <p className="text-muted">Tu carrito está vacío. ¡Añade algunos productos!</p>
      ) : (
        <Row>
          <Col md={8} className="mb-3 mb-md-0">
            <Card className="shadow-sm">
              <Card.Body>
                <ListGroup variant="flush">
                  {safeCartItems.map((item) => (
                    <ListGroupItem key={item?.id || Math.random()} className="py-3 border-bottom">
                      <Row className="align-items-center">
                        <Col xs={3} md={2}>
                          <Image src={item?.image} alt={item?.name} fluid rounded className="w-100" />
                        </Col>
                        <Col xs={6} md={8}>
                          <h5 className="mb-1">{item?.name || 'Producto sin nombre'}</h5>
                          <p className="text-muted mb-0">${(item?.price || 0).toFixed(2)}</p>
                        </Col>
                        <Col xs={3} className="text-end">
                          <Button
                            variant="link"
                            onClick={() => onRemoveFromCart(item?.id)}
                            className="text-danger p-0"
                          >
                            Eliminar
                          </Button>
                        </Col>
                      </Row>
                    </ListGroupItem>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="h4 fw-bold mb-3">Resumen del Pedido</Card.Title>
                <ListGroup variant="flush" className="mb-3">
                  <ListGroupItem className="d-flex justify-content-between">
                    <span>Subtotal ({safeCartItems.length} productos):</span>
                    <span>${total.toFixed(2)}</span>
                  </ListGroupItem>
                  <ListGroupItem className="d-flex justify-content-between fw-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </ListGroupItem>
                </ListGroup>
                <Button
                  variant="primary"
                  onClick={onCheckout}
                  className="w-100 py-2 fw-bold"
                >
                  Proceder al Pago
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default CartPage;