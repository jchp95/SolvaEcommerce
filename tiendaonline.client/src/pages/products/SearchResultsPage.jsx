import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import "./SearchResultsPage.css";

function SearchResultsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get("q");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (query) {
            const fetchResults = async () => {
                try {
                    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    if (!response.ok) throw new Error("Network response was not ok");
                    const data = await response.json();
                    setResults(data.hits || []);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchResults();
        } else {
            navigate("/");
        }
    }, [query, navigate]);

    if (isLoading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" />
                <p>Loading results...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5 text-center text-danger">
                <p>Error: {error}</p>
            </Container>
        );
    }

    return (
        <Container className="my-4">
            <h2 className="mb-4">Search Results for "{query}"</h2>

            {results.length === 0 ? (
                <div className="text-center py-5">
                    <h4>No products found</h4>
                    <p>Try different search terms</p>
                </div>
            ) : (
                <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                    {results.map((product) => (
                        <Col key={product.id}>
                            <Card
                                className="h-100 product-card"
                                onClick={() => navigate(`/products/${product.slug}`)}
                            >
                                {product.thumbnail && (
                                    <Card.Img
                                        variant="top"
                                        src={product.thumbnail}
                                        alt={product.title}
                                        onError={(e) => e.target.src = '/placeholder-product.png'}
                                    />
                                )}
                                <Card.Body>
                                    <Card.Title>{product.title}</Card.Title>
                                    <Card.Text className="text-primary fw-bold">
                                        {product.price?.toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'USD'
                                        })}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}

export default SearchResultsPage;