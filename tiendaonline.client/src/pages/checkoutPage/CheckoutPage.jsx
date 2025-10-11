import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Alert
} from 'react-bootstrap';
import './CheckoutPage.css';
import { useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import { formatImageUrl } from '../../utils/Images';

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const [errors, setErrors] = useState({});

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'El nombre completo es requerido.';
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido.';
    }
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida.';
    if (!formData.city.trim()) newErrors.city = 'La ciudad es requerida.';
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'El código postal es requerido.';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'El código postal no es válido.';
    }
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'El número de tarjeta es requerido.';
    } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'El número de tarjeta debe tener 16 dígitos.';
    }
    if (!formData.cardName.trim()) newErrors.cardName = 'El nombre en la tarjeta es requerido.';
    if (!formData.expiryDate.trim()) {
      newErrors.expiryDate = 'La fecha de vencimiento es requerida.';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Formato de fecha inválido (MM/AA).';
    }
    if (!formData.cvv.trim()) {
      newErrors.cvv = 'El CVV es requerido.';
    } else if (!/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = 'El CVV debe tener 3 o 4 dígitos.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const order = {
        customer: formData,
        products: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl
        })),
        total: total,
        date: new Date().toISOString(),
        status: 'Completado'
      };
      await clearCart();
      navigate('/orders', {
        state: {
          order,
          successMessage: '¡Tu pedido fue realizado con éxito!',
        }
      }); // redirección con datos
    } else {
      alert('Por favor, corrige los errores en el formulario.');
    }
  };

  const renderInputField = (name, placeholder, type = 'text') => (
    <Form.Group className="mb-3" controlId={name}>
      <Form.Control
        className="checkout-form-control"
        type={type}
        name={name}
        placeholder={placeholder}
        value={formData[name]}
        onChange={handleChange}
        isInvalid={!!errors[name]}
      />
      <Form.Control.Feedback type="invalid">
        {errors[name]}
      </Form.Control.Feedback>
    </Form.Group>
  );

  return (
    <Container fluid className="checkout-page">
      <h2 className="checkout-title">Procesar Pago</h2>
      <Row className="g-4">
        <Col md={6}>
          <Card className="mb-4 checkout-subcard">
            <Card.Body>
              <Card.Title className="mb-3">Resumen del Pedido</Card.Title>
              <ListGroup variant="flush">
                {cartItems.map((item) => (
                  <ListGroup.Item
                    key={item.id}
                    className="checkout-summary-item bg-dark bg-opacity-10 border-0 rounded mb-2 px-2 py-2"
                  >
                    <Row className="align-items-center g-2">
                      <Col xs="auto">
                        <Image
                          src={formatImageUrl(item.imageUrl) || '/placeholder.png'}
                          alt={item.name}
                          rounded
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            border: '1px solid #2c2c2c',
                            backgroundColor: '#1e1e27'
                          }}
                          onError={(e) => {
                            if (e.target.src !== window.location.origin + '/placeholder.png') {
                              e.target.src = '/placeholder.png';
                            }
                          }}

                        />
                      </Col>
                      <Col className="d-flex flex-column justify-content-center ps-2">
                        <div className="fw-semibold text-light small">{item.name}</div>
                        <div className="text-muted small justify-content-start mb-0">Cantidad: {item.quantity}</div>
                        <div className="text-muted small justify-content-start mb-0">Precio: {item.price}</div>
                      </Col>
                      <Col xs="auto" className="text-end">
                        <div className="fw-bold text-light small">${(item.price * item.quantity).toFixed(2)}</div>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}

                <ListGroup.Item className="d-flex justify-content-between align-items-center bg-transparent border-top text-light">
                  <span className="fw-bold">Total:</span>
                  <span className="checkout-total">${total.toFixed(2)}</span>
                </ListGroup.Item>
              </ListGroup>

              <Button
                variant="primary"
                onClick={() => navigate('/', { state: { openCart: true } })}
                className="w-100 mt-3 checkout-button"
              >
                Volver al Carrito
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Formulario de Pago */}
        <Col md={6}>
          <Card className="mb-4 checkout-subcard">
            <Card.Body>
              <Card.Title className="mb-3">Información de Envío y Pago</Card.Title>
              <Form onSubmit={handleSubmit}>
                {/* Información de Envío */}
                <Card className="mb-4 checkout-subcard">
                  <Card.Body>
                    <Card.Title as="h5" className="mb-3">Dirección de Envío</Card.Title>
                    {renderInputField('fullName', 'Nombre Completo')}
                    {renderInputField('email', 'Correo Electrónico', 'email')}
                    {renderInputField('address', 'Dirección')}
                    <Row>
                      <Col md={6}>
                        {renderInputField('city', 'Ciudad')}
                      </Col>
                      <Col md={6}>
                        {renderInputField('zipCode', 'Código Postal')}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Información de Pago */}
                <Card className="mb-4 checkout-subcard">
                  <Card.Body>
                    <Card.Title as="h5" className="mb-3">Detalles de la Tarjeta</Card.Title>
                    {renderInputField('cardNumber', 'Número de Tarjeta')}
                    {renderInputField('cardName', 'Nombre en la Tarjeta')}
                    <Row>
                      <Col md={6}>
                        {renderInputField('expiryDate', 'Fecha de Vencimiento (MM/AA)')}
                      </Col>
                      <Col md={6}>
                        {renderInputField('cvv', 'CVV')}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Button variant="primary" type="submit" className="w-100 checkout-button">
                  Confirmar Pedido
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;