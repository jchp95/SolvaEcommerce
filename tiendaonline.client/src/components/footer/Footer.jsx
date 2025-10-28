import { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaStore, FaEnvelope, FaPhone } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteSettings } from '../../features/reduxSlices/siteSettings/siteSettingsSlice';
import './Footer.css';
import { Link } from 'react-router-dom';

function Footer() {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useDispatch();
    const store = useSelector(state => state.siteSettings);
    const { data: siteSettings } = useSelector(state => state.siteSettings);

    const [formData, setFormData] = useState({
            siteName: '',
            email: '',
            phoneNumber: '',
            facebookUrl: '',
            instagramUrl: '',
            twitterUrl: ''
        });

     useEffect(() => {
        dispatch(fetchSiteSettings());
    }, [dispatch]);

    useEffect(() => {
        
        if (siteSettings) {
            setFormData({
                siteName: siteSettings.siteName || '',
                email: siteSettings.email || '',
                phoneNumber: siteSettings.phoneNumber || '',
                facebookUrl: siteSettings.facebookUrl || '',
                instagramUrl: siteSettings.instagramUrl || '',
                twitterUrl: siteSettings.twitterUrl || '',
            });
        }
    }, [siteSettings]);    

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
          
            setShowSuccess(true);
            reset();
            setTimeout(() => setShowSuccess(false), 5000);
        } catch (error) {
            console.error("Error al enviar el formulario:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <footer className="site-footer">
            <Container>
                {/* Fila principal con 3 columnas */}
                <Row className="footer-main-content">
                    {/* Columna 1 - Información */}
                    <Col lg={4} md={6} className="footer-section">
                        <div className="footer-brand">
                            <FaStore className="brand-icon" />
                            <span className="brand-name">{formData.siteName}</span>
                        </div>
                        <p className="footer-description">
                            Your destination for online shopping with the best products and services.
                        </p>
                        <div className="contact-info">
                            <div className="contact-item">
                                <FaEnvelope className="contact-icon" />
                                <span>{formData.email}</span>
                            </div>
                            <div className="contact-item">
                                <FaPhone className="contact-icon" />
                                <span>{formData.phoneNumber}</span>
                            </div>
                        </div>
                    </Col>

                    {/* Columna 2 - Enlaces rápidos y Company */}
                    <Col lg={4} md={6} className="footer-section">
                        <Row>
                            <Col sm={6}>
                                <h3 className="section-title">Explore</h3>
                                <ul className="footer-menu">
                                    <li><a href="/">Home</a></li>
                                    <li><a href="/products">Products</a></li>
                                    <li><a href="/categories">Categoríes</a></li>
                                    <li><a href="/offers">Offers</a></li>
                                </ul>
                            </Col>
                            <Col sm={6}>
                                <h3 className="section-title">Company</h3>
                                <ul className="footer-menu">
                                    <li><a href="/about">About Us</a></li>
                                    <li><a href="/blog">Blog</a></li>
                                    <li><a href="/contact">Contact</a></li>
                                </ul>
                            </Col>
                        </Row>
                    </Col>

                    {/* Columna 3 - Formulario */}
                    <Col lg={4} md={12} className="footer-section">
                        <h3 className="section-title">Do you want to sell with us?</h3>
                        <p className="form-description">
                            Join our platform and reach thousands of customers.
                        </p>

                        {showSuccess && (
                            <Alert
                                variant="success"
                                onClose={() => setShowSuccess(false)}
                                dismissible
                                className="custom-alert"
                                closeVariant="white"
                            >
                                <div className="alert-content">
                                    <svg className="alert-icon" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                                    </svg>
                                    <div>
                                        <h5 className="alert-title">¡Solicitud recibida!</h5>
                                        <p className="alert-text">Gracias por tu interés. Nos pondremos en contacto contigo pronto.</p>
                                    </div>
                                </div>
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit(onSubmit)} className="vendor-form">
                            <Row>
                                <Col className="form-group">
                                    <Form.Control
                                        type="text"
                                        placeholder="Name"
                                        {...register("name", { required: "Name required " })}
                                        className={errors.name ? 'is-invalid' : ''}
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                                </Col>
                                <Col className="form-group">
                                    <Form.Control
                                        type="email"
                                        placeholder="Email"
                                        {...register("email", {
                                            required: "Email required",
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Invalid email"
                                            }
                                        })}
                                        className={errors.email ? 'is-invalid' : ''}
                                    />
                                    {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                                </Col>
                            </Row>
                            <Form.Group className="form-group">
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Tell us about your business"
                                    {...register("message", {
                                        required: "Message required",
                                        minLength: {
                                            value: 30,
                                            message: "Minimum 30 characters"
                                        }
                                    })}
                                    className={errors.message ? 'is-invalid' : ''}
                                />
                                {errors.message && <div className="invalid-feedback">{errors.message.message}</div>}
                            </Form.Group>
                            <Button
                                variant="primary"
                                type="submit"
                                className="submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send request'}
                            </Button>
                        </Form>
                    </Col>
                </Row>

                <div className="footer-divider"></div>

                <Row className="footer-bottom">
                    <Col md={6} className="copyright">
                        <p>© {new Date().getFullYear()} {formData.siteName}. ALL RIGHTS RESERVED.</p>
                    </Col>
                    <Col md={6} className="social-links">
                        <Link to={formData.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF /></Link>
                        <Link to={formData.twitterUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></Link>
                        <Link to={formData.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></Link>
                       {/*<Link to="#" aria-label="LinkedIn"><FaLinkedinIn /></Link> */} 
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}

export default Footer;