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
    faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import {
    faGoogle,
    faFacebook
} from '@fortawesome/free-brands-svg-icons';
import '../login/LoginPage.css';

const RegisterPage = ({ onRegister, onNavigate }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const validateForm = () => {
        let newErrors = {};
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required.';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email address is not valid.';
        }
        if (!formData.password.trim()) {
            newErrors.password = 'Password is required.';
        } else if (formData.password.length < 6) {
            newErrors.password = 'The password must be at least 6 characters long.';
        }
        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Confirm password is required.';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsSubmitting(true);
            // Simulamos un retraso en el registro
            await new Promise(resolve => setTimeout(resolve, 1000));

            setShowSuccess(true);
            setIsSubmitting(false);

            // Simulamos el registro exitoso
            setTimeout(() => {
                onRegister();
            }, 1500);
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
                            <h2 className="gradient-texts">Create Account</h2>
                        </Row>
                    </Card.Header>
                    <Col>
                        <p className="text-muted">Please, fill in your information to register</p>
                    </Col>

                    {/* Formulario */}
                    <Form onSubmit={handleSubmit} className="login-form flex-grow-1">
                        {showSuccess && (
                            <Row className="mb-3">
                                <Col>
                                    <Alert variant="success" className="shake-animation">
                                        User {formData.fullName} registered successfully!
                                    </Alert>
                                </Col>
                            </Row>
                        )}

                        <Row className="mb-3">
                            <Col>
                                <Form.Group className={errors.fullName ? 'has-error' : ''}>
                                    <Form.Label>Full Name</Form.Label>
                                    <InputGroup className="input-group-dark">
                                        <InputGroup.Text>
                                            <FontAwesomeIcon icon={faUser} className='icons' />
                                        </InputGroup.Text>
                                        <FormControl
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            placeholder="Your Full Name"
                                            isInvalid={!!errors.fullName}
                                            className="input-dark"
                                        />
                                    </InputGroup>
                                    {errors.fullName && (
                                        <Form.Text className="text-danger">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className='icons' />
                                            {errors.fullName}
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <Form.Group className={errors.email ? 'has-error' : ''}>
                                    <Form.Label><FontAwesomeIcon icon={faEnvelope} className='icons' />Email</Form.Label>
                                    <InputGroup className="input-group-dark">
                                        <InputGroup.Text>
                                            <FontAwesomeIcon icon={faEnvelope} className='icons' />
                                        </InputGroup.Text>
                                        <FormControl
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="tu@ejemplo.com"
                                            isInvalid={!!errors.email}
                                            className="input-dark"
                                        />
                                    </InputGroup>
                                    {errors.email && (
                                        <Form.Text className="text-danger">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className='icons' />
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
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            isInvalid={!!errors.password}
                                            className="input-dark"
                                        />
                                    </InputGroup>
                                    {errors.password && (
                                        <Form.Text className="text-danger">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className='icons' />
                                            {errors.password}
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <Form.Group className={errors.confirmPassword ? 'has-error' : ''}>
                                    <Form.Label>Confirm Password</Form.Label>
                                    <InputGroup className="input-group-dark">
                                        <InputGroup.Text>
                                            <FontAwesomeIcon icon={faLock} className='icons' />
                                        </InputGroup.Text>
                                        <FormControl
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            isInvalid={!!errors.confirmPassword}
                                            className="input-dark"
                                        />
                                    </InputGroup>
                                    {errors.confirmPassword && (
                                        <Form.Text className="text-danger">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className='icons' />
                                            {errors.confirmPassword}
                                        </Form.Text>
                                    )}
                                </Form.Group>
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
                                            <FontAwesomeIcon icon={faUserPlus} className='icons' />
                                            Register
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <div className="divider-with-text">
                                    <span>or register with</span>
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
                    <Row className="login-footer">
                        <Col className="text-center">
                            <p className="text-muted mb-0">
                                Already have an account?{' '}
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate('login');
                                    }}
                                    className="register-link p-0 text-decoration-none"
                                >
                                    Sign in
                                </a>
                            </p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RegisterPage;