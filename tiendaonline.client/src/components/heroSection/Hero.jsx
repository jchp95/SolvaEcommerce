import { Container, Button } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
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
                    <h1 className="shimmer-text">Discover innovation</h1>
                    <p className="lead">Selected products to transform your day to day</p>
                    <Button variant="primary" size="lg" className="cta-button">
                        Explore products
                        <FontAwesomeIcon icon={faArrowRight} className="icons" />
                    </Button>
                </div>
            </section>
        </Container>
    );
}

export default Hero;