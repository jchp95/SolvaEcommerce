/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CartSidebar from "../../components/sidebar/CartSidebar";
import Card from "../../components/card/Card";
import Footer from "../../components/footer/Footer";
import Hero from "../../components/heroSection/Hero";
import CategoriesSidebar from "../../components/sidebar/CategoriesSidebar";
import "./Home.css";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Button, Col, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useProducts } from "../../features/products/hooks/useProducts";
import { useSpinner } from "../../context/SpinnerContext";

function Home() {
    const [cartOpen, setCartOpen] = useState(false);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { showSpinner, hideSpinner } = useSpinner();
    const { products, isLoading, error } = useProducts();

    const openCart = () => setCartOpen(true);
    // Función para cerrar el carrito
    const closeCart = () => setCartOpen(false);

    // Efecto para abrir el carrito automáticamente si viene desde checkout
    useEffect(() => {
        if (location.state?.openCart) {
            setCartOpen(true);
            // Limpiar el state para evitar que se abra cada vez que se visite la página
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    useEffect(() => {
        if (isLoading) {
            showSpinner();
            return () => hideSpinner();
        } else {
            hideSpinner();
        }
    }, [isLoading, showSpinner, hideSpinner]);

    const handleNavigate = (category) => {
        console.log("Categoría seleccionada:", category);
        if (category === 'electronics') navigate('/electronics');
        else if (category === 'books') navigate('/books');
        setCategoriesOpen(false);
    };

    // Variantes de animación
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    const sectionVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    return (
        <div className="home-container">
            <CategoriesSidebar
                isOpen={categoriesOpen}
                onClose={() => setCategoriesOpen(false)}
                onNavigate={handleNavigate}
            />

            <Hero />

            <Container className="container-home">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                    variants={sectionVariants}
                >
                    <Row className="justify-content-center">
                        <Col xs={12} className="text-center">
                            <h2 className="title-section-products">Best selling products</h2>
                            <p className="list-category mb-4">
                                Electronics - Fashion - Home - Sports - Beauty and Personal Care -
                                Books and Office - Supermarket
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                className="cta-button"
                                onClick={() => setCategoriesOpen(true)}
                            >
                                View Categories
                                <FontAwesomeIcon icon={faPlus} className="ms-2" />
                            </Button>
                        </Col>
                    </Row>
                </motion.div>

                {/* Sección de productos dinámicos */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                    variants={containerVariants}
                >
                    <Row className="mt-1">
                        {products && products.length > 0 ? (
                            products.map(product => (
                                <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                                    <Card
                                        product={product}
                                        onAddToCartSuccess={openCart} // <-- pasar la función para abrir carrito
                                    />
                                </Col>
                            ))
                        ) : (
                            <Col>No hay productos</Col>
                        )}
                    </Row>

                    {/* Componente global del carrito */}
                    <CartSidebar
                        isOpen={cartOpen}
                        onClose={closeCart}
                        onCheckout={() => {
                            // lógica para finalizar compra
                            closeCart();
                        }}
                    />

                </motion.div>
            </Container>

            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                transition={{ duration: 0.8 }}
            >
                <Footer />
            </motion.div>
        </div>
    );
}

export default Home;