import React from 'react';
import { Tooltip } from 'react-tooltip';
import { Badge, Card as BootstrapCard, Button, Modal } from 'react-bootstrap';
import './Card.css';
import defaultImage from '../../assets/images/register.jpg';
import { FiInfo, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';

function RatingStars({ value = 4.3 }) {
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

  // Datos base + fallbacks de “contenido de prueba”
  const {
    id,
    imageUrl,
    name ,
    description,
    price = 0,
    brand,
    supplierName = 'Distribuciones García',
    rating = 4.4,
    reviewCount = 1278,
    stock = 0,
    sku = 'SKU-TEST-001',
    categoryName,
    expiryDate, 
    features = [],
    specs = {},
    shipping = {
      type: 'Envío Prime 24h',
      cost: 0,
      eta: 'Mañana antes de las 22:00',
    },
    badges = [],
  } = product || {};

  // Si no hay fecha de vencimiento, generar una de prueba a +180 días
  const computedExpiry = React.useMemo(() => {
    if (expiryDate) return new Date(expiryDate);
    const d = new Date();
    d.setDate(d.getDate() + 180);
    return d;
  }, [expiryDate]);

  const formatDate = (d) =>
    new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);

  const formatMoney = (n) =>
    (typeof n === 'number' ? n : Number(n || 0)).toFixed(2);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 0 ? prev - 1 : 0));

  const handleAddToCart = async () => {
    if (quantity === 0) return;
    const newCartItem = { productId: id, quantity };
    await addItem(newCartItem);
    setQuantity(0);
    onAddToCartSuccess?.();
  };

  const getImageUrl = () => {
    if (!imageUrl) return defaultImage;
    if (imageUrl.startsWith('http')) return imageUrl.replace('http://', 'https://');
    if (process.env.NODE_ENV === 'development') {
      return `${import.meta.env.VITE_API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    return imageUrl;
  };

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
            <BootstrapCard.Text className="card-description" title={description}>
              {description}
            </BootstrapCard.Text>
            <div className="d-flex justify-content-between align-items-center">
              <p className="card-price m-0">
                <Badge className="badge-price">Price: ${formatMoney(price)}</Badge>
              </p>
              <div className="cart-control-container">
                <Button
                  variant="outline-secondary"
                  onClick={handleDecrement}
                  disabled={quantity === 0}
                  className="quantity-btn decrement-btn"
                >
                  <span className="span-minus">-</span>
                </Button>
                <div className="spacer" />
                <Button
                  onClick={handleAddToCart}
                  variant="light"
                  className="cart-btn"
                  data-tooltip-id="cart-tooltip"
                  data-tooltip-content="Agregar al carrito"
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
                >
                  <span className="span-plus">+</span>
                </Button>
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
  size="xl"                               // MÁS ANCHO (bootstrap)
  dialogClassName="product-modal"         // conserva tu clase
>
  <Modal.Header closeButton className="product-modal-header">
    <Modal.Title>{name}</Modal.Title>
  </Modal.Header>

  <Modal.Body className="product-modal-body">
    {/* GRID 2 columnas: imagen fija + detalles */}
    <div className="product-modal-image d-flex flex-column justify-content-between">
      <img
        src={getImageUrl()}
        alt={name}
        onError={(e) => { e.target.src = defaultImage; }}
        style={{ marginBottom: '1.5rem', borderRadius: 8, background: '#23272b', border: 'none', boxShadow: 'none' }}
      />

      {/* Datos del proveedor debajo de la imagen, mejor estructurados y sin botones */}

      <div className="provider-info">
        <div className="provider-title">Información del proveedor</div>
        <div className="provider-row"><span className="provider-label">Nombre:</span> <span className="provider-value">{supplierName || 'Distribuciones García'}</span></div>
        <div className="provider-row"><span className="provider-label">Dirección:</span> <span className="provider-value">Calle Falsa 123, Ciudad Ejemplo</span></div>
        <div className="provider-row"><span className="provider-label">Teléfono:</span> <span className="provider-value">+34 600 123 456</span></div>
        <div className="provider-row"><span className="provider-label">Email:</span> <span className="provider-value">proveedor@ejemplo.com</span></div>
        <div className="provider-row"><span className="provider-label">Valoración:</span> <span className="provider-value" style={{ color: '#f59e0b', fontWeight: 600 }}>4.8/5</span> <span className="provider-value" style={{ color: '#bdbdbd' }}>(1,234 opiniones)</span></div>
        <div className="provider-row"><span className="provider-label">Tiempo en la plataforma:</span> <span className="provider-value">3 años</span></div>
      </div>
    </div>

    {/* Columna derecha: solo datos del producto */}
    <div className="product-modal-details">
      {/* BADGES individuales */}
      <div className="product-badges" style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {Array.isArray(badges) && badges.length > 0
          ? badges.map((badge, i) => (
              <span key={i} className="product-badge-chip">{badge}</span>
            ))
          : (typeof badges === 'string' && badges.trim() !== '' &&
              badges.split(',').map((badge, i) => (
                <span key={i} className="product-badge-chip">{badge.trim()}</span>
              )))}
      </div>
      <div className="product-meta-row">
        <span className="product-brand"><span style={{ color: '#f59e0b', fontWeight: 700 }}>Marca:</span> <strong style={{ color: '#fff', fontWeight: 700 }}>{brand}</strong></span>
        <span className="product-rating">
          <span style={{ color: '#f59e0b', fontWeight: 700 }}><RatingStars value={rating} /></span> <a href="#opiniones" className="reviews-link" style={{ color: '#f3f3f3', fontWeight: 600, textDecoration: 'underline' }}>{reviewCount != null ? reviewCount.toLocaleString() : '0'} reseñas</a>
        </span>
      </div>
      <div className="product-price-block">
        <span className="product-price">US$ {formatMoney(price)}</span>
        <span className="product-shipping">
          {shipping?.type} {shipping?.cost === 0 ? '(Gratis)' : `(+ US$ ${formatMoney(shipping?.cost)})`}
        </span>
        {shipping?.eta && <div className="product-eta" style={{ color: '#f59e0b', fontWeight: 700 }}>Llega: <strong style={{ color: '#fff', fontWeight: 700 }}>{shipping.eta}</strong></div>}
      </div>
      <div className="product-availability">
        {stock > 0 ? <span className="in-stock">En stock ({stock} disponibles)</span> : <span className="out-of-stock">Sin stock</span>}
      </div>
      <div className="product-info-grid">
        <div><span className="label">Vence:</span> {formatDate(computedExpiry)}</div>
        <div><span className="label">SKU:</span> {sku}</div>
        <div><span className="label">Categoría:</span> {categoryName}</div>
      </div>
      {/* Descripción, características y especificaciones a lo largo */}
      <div className="product-details-block" style={{ marginTop: 24 }}>
        <h5 style={{ color: '#f59e0b', fontWeight: 700 }}>Descripción</h5>
        <p className="product-description" style={{ whiteSpace: 'pre-line', color: '#fff', marginLeft: 0, textAlign: 'justify' }}>{description || 'Descripción no disponible.'}</p>
        <h5 style={{ color: '#f59e0b', fontWeight: 700, marginTop: 20 }}>Características</h5>
        <div className="product-features" style={{ color: '#fff', marginLeft: 0 }}>
          {Array.isArray(features) && features.length > 0
            ? <ul style={{ paddingLeft: 0, marginLeft: 0, listStylePosition: 'inside', textAlign: 'justify' }}>{features.map((f, i) => <li key={i} style={{ marginLeft: 0 }}>{typeof f === 'string' ? f : JSON.stringify(f)}</li>)}</ul>
            : (typeof features === 'string' && features.trim() !== ''
                ? <p style={{ marginLeft: 0, textAlign: 'justify' }}>{features}</p>
                : <span style={{ marginLeft: 0 }}>Características no disponibles.</span>)}
        </div>
        <h5 style={{ color: '#f59e0b', fontWeight: 700, marginTop: 20 }}>Especificaciones</h5>
        <div className="product-specs" style={{ color: '#fff', marginLeft: 0 }}>
          {specs && typeof specs === 'object' && Object.keys(specs).length > 0
            ? <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                {Object.entries(specs).map(([k, v], i) => (
                  <li key={i} className="spec-badge">
                    <span className="spec-key">{k}:</span> <span className="spec-val">{v}</span>
                  </li>
                ))}
              </ul>
            : (typeof specs === 'string' && specs.trim() !== ''
                ? <p style={{ marginLeft: 0, whiteSpace: 'pre-line', textAlign: 'justify' }}>{specs}</p>
                : <span style={{ marginLeft: 0 }}>Especificaciones no disponibles.</span>)}
        </div>
      </div>
      <div className="product-legal">Devoluciones gratis por 30 días · Garantía del fabricante por 12 meses.</div>
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
