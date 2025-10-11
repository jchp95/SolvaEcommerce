/* eslint-disable no-undef */
import { useState, useEffect } from "react";
import { Form, InputGroup, Button, Spinner, Dropdown } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import useDebounce from "../../hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import "./Search.css";
import defaultImage from '../../assets/images/register.jpeg';

function Search() {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFocus, setHasFocus] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const navigate = useNavigate();

    useEffect(() => {
        if (debouncedSearchTerm.trim()) {
            performSearch(debouncedSearchTerm);
        } else {
            setResults([]);
        }
    }, [debouncedSearchTerm]);

    const performSearch = async (query) => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:5256/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Search failed");
            }
            const data = await response.json();
            setResults(data.results || []); // Changed from data.hits to data.results
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return defaultImage;
        if (imageUrl.startsWith('http')) {
            return imageUrl.replace('http://', 'https://');
        }
        if (process.env.NODE_ENV === 'development') {
            return `${import.meta.env.VITE_API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        return imageUrl;
    };


    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleProductClick = (productSlug) => {
        setHasFocus(false);
        navigate(`/products/${productSlug}`);
    };

    return (
        <div className="search-container position-relative">
            <Form onSubmit={handleSearch}>
                <InputGroup>
                    <Form.Control
                        type="text"
                        placeholder="Search products, brands, categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setHasFocus(true)}
                        onBlur={() => setTimeout(() => setHasFocus(false), 300)}
                        className="search-input"
                        aria-expanded={hasFocus && results.length > 0}
                    />
                    <Button
                        variant="primary"
                        type="submit"
                        className="search-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            <FontAwesomeIcon className="icon-search" icon={faSearch} />
                        )}
                    </Button>
                </InputGroup>
            </Form>

            {hasFocus && (results.length > 0 || isLoading) && (
                <div className="search-results-dropdown show">
                    <div className="dropdown-menu show w-100" style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        display: 'block'
                    }}>
                        {isLoading ? (
                            <div className="dropdown-item-text text-center">
                                <Spinner animation="border" size="sm" /> Loading...
                            </div>
                        ) : (
                            <>
                                {results.slice(0, 5).map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleProductClick(product.slug)}
                                        className="dropdown-item py-2"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {product.imageUrl && (
                                                <img
                                                    src={getImageUrl(product.imageUrl)}
                                                    alt={product.name}
                                                    width="40"
                                                    height="40"
                                                    className="me-3 rounded"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/placeholder-product.png';
                                                    }}
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            )}

                                            <div className="fw-semibold">{product.name}</div>
                                            <div><small className="text-muted">
                                                {product.price?.toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD'
                                                })}
                                            </small></div>

                                        </div>

                                    </div>
                                ))}
                                <div className="dropdown-divider"></div>
                                <div
                                    onClick={() => {
                                        setHasFocus(false);
                                        navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                                    }}
                                    className="dropdown-item-see-all text-center fw-bold"
                                    style={{ cursor: 'pointer' }}
                                >
                                    See all results ({results.length})
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Search;