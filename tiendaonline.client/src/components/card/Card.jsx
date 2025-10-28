import React from 'react';
import { Tooltip } from 'react-tooltip';
import { Badge, Card as BootstrapCard, Button, Modal } from 'react-bootstrap';
import './Card.css';
import defaultImage from '../../assets/images/register.jpg';
import { FiInfo, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

function RatingStars({ value = 0 }) {
  if (!value || value === 0) return <span className="rating-value">Sin valoraciones</span>;
  
  const full = Math.floor(value);
  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? '★' : '☆'));
  return (
    <span className="rating-stars" aria-label={`Valoración ${value} de 5`}>
      {stars.join(' ')} <span className="rating-value">({value.toFixed(1)})</span>
    </span>
  );
}

function Card({ product, onAddToCartSuccess }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const { addItem } = useCart();
  const [quantity, setQuantity] = React.useState(0);
  const [showModal, setShowModal] = React.useState(false);

  // Extraer datos del producto con valores por defecto seguros
  const {
    id,
    imageUrl,
    name = 'Producto sin nombre',
    description = 'Descripción no disponible',
    shortDescription,
    price = 0,
    compareAtPrice,
    brand = 'Sin marca',
    supplierName,
    rating = 0,
    reviewCount = 0,
    stock = 0,
    sku,
    categoryName,
    expiryDate,
    features,
    specs,
    badges,
    hasFreeShipping = false,
    isInStock = false,
    hasDiscount = false,
    discountPercentage = 0,
  } = product || {};

  // Parsear features si viene como string JSON
  const featuresList = React.useMemo(() => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [features]);

  // Parsear specs si viene como string JSON
  const specsDictionary = React.useMemo(() => {
    if (!specs) return {};
    if (typeof specs === 'object' && !Array.isArray(specs)) return specs;
    if (typeof specs === 'string') {
      try {
        const parsed = JSON.parse(specs);
        return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return {};
      }
    }
    return {};
  }, [specs]);

  // Parsear badges si viene como string JSON
  const badgesList = React.useMemo(() => {
    if (!badges) return [];
    if (Array.isArray(badges)) return badges;
    if (typeof badges === 'string') {
      try {
        const parsed = JSON.parse(badges);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // Si no es JSON, dividir por comas
        return badges.split(',').map(b => b.trim()).filter(b => b);
      }
    }
    return [];
  }, [badges]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-ES', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      }).format(date);
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatMoney = (n) => {
    const num = typeof n === 'number' ? n : Number(n || 0);
    return num.toFixed(2);
  };

  const handleIncrement = () => {
    if (quantity < stock) {
      setQuantity((prev) => prev + 1);
    }
  };
  
  const handleDecrement = () => setQuantity((prev) => (prev > 0 ? prev - 1 : 0));

  const handleAddToCart = async () => {
    if (quantity === 0 || !isInStock) return;
    try {
      const newCartItem = { productId: id, quantity };
      await addItem(newCartItem);
      setQuantity(0);
      onAddToCartSuccess?.();
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      alert('Error al agregar el producto al carrito');
    }
  };

  const getImageUrl = () => {
    if (!imageUrl) return defaultImage;
    if (imageUrl.startsWith('http')) return imageUrl.replace('http://', 'https://');
    if (process.env.NODE_ENV === 'development') {
      return `${import.meta.env.VITE_API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    return imageUrl;
  };

  // Información de envío calculada
  const shippingInfo = React.useMemo(() => {
    if (hasFreeShipping) {
      return {
        type: 'Envío gratuito',
        cost: 0,
        eta: 'Entrega estimada en 3-5 días hábiles'
      };
    }
    return {
      type: 'Envío estándar',
      cost: 5.99,
      eta: 'Entrega estimada en 5-7 días hábiles'
    };
  }, [hasFreeShipping]);

  return (
    <>
      {/* Tarjeta del producto */}
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
          onError={(e) => { e.target.src = defaultImage; }}
        />

        <Button
          variant="light"
          data-tooltip-id="details-tooltip"
          data-tooltip-content="Detalles del producto"
          className="card-icon-button"
          onClick={() => setShowModal(true)}
        >
          <FiInfo className="card-icon" />
        </Button>

        <BootstrapCard.ImgOverlay className="card-overlay d-flex flex-column justify-content-end">
          <div className="card-content">
            <BootstrapCard.Title className="card-title">{name}</BootstrapCard.Title>
            <BootstrapCard.Text className="card-description" title={shortDescription || description}>
              {shortDescription || description}
            </BootstrapCard.Text>
            
            {/* Precio con descuento mejorado */}
            <div className="card-price-section">
              {/* Descuento mostrado arriba para mayor visibilidad */}
              {hasDiscount && compareAtPrice && (
                <div className="discount-top">
                  <Badge bg="danger" className="discount-badge">
                    -{Math.round(discountPercentage)}%
                  </Badge>
                </div>
              )}

              {/* Fila con precio actual y precio anterior (inline) */}
              <div className="price-row">
                  {hasDiscount && compareAtPrice && (
                      <span className="original-price original-price-inline ">
                    ${formatMoney(compareAtPrice)}
                  </span>
                  )}
                <div className="current-price ms-2">
                  <Badge className="badge-price">${formatMoney(price)}</Badge>
                </div>
              </div>
            </div>

            {/* Fila inferior: stock (start) y controles de carrito (end) */}
            <div className="card-bottom-row">
              <div className="card-stock-info">
                {isInStock ? (
                  <span className="stock-available">
                    <span className="stock-dot"></span>
                    {stock} disponibles
                  </span>
                ) : (
                  <span className="stock-unavailable">
                    <span className="stock-dot-out"></span>
                    Sin stock
                  </span>
                )}
              </div>

              {/* Controles de carrito mejorados */}
              <div className="cart-actions-wrapper">
                <div className="cart-control-container">
                  <Button
                    variant="outline-secondary"
                    onClick={handleDecrement}
                    disabled={quantity === 0}
                    className="quantity-btn decrement-btn"
                    aria-label="Disminuir cantidad"
                  >
                    <span className="span-minus">-</span>
                  </Button>
                  <div className="spacer" />
                  <Button
                    onClick={handleAddToCart}
                    variant="light"
                    className="cart-btn"
                    data-tooltip-id="cart-tooltip"
                    data-tooltip-content={!isInStock ? "Sin stock" : "Agregar al carrito"}
                    aria-label="Agregar al carrito"
                  >
                    <FiShoppingCart className="card-icon-cart" />
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
                    disabled={!isInStock || quantity >= stock}
                    aria-label="Aumentar cantidad"
                  >
                    <span className="span-plus">+</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </BootstrapCard.ImgOverlay>
      </BootstrapCard>

      {/* Modal de detalles del producto */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="xl"
        dialogClassName="product-modal"
      >
        <Modal.Header closeButton className="product-modal-header">
          <Modal.Title>{name}</Modal.Title>
        </Modal.Header>

        <Modal.Body className="product-modal-body">
          {/* GRID 2 columnas: imagen + detalles */}
          <div className="product-modal-image d-flex flex-column justify-content-between">
            <img
              src={getImageUrl()}
              alt={name}
              onError={(e) => { e.target.src = defaultImage; }}
              style={{ 
                marginBottom: '1.5rem', 
                borderRadius: 8, 
                background: '#23272b', 
                border: 'none', 
                boxShadow: 'none',
                width: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Información del proveedor */}
            <div className="provider-info">
              <div className="provider-title">Información del proveedor</div>
              <div className="provider-row">
                <span className="provider-label">Nombre:</span> 
                <span className="provider-value">{supplierName || 'No disponible'}</span>
              </div>
              <div className="provider-row">
                <span className="provider-label">SKU:</span> 
                <span className="provider-value">{sku || 'No disponible'}</span>
              </div>
              <div className="provider-row">
                <span className="provider-label">Categoría:</span> 
                <span className="provider-value">{categoryName || 'Sin categoría'}</span>
              </div>
            </div>
          </div>

          {/* Columna derecha: datos del producto */}
          <div className="product-modal-details">
            {/* BADGES */}
            {badgesList.length > 0 && (
              <div className="product-badges" style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {badgesList.map((badge, i) => (
                  <span key={i} className="product-badge-chip">{badge}</span>
                ))}
              </div>
            )}

            {/* Metadata: Marca y Rating */}
            <div className="product-meta-row">
              <span className="product-brand">
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>Marca:</span> 
                <strong style={{ color: '#fff', fontWeight: 700 }}>{brand}</strong>
              </span>
              <span className="product-rating">
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                  <RatingStars value={rating} />
                </span> 
                {reviewCount > 0 && (
                  <span style={{ color: '#f3f3f3', fontWeight: 600 }}>
                    ({reviewCount.toLocaleString()} {reviewCount === 1 ? 'reseña' : 'reseñas'})
                  </span>
                )}
              </span>
            </div>

            {/* Precio y descuento */}
            <div className="product-price-block">
              {/* Descuento arriba para mayor visibilidad */}
              {hasDiscount && compareAtPrice && (
                <div className="discount-top modal-discount-top" style={{ marginBottom: '0.5rem' }}>
                  <Badge bg="danger" style={{ fontSize: '1rem' }}>
                    -{Math.round(discountPercentage)}% OFF
                  </Badge>
                </div>
              )}

              {/* Fila con precio actual y precio anterior (inline) */}
              <div className="price-row modal-price-row" style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
                <span className="product-price">US$ {formatMoney(price)}</span>
                {hasDiscount && compareAtPrice && (
                  <span className="original-price original-price-inline">
                    US$ {formatMoney(compareAtPrice)}
                  </span>
                )}
              </div>

              <span className="product-shipping">
                {shippingInfo.type} {shippingInfo.cost === 0 ? '(Gratis)' : `(+ US$ ${formatMoney(shippingInfo.cost)})`}
              </span>
              {shippingInfo.eta && (
                <div className="product-eta" style={{ color: '#f59e0b', fontWeight: 700 }}>
                  {shippingInfo.eta}
                </div>
              )}
            </div>

            {/* Disponibilidad */}
            <div className="product-availability">
              {isInStock ? (
                <span className="in-stock">✓ En stock ({stock} {stock === 1 ? 'unidad disponible' : 'unidades disponibles'})</span>
              ) : (
                <span className="out-of-stock">✗ Sin stock</span>
              )}
            </div>

            {/* Información adicional */}
            <div className="product-info-grid">
              {expiryDate && (
                <div><span className="label">Vence:</span> {formatDate(expiryDate)}</div>
              )}
              <div><span className="label">SKU:</span> {sku || 'No disponible'}</div>
              <div><span className="label">Categoría:</span> {categoryName || 'Sin categoría'}</div>
            </div>

            {/* Descripción */}
            <div className="product-details-block" style={{ marginTop: 24 }}>
              <h5 style={{ color: '#f59e0b', fontWeight: 700 }}>Descripción</h5>
              <p className="product-description" style={{ 
                whiteSpace: 'pre-line', 
                color: '#fff', 
                marginLeft: 0, 
                textAlign: 'justify' 
              }}>
                {description}
              </p>

              {/* Características */}
              <h5 style={{ color: '#f59e0b', fontWeight: 700, marginTop: 20 }}>Características</h5>
              <div className="product-features" style={{ color: '#fff', marginLeft: 0 }}>
                {featuresList.length > 0 ? (
                  <ul style={{ 
                    paddingLeft: 20, 
                    marginLeft: 0, 
                    textAlign: 'justify' 
                  }}>
                    {featuresList.map((f, i) => (
                      <li key={i} style={{ marginBottom: '0.5rem' }}>
                        {typeof f === 'string' ? f : JSON.stringify(f)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ marginLeft: 0, color: '#9e9e9e' }}>No hay características disponibles.</span>
                )}
              </div>

              {/* Especificaciones */}
              <h5 style={{ color: '#f59e0b', fontWeight: 700, marginTop: 20 }}>Especificaciones</h5>
              <div className="product-specs" style={{ color: '#fff', marginLeft: 0 }}>
                {Object.keys(specsDictionary).length > 0 ? (
                  <ul style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '1rem', 
                    paddingLeft: 0, 
                    margin: 0, 
                    listStyle: 'none' 
                  }}>
                    {Object.entries(specsDictionary).map(([k, v], i) => (
                      <li key={i} className="spec-badge">
                        <span className="spec-key">{k}:</span> 
                        <span className="spec-val">{v || 'N/A'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ marginLeft: 0, color: '#9e9e9e' }}>No hay especificaciones disponibles.</span>
                )}
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Tooltips */}
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
