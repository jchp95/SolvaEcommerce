import React from 'react';
import { Tooltip } from 'react-tooltip';
import { Badge, Card as BootstrapCard, Button, ButtonGroup } from 'react-bootstrap';
import './Card.css';
import defaultImage from '../../assets/images/register.jpg';
import { FiInfo, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

function Card({ product, onAddToCartSuccess }) {
    const [isHovered, setIsHovered] = React.useState(false);
    const { addItem } = useCart();
    const [quantity, setQuantity] = React.useState(0);


    // Extraer propiedades del producto con valores por defecto
    const {
        id,
        imageUrl,
        name = 'Producto sin nombre',
        description = 'Descripción no disponible',
        price = 0
    } = product || {};

    const handleIncrement = () => {
        setQuantity(prev => prev + 1);
    };

    const handleDecrement = () => {
        setQuantity(prev => (prev > 0 ? prev - 1 : 0));
    };

    const handleAddToCart = async () => {
        if (quantity === 0) return;

        const newCartItem = {
            productId: id,
            quantity,
        };

        await addItem(newCartItem);
        setQuantity(0);
        onAddToCartSuccess?.(); // abrir el sidebar
    };

    const getImageUrl = () => {
        if (!imageUrl) return defaultImage;
        if (imageUrl.startsWith('http')) {
            return imageUrl.replace('http://', 'https://');
        }
        // eslint-disable-next-line no-undef
        if (process.env.NODE_ENV === 'development') {
            return `${import.meta.env.VITE_API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        return imageUrl;
    };

    return (
        <>
            <BootstrapCard
                className={`card-product ${isHovered ? 'card-slide-up' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <BootstrapCard.Img
                    variant="top"
                    src={getImageUrl()}
                    alt={name}
                    className="card-image"
                    onError={(e) => {
                        e.target.src = defaultImage;
                        console.error('Error loading image:', imageUrl);
                    }}
                />
                <Button
                    variant="light"
                    data-tooltip-id="details-tooltip"
                    data-tooltip-content="Product details"
                    className="card-icon-button"
                >
                    <FiInfo className="card-icon" />
                </Button>
                <BootstrapCard.ImgOverlay className="card-overlay d-flex flex-column justify-content-end">
                    <div className="card-content">
                        <BootstrapCard.Title className="card-title">{name}</BootstrapCard.Title>
                        <BootstrapCard.Text className="card-description" title={description}>
                            {description}
                        </BootstrapCard.Text>
                        <div className="d-flex justify-content-between align-items-center">
                            <p className="card-price m-0">
                                <Badge className='badge-price'>Price: ${price.toFixed(2)}</Badge>
                            </p>
                            <div className="cart-control-container">
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleDecrement}
                                    disabled={quantity === 0}
                                    className="quantity-btn decrement-btn"
                                >
                                    <span className='span-minus'>-</span>
                                </Button>

                                <div className="spacer" />

                                <Button
                                    onClick={handleAddToCart}
                                    variant="light"
                                    className="cart-btn"
                                    data-tooltip-id="cart-tooltip"
                                    data-tooltip-content="Add cart"
                                >
                                    <FiShoppingCart className='card-icon-cart' />
                                    {quantity > 0 && (
                                        <Badge pill bg="danger" className="quantity-badge">
                                            {quantity}
                                        </Badge>
                                    )}
                                </Button>

                                <div className="spacer" />

                                <Button
                                    variant="outline-secondary"
                                    onClick={handleIncrement}
                                    className="quantity-btn increment-btn"
                                >
                                    <span className='span-plus'>+</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </BootstrapCard.ImgOverlay>
            </BootstrapCard>

            <Tooltip
                id="details-tooltip"
                place="top"
                style={{ backgroundColor: '#860000', color: '#fff', borderRadius: '4px', fontSize: '16px' }}
            />
            <Tooltip
                id="cart-tooltip"
                place="top"
                style={{ backgroundColor: '#860000', color: '#fff', borderRadius: '4px', fontSize: '16px' }}
            />
        </>
    );
}

export default Card;