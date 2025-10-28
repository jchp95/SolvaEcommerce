import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './OrdersList.css';

const OrdersList = ({ orders, loading, onViewOrder, getStatusIcon, getStatusVariant }) => {
    const formatDate = (dateString) => {
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: es });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'Pending': '#f59e0b',
            'Pendiente': '#f59e0b',
            'Processing': '#3b82f6',
            'Procesando': '#3b82f6',
            'Shipped': '#8b5cf6',
            'Enviado': '#8b5cf6',
            'Delivered': '#10b981',
            'Entregado': '#10b981',
            'Completado': '#10b981',
            'Cancelled': '#ef4444',
            'Cancelado': '#ef4444',
            'Refunded': '#6b7280',
            'Reembolsado': '#6b7280'
        };
        return statusColors[status] || '#6b7280';
    };

    const getStatusText = (status) => {
        const statusTexts = {
            'Pending': 'Pendiente',
            'Pendiente': 'Pendiente',
            'Processing': 'Procesando',
            'Procesando': 'Procesando',
            'Shipped': 'Enviado',
            'Enviado': 'Enviado',
            'Delivered': 'Entregado',
            'Entregado': 'Entregado',
            'Completado': 'Completado',
            'Cancelled': 'Cancelado',
            'Cancelado': 'Cancelado',
            'Refunded': 'Reembolsado',
            'Reembolsado': 'Reembolsado'
        };
        return statusTexts[status] || status;
    };

    if (orders.length === 0) {
        return (
            <div className="orders-empty">
                <div className="empty-icon">□</div>
                <h3>No tienes pedidos aún</h3>
                <p>Cuando realices tu primera compra, tus pedidos aparecerán aquí.</p>
                <button 
                    className="btn-primary"
                    onClick={() => window.location.href = '/products'}
                >
                    Ir a la tienda
                </button>
            </div>
        );
    }

    return (
        <div className="orders-list">
            {orders.map((order) => (
                <div 
                    key={order.id} 
                    className="order-card"
                    onClick={() => onViewOrder && onViewOrder(order)}
                >
                    <div className="order-header">
                        <div className="order-info">
                            <h4>Pedido #{order.orderNumber || order.id}</h4>
                            <p className="order-date">
                                {formatDate(order.orderDate)}
                            </p>
                        </div>
                        <div 
                            className="order-status"
                            style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                            {getStatusIcon && getStatusIcon(order.status)}
                            <span className="ms-1">{getStatusText(order.status)}</span>
                        </div>
                    </div>
                    
                    <div className="order-body">
                        <div className="order-summary">
                            <div className="order-items-info">
                                <span className="items-count">
                                    {order.items?.length || 0} artículo(s)
                                </span>
                                {order.items && order.items.length > 0 && (
                                    <div className="items-preview">
                                        {order.items.slice(0, 2).map((item, index) => (
                                            <div key={index} className="item-preview">
                                                {item.itemImage && (
                                                    <img 
                                                        src={item.itemImage} 
                                                        alt={item.itemName}
                                                        className="item-thumbnail"
                                                    />
                                                )}
                                                <span className="item-name">
                                                    {item.itemName}
                                                </span>
                                            </div>
                                        ))}
                                        {order.items.length > 2 && (
                                            <span className="more-items">
                                                +{order.items.length - 2} más
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="order-total">
                                <span className="total-label">Total:</span>
                                <span className="total-amount">
                                    ${order.orderTotal?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="order-actions">
                        <button 
                            className="btn-details"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewOrder && onViewOrder(order);
                            }}
                        >
                            Ver detalles
                        </button>
                        {(order.status === 'Entregado' || order.status === 'Delivered' || order.status === 'Completado') && (
                            <button 
                                className="btn-reorder"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    alert('Funcionalidad de reordenar próximamente');
                                }}
                            >
                                Reordenar
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default OrdersList;
