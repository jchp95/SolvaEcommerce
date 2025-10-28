import { Container, Button } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Building } from 'react-bootstrap-icons';
import "./Hero.css";
import CustomNavbar from "../navbar/Navbar";
import Search from "../search/Search";

function Hero() {
    return (
        <Container fluid className="home-container">
            {/* Hero Section (Full-width) */}
            <section className="hero-section">

                {/* Navbar */}
                <CustomNavbar />

                {/* Barra de búsqueda */}
                <Search />

                <div className="hero-content">
                    <div className="hero-main">
                        <h1 className="shimmer-text">Discover innovation</h1>
                        <p className="hero-subtitle">Selected products to transform your day to day</p>
                        
                        <div className="hero-actions">
                            <Button variant="primary" size="lg" className="cta-button primary-cta">
                                Explore products
                                <FontAwesomeIcon icon={faArrowRight} className="icons" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Sección promocional para empresas - Rediseñada */}
                    <div className="supplier-promo-section">
                        <div className="supplier-promo-card">
                            <div className="supplier-promo-icon">
                                <Building size={40} />
                            </div>
                            <div className="supplier-promo-content">
                                <h3 className="supplier-promo-title">¿Eres una empresa?</h3>
                                <p className="supplier-promo-text">Únete a nuestra plataforma y llega a miles de clientes</p>
                                <Button
                                    variant="outline-light"
                                    size="lg"
                                    className="supplier-cta-button"
                                    href="/supplier/register"
                                >
                                    Regístrate como proveedor
                                    <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Container>
    );
}

export default Hero;