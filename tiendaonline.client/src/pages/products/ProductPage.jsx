import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Spinner, Button, Alert } from "react-bootstrap";
import "./ProductPage.css";

function ProductPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/products/${slug}`);
                if (!response.ok) throw new Error("Product not found");
                const data = await response.json();
                setProduct(data);

                // Fetch related products
                if (data.category) {
                    const relatedResponse = await fetch(`/api/products/related/${data.category}`);
                    const relatedData = await relatedResponse.json();
                    setRelatedProducts(relatedData.slice(0, 4));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [slug]);

    if (isLoading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" />
                <p>Loading product...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5 text-center">
                <Alert variant="danger">{error}</Alert>
                <Button variant="primary" onClick={() => navigate("/")}>
                    Go Back Home
                </Button>
            </Container>
        );
    }

    if (!product) {
        return null;
    }

    return (
        <Container className="my-5">
            <Row>
                <Col md={6}>
                    <div className="product-image-container mb-4">
                        <img
                            src={product.image || '/placeholder-product.png'}
                            alt={product.title}
                            className="img-fluid rounded"
                            onError={(e) => e.target.src = '/placeholder-product.png'}
                        />
                    </div>
                </Col>
                <Col md={6}>
                    <h1>{product.title}</h1>
                    <div className="mb-3">
                        <span className="text-primary fs-3 fw-bold">
                            {product.price?.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            })}
                        </span>
                        {product.originalPrice && (
                            <span className="text-muted text-decoration-line-through ms-2">
                                {product.originalPrice.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                })}
                            </span>
                        )}
                    </div>

                    <div className="mb-4">
                        <Button variant="primary" size="lg" className="me-2">
                            Add to Cart
                        </Button>
                        <Button variant="outline-primary" size="lg">
                            Buy Now
                        </Button>
                    </div>

                    <div className="product-details mb-4">
                        <h4>Description</h4>
                        <p>{product.description || "No description available."}</p>

                        <h4>Features</h4>
                        <ul>
                            {product.features?.map((feature, index) => (
                                <li key={index}>{feature}</li>
                            )) || <li>No features listed</li>}
                        </ul>
                    </div>
                </Col>
            </Row>

            {relatedProducts.length > 0 && (
                <Row className="mt-5">
                    <Col>
                        <h3>Related Products</h3>
                        <Row xs={2} md={3} lg={4} className="g-4">
                            {relatedProducts.map((related) => (
                                <Col key={related.id}>
                                    <Card
                                        className="h-100 related-product-card"
                                        onClick={() => navigate(`/products/${related.slug}`)}
                                    >
                                        <Card.Img
                                            variant="top"
                                            src={related.thumbnail}
                                            alt={related.title}
                                        />
                                        <Card.Body>
                                            <Card.Title className="fs-6">{related.title}</Card.Title>
                                            <Card.Text className="text-primary fw-bold">
                                                {related.price?.toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD'
                                                })}
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Col>
                </Row>
            )}
        </Container>
    );
}

export default ProductPage;