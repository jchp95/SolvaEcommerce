import { useState } from 'react';
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
  InputGroup,
  FormControl,
  FormCheck
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faLock,
  faExclamationTriangle,
  faInfoCircle,
  faSignInAlt
} from '@fortawesome/free-solid-svg-icons';
import {
  faGoogle,
  faFacebook
} from '@fortawesome/free-brands-svg-icons';
import './LoginPage.css';

const LoginPage = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateForm = () => {
    let newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is not valid.';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'The password must be at least 6 characters long.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'email') setEmail(value);
    if (id === 'password') setPassword(value);
    setErrors((prevErrors) => ({ ...prevErrors, [id]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      // Simulamos un retraso en la autenticación
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (email === 'test@example.com' && password === 'password') {
        onLogin();
      } else {
        setErrors({ general: 'Credenciales incorrectas. Usa test@example.com / password' });
      }
      setIsSubmitting(false);
    }
  };

  return (
    <Container fluid className="login-container">
      <Card className="login-card glassmorphism-effect">
        <Card.Body className="d-flex flex-column">
          {/* Header */}
          <Card.Header className='card-header'>
            <Row className="app-logo">
              <FontAwesomeIcon icon={faUser} size="2x" color="#4361ee" />
            </Row>
            <Row>
              <h2 className="gradient-texts">Welcome</h2>
            </Row>
          </Card.Header>
          <Col>
            <p className="text-muted">Please, enter your credentials to continue</p>
          </Col>

          {/* Formulario */}
          <Form onSubmit={handleSubmit} className="login-form flex-grow-1">
            {errors.general && (
              <Row className="mb-3">
                <Col>
                  <Alert variant="danger" className="shake-animation">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    {errors.general}
                  </Alert>
                </Col>
              </Row>
            )}

            <Row className="mb-3">
              <Col>
                <Form.Group className={errors.email ? 'has-error' : ''}>
                  <Form.Label> Email</Form.Label>
                  <InputGroup className="input-group-dark">
                    <InputGroup.Text>
                      <FontAwesomeIcon icon={faEnvelope} className='icons' />
                    </InputGroup.Text>
                    <FormControl
                      type="email"
                      id="email"
                      value={email}
                      onChange={handleChange}
                      placeholder="tu@ejemplo.com"
                      isInvalid={!!errors.email}
                      className="input-dark"
                    />
                  </InputGroup>
                  {errors.email && (
                    <Form.Text className="text-danger">
                      <FontAwesomeIcon icon={faInfoCircle} className='icons' />
                      {errors.email}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Group className={errors.password ? 'has-error' : ''}>
                  <Form.Label>Password</Form.Label>
                  <InputGroup className="input-group-dark">
                    <InputGroup.Text>
                      <FontAwesomeIcon icon={faLock} className='icons' />
                    </InputGroup.Text>
                    <FormControl
                      type="password"
                      id="password"
                      value={password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      isInvalid={!!errors.password}
                      className="input-dark"
                    />
                  </InputGroup>
                  {errors.password && (
                    <Form.Text className="text-danger">
                      <FontAwesomeIcon icon={faInfoCircle} className='icons' />
                      {errors.password}
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3 align-items-center">
              <Col xs={6}>
                <FormCheck
                  type="checkbox"
                  id="remember"
                  label="Remember me"
                  className="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              </Col>
            </Row>

            <Row className="mb-3">
              <Col className='container-login-button'>
                <Button
                  variant="primary"
                  type="submit"
                  className={`w-100 login-button ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSignInAlt} className='icons' />
                      Login
                    </>
                  )}
                </Button>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <div className="divider-with-text">
                  <span>or continue with</span>
                </div>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col>
                <div className="social-login-buttons d-flex gap-3">
                  <Button variant="outline-light" className="social-button flex-grow-1">
                    <FontAwesomeIcon icon={faGoogle} className='icons' /> Google
                  </Button>
                  <Button variant="outline-light" className="social-button flex-grow-1">
                    <FontAwesomeIcon icon={faFacebook} className='icons' /> Facebook
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>

          {/* Footer */}
          <Col className="login-footer">
            {/* Primera fila */}
            <div className="text-center mb-2">
              <p className="text-muted mb-0">
                Don't you have an account?{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('register');
                  }}
                  className="register-link p-0 text-decoration-none"
                >
                  Sign up
                </a>
              </p>
            </div>

            {/* Segunda fila */}
            <div className="forgot-password text-center">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('forgotPassword');
                }}
                className="forgot-password p-0 text-decoration-none"
              >
                Did you forget your password?
              </a>
            </div>
          </Col>
        </Card.Body>
      </Card>
    </Container >
  );
};

export default LoginPage;