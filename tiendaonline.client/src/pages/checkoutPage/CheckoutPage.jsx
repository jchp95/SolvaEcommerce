import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useCart } from '../../context/CartContext';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Spinner
} from 'react-bootstrap';
import './CheckoutPage.css';
import { useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import { formatImageUrl } from '../../utils/Images';
import { OrderService } from '../../api/endpoints/orders';
import AlertService from '../../services/AlertService';
import CheckoutForm from '../../components/Stripe/CheckoutForm';

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    // Información personal (pre-llenar con datos del usuario)
    fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    
    // Dirección de facturación
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: 'España',
    billingAdditionalInfo: '',
    
    // Dirección de envío
    sameAsBilling: true,
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: 'España',
    shippingAdditionalInfo: '',
    
    // Método de envío y pago
    shippingMethod: 'standard',
    paymentMethod: 'pending',
    
    // Notas del cliente
    customerNotes: '',
    
    // Información de tarjeta (para futuro)
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null); // Orden creada antes del pago
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (!token || !user) {
      // Si no está autenticado, redirigir al login
      alert('Debes iniciar sesión para realizar un pedido');
      navigate('/login', { state: { returnUrl: '/checkout' } });
      return;
    }
  }, [token, user, navigate]);

  // Calcular totales
  const subtotal = cartItems.reduce((sum, item) => {
    const itemTotal = item.totalPrice || (item.price * item.quantity);
    return sum + itemTotal;
  }, 0);
  
  // Sin impuestos (por ahora no se aplica IVA)
  const taxTotal = 0; // 0% de impuestos
  const shippingTotal = subtotal > 50 ? 0 : 5.99; // Envío gratis si >$50
  const total = subtotal + taxTotal + shippingTotal;

  const validateForm = () => {
    let newErrors = {};
    
    // Validación de información personal
    if (!formData.fullName.trim()) newErrors.fullName = 'El nombre completo es requerido.';
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido.';
    }
    
    // Validación de dirección de facturación
    if (!formData.billingStreet.trim()) newErrors.billingStreet = 'La dirección de facturación es requerida.';
    if (!formData.billingCity.trim()) newErrors.billingCity = 'La ciudad de facturación es requerida.';
    if (!formData.billingState.trim()) newErrors.billingState = 'El estado/provincia de facturación es requerido.';
    if (!formData.billingPostalCode.trim()) {
      newErrors.billingPostalCode = 'El código postal de facturación es requerido.';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.billingPostalCode)) {
      newErrors.billingPostalCode = 'El código postal no es válido.';
    }
    
    // Validación de dirección de envío (solo si es diferente)
    if (!formData.sameAsBilling) {
      if (!formData.shippingStreet.trim()) newErrors.shippingStreet = 'La dirección de envío es requerida.';
      if (!formData.shippingCity.trim()) newErrors.shippingCity = 'La ciudad de envío es requerida.';
      if (!formData.shippingState.trim()) newErrors.shippingState = 'El estado/provincia de envío es requerido.';
      if (!formData.shippingPostalCode.trim()) {
        newErrors.shippingPostalCode = 'El código postal de envío es requerido.';
      } else if (!/^\d{5}(-\d{4})?$/.test(formData.shippingPostalCode)) {
        newErrors.shippingPostalCode = 'El código postal de envío no es válido.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prevData) => ({ ...prevData, [name]: newValue }));
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Preparar datos para crear la orden
      const orderData = {
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerFullName: formData.fullName,
        
        billingAddress: {
          street: formData.billingStreet,
          city: formData.billingCity,
          state: formData.billingState,
          postalCode: formData.billingPostalCode,
          country: formData.billingCountry,
          additionalInfo: formData.billingAdditionalInfo
        },
        
        shippingAddress: formData.sameAsBilling ? {
          street: formData.billingStreet,
          city: formData.billingCity,
          state: formData.billingState,
          postalCode: formData.billingPostalCode,
          country: formData.billingCountry,
          additionalInfo: formData.billingAdditionalInfo
        } : {
          street: formData.shippingStreet,
          city: formData.shippingCity,
          state: formData.shippingState,
          postalCode: formData.shippingPostalCode,
          country: formData.shippingCountry,
          additionalInfo: formData.shippingAdditionalInfo
        },
        
        shippingMethod: formData.shippingMethod,
        paymentMethod: formData.paymentMethod,
        customerNotes: formData.customerNotes
      };

      // Crear la orden en el backend
      const response = await OrderService.createFromCart(orderData);
      
      if (response && response.success) {
        // Mostrar formulario de pago con los datos de la orden
        setPaymentOrder(response.data);
        setShowPaymentForm(true);

        // No limpiar el carrito hasta que el pago sea exitoso
        // Navegación posterior al pago
      } else {
        throw new Error(response?.message || 'Error creando la orden');
      }
      
    } catch (error) {
      console.error('Error al crear la orden:', error);
      await AlertService.error({
        title: 'Error al procesar el pedido',
        text: error.response?.data?.message || error.message || 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
        confirmButtonText: 'Intentar de nuevo'
      });
    } finally {
      setIsLoading(false);
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
                        <div className="text-muted small justify-content-start mb-0">Precio: ${item.price?.toFixed(2) || '0.00'}</div>
                      </Col>
                      <Col xs="auto" className="text-end">
                        <div className="fw-bold text-light small">
                          ${(item.totalPrice || (item.price * item.quantity)).toFixed(2)}
                        </div>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}

                {/* Desglose de totales */}
                <ListGroup.Item className="d-flex justify-content-between align-items-center bg-transparent border-0 text-light">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center bg-transparent border-0 text-light">
                  <span>Impuestos (0%):</span>
                  <span>${taxTotal.toFixed(2)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center bg-transparent border-0 text-light">
                  <span>Envío:</span>
                  <span>{shippingTotal === 0 ? 'GRATIS' : `$${shippingTotal.toFixed(2)}`}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center bg-transparent border-top text-light">
                  <span className="fw-bold fs-5">Total:</span>
                  <span className="checkout-total fw-bold fs-5">${total.toFixed(2)}</span>
                </ListGroup.Item>
              </ListGroup>

              <Button
                variant="primary"
                onClick={() => navigate('/', { state: { openCart: true } })}
                className="w-100 mt-3 checkout-button"
              >
                Volver al Carrito
              </Button>

              {/* Mostrar el formulario de Stripe en la columna izquierda (debajo del resumen del pedido) */}
              {showPaymentForm && paymentOrder && (
                (() => {
                  const stripeKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY : undefined;
                  if (!stripeKey) {
                    return (
                      <div className="mt-4">
                        <h5 className="text-light mb-3">Pagar con tarjeta</h5>
                        <div className="alert alert-warning">Stripe no está configurado en el entorno. Añade <code>VITE_STRIPE_PUBLISHABLE_KEY</code> en tu .env para habilitar pagos con tarjeta.</div>
                      </div>
                    )
                  }

                  return (
                    <div className="mt-4">
                      <h5 className="text-light mb-3">Pagar con tarjeta</h5>
                      <CheckoutForm
                        orderId={paymentOrder.id}
                        supplierId={cartItems[0]?.supplierId || paymentOrder.items?.[0]?.supplierId || 1}
                        amount={paymentOrder.orderTotal || total}
                        email={formData.email}
                        name={formData.fullName}
                        onSuccess={async (paymentResponse) => {
                          await clearCart();
                          await AlertService.success({
                            title: 'Pago realizado',
                            html: `<p>Transacción: ${paymentResponse.data?.transactionId || paymentResponse.transactionId || ''}</p>`,
                            timer: 2000
                          });
                          navigate('/order-confirmation', { state: { order: paymentOrder, payment: paymentResponse.data || paymentResponse } });
                        }}
                        onError={(err) => {
                          console.error('Pago fallido', err);
                          AlertService.error({ title: 'Pago fallido', text: err?.message || 'No se pudo procesar el pago' });
                        }}
                      />
                    </div>
                  )
                })()
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Formulario de Checkout */}
        <Col md={6}>
          <Card className="mb-4 checkout-subcard">
            <Card.Body>
              <Card.Title className="mb-3">Información de Envío y Pago</Card.Title>

              <Form onSubmit={handleSubmit}>
                {/* Información Personal */}
                <Card className="mb-4 checkout-subcard">
                  <Card.Body>
                    <Card.Title as="h5" className="mb-3">Información Personal</Card.Title>
                    {renderInputField('fullName', 'Nombre Completo')}
                    {renderInputField('email', 'Correo Electrónico', 'email')}
                    {renderInputField('phone', 'Teléfono', 'tel')}
                  </Card.Body>
                </Card>

                {/* Dirección de Facturación */}
                <Card className="mb-4 checkout-subcard">
                  <Card.Body>
                    <Card.Title as="h5" className="mb-3">Dirección de Facturación</Card.Title>
                    {renderInputField('billingStreet', 'Dirección')}
                    <Row>
                      <Col md={6}>
                        {renderInputField('billingCity', 'Ciudad')}
                      </Col>
                      <Col md={6}>
                        {renderInputField('billingState', 'Estado/Provincia')}
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        {renderInputField('billingPostalCode', 'Código Postal')}
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Control
                            className="checkout-form-control"
                            type="text"
                            name="billingCountry"
                            value={formData.billingCountry}
                            onChange={handleChange}
                            readOnly
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    {renderInputField('billingAdditionalInfo', 'Información adicional (opcional)')}
                  </Card.Body>
                </Card>

                {/* Dirección de Envío */}
                <Card className="mb-4 checkout-subcard">
                  <Card.Body>
                    <Card.Title as="h5" className="mb-3">Dirección de Envío</Card.Title>

                    <Form.Check
                      type="checkbox"
                      id="sameAsBilling"
                      name="sameAsBilling"
                      label="Usar la misma dirección de facturación"
                      checked={formData.sameAsBilling}
                      onChange={handleChange}
                      className="mb-3 text-light"
                    />

                    {!formData.sameAsBilling && (
                      <>
                        {renderInputField('shippingStreet', 'Dirección de envío')}
                        <Row>
                          <Col md={6}>
                            {renderInputField('shippingCity', 'Ciudad')}
                          </Col>
                          <Col md={6}>
                            {renderInputField('shippingState', 'Estado/Provincia')}
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            {renderInputField('shippingPostalCode', 'Código Postal')}
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Control
                                className="checkout-form-control"
                                type="text"
                                name="shippingCountry"
                                value={formData.shippingCountry}
                                onChange={handleChange}
                                readOnly
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        {renderInputField('shippingAdditionalInfo', 'Información adicional (opcional)')}
                      </>
                    )}
                  </Card.Body>
                </Card>

                {/* Método de Envío */}
                <Card className="mb-4 checkout-subcard">
                  <Card.Body>
                    <Card.Title as="h5" className="mb-3">Método de Envío</Card.Title>
                    <Form.Group className="mb-3">
                      <Form.Select
                        className="checkout-form-control"
                        name="shippingMethod"
                        value={formData.shippingMethod}
                        onChange={handleChange}
                      >
                        <option value="standard">Envío Estándar (5-7 días) - {subtotal > 50 ? 'GRATIS' : '$5.99'}</option>
                        <option value="express">Envío Express (2-3 días) - $12.99</option>
                        <option value="overnight">Envío Nocturno (1 día) - $24.99</option>
                      </Form.Select>
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* Notas del Cliente */}
                <Card className="mb-4 checkout-subcard">
                  <Card.Body>
                    <Card.Title as="h5" className="mb-3">Notas del Pedido (Opcional)</Card.Title>
                    <Form.Group className="mb-3">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        className="checkout-form-control"
                        name="customerNotes"
                        placeholder="Instrucciones especiales para el envío..."
                        value={formData.customerNotes}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 checkout-button"
                  disabled={isLoading || cartItems.length === 0 || showPaymentForm}
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Procesando pedido...
                    </>
                  ) : showPaymentForm ? (
                    'Pago pendiente: complete el formulario de tarjeta abajo'
                  ) : (
                    `Confirmar Pedido - $${total.toFixed(2)}`
                  )}
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
