
import Sidebar from './Sidebar';
import { useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash, CreditCard } from 'react-bootstrap-icons';
import { Button, ListGroup, Row, Col, Image, Stack } from 'react-bootstrap';
import { formatImageUrl } from '../../utils/Images';
import { useCart } from '../../context/CartContext';
import '../card/Card.css';

// Componente memoizado para items del carrito
const CartItem = memo(({ item, handleRemoveItem, handleUpdateQuantity }) => (
    <ListGroup.Item
        className="bg-dark bg-opacity-10 border-0 rounded mb-2 px-2 py-2"
        style={{ borderLeft: '3px solid var(--primary)' }}
    >
        <Row className="align-items-center g-2">
            <Col xs="auto">
                <Image
                    src={formatImageUrl(item.imageUrl) || '/placeholder.png'}
                    rounded
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder.png';
                    }}
                    style={{
                        width: 70,
                        height: 80,
                        objectFit: 'cover',
                        border: '1px solid var(--glass-border)',
                        backgroundColor: '#1e1e27'
                    }}
                    loading="lazy"
                />
            </Col>
            <Col className="d-flex flex-column align-items-start">
                <div className="fw-semibold text-light small mb-1 text-break">{item.name}</div>
                <div className="text-muted small justify-content-start align-items-center mb-1">
                    Cantidad:
                    <Button
                        variant="outline-secondary"
                        className="quantity-btn decrement-btn ms-2"
                        onClick={() => item.quantity > 1 && handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                    >
                        <span className='span-minus'>-</span>
                    </Button>
                    <span className="fw-bold">{item.quantity}</span>
                    <Button
                        variant="outline-secondary"
                        className="quantity-btn increment-btn"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                        <span className='span-plus'>+</span>
                    </Button>
                </div>
                <div className="text-muted justify-content-start small mb-0">Precio: ${item.price.toFixed(2)}</div>
            </Col>
            <Col xs="auto" className="d-flex align-items-center">
                <Trash
                    className="text-danger"
                    role="button"
                    onClick={() => handleRemoveItem(item.id)}
                />
            </Col>
        </Row>
    </ListGroup.Item>
));

const CartSidebar = ({ isOpen, onClose }) => {
    const { cartItems, removeItem, loadCartItems, updateQuantity } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            loadCartItems();
        }
    }, [isOpen, loadCartItems]);

    const total = useMemo(() => {
        return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    }, [cartItems]);

    const handleUpdateQuantity = (id, newQuantity) => {
        updateQuantity(id, newQuantity);
    };

    return (
        <Sidebar isOpen={isOpen} onClose={onClose} title={<>Carrito</>} width={320} placement="end">
            <div className="sidebar-body p-3">
                {cartItems.length === 0 ? (
                    <div className="text-center mt-4 text-muted">El carrito está vacío.</div>
                ) : (
                    <>
                        <ListGroup variant="flush" className="mb-3">
                            {cartItems.map(item => (
                                <CartItem
                                    key={`${item.id}-${item.productId}`}
                                    item={item}
                                    handleRemoveItem={removeItem}
                                    handleUpdateQuantity={handleUpdateQuantity}
                                />
                            ))}
                        </ListGroup>

                        <div className="border-top pt-3 px-1 mb-3">
                            <Stack direction="horizontal" className="justify-content-between">
                                <span className="fw-semibold fs-6 text-danger">Total:</span>
                                <span className="fw-semibold fs-6 text-danger">${total.toFixed(2)}</span>
                            </Stack>
                        </div>

                        <div className="d-grid px-1">
                            <Button
                                variant="danger"
                                onClick={() => {
                                    onClose(); // opcional: cerrar el sidebar
                                    navigate('/checkout');
                                }}>
                                <CreditCard className="me-2" /> Finalizar compra
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Sidebar>
    );
};


export default CartSidebar;
