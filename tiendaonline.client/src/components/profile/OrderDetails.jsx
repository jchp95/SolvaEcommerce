import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { checkCanCancelOrder, cancelOrder, clearErrors } from '../../features/reduxSlices/orders/ordersSlice';
import AlertService from '../../services/AlertService';
import './OrderDetails.css';

const OrderDetails = ({ order, onBack }) => {
    const dispatch = useDispatch();
    const { cancelLoading, cancelError, canCancelStatus } = useSelector(state => state.orders);
    const [isCancelling, setIsCancelling] = useState(false);

    // Verificar si se puede cancelar la orden cuando el componente se monta
    useEffect(() => {
        if (order && order.id) {
            dispatch(checkCanCancelOrder(order.id));
        }
    }, [dispatch, order?.id]);

    // Obtener el estado de cancelación para esta orden
    const canCancelInfo = canCancelStatus[order?.id] || { canCancel: false, message: 'Verificando...' };

    const handleCancelOrder = async () => {
        if (!order || !canCancelInfo.canCancel) {
            await AlertService.error({
                title: 'No se puede cancelar',
                text: canCancelInfo.message || 'Esta orden no puede ser cancelada en este momento.'
            });
            return;
        }

        try {
            // Mostrar formulario de cancelación con SweetAlert
            const { value: formValues } = await AlertService.custom({
                title: '¿Cancelar pedido?',
                html: `
                    <div style="text-align: left; margin: 1rem 0;">
                        <p style="margin-bottom: 1rem; color: #e74c3c; font-weight: 500;">
                            <strong>Pedido:</strong> #${order.orderNumber || order.id}
                        </p>
                        <p style="margin-bottom: 1rem; color: #6b7280;">
                            Una vez cancelado, el stock se restaurará y no podrás revertir esta acción.
                        </p>
                        <label for="swal-input-reason" style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500;">
                            Razón de la cancelación (requerida):
                        </label>
                        <textarea
                            id="swal-input-reason"
                            class="swal2-textarea"
                            placeholder="Explica por qué deseas cancelar este pedido (mínimo 10 caracteres)"
                            style="width: 100%; min-height: 80px; margin-bottom: 1rem; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; resize: vertical;"
                        ></textarea>
                        <label for="swal-input-notes" style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500;">
                            Notas adicionales (opcional):
                        </label>
                        <textarea
                            id="swal-input-notes"
                            class="swal2-textarea"
                            placeholder="Información adicional (opcional)"
                            style="width: 100%; min-height: 60px; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; resize: vertical;"
                        ></textarea>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Sí, cancelar pedido',
                cancelButtonText: 'No cancelar',
                customClass: {
                    confirmButton: 'btn btn-danger mx-2',
                    cancelButton: 'btn btn-secondary mx-2',
                    popup: 'dark-swal-popup'
                },
                buttonsStyling: false,
                focusCancel: true,
                preConfirm: () => {
                    const reason = document.getElementById('swal-input-reason').value.trim();
                    const notes = document.getElementById('swal-input-notes').value.trim();
                    
                    if (!reason || reason.length < 10) {
                        AlertService.error({
                            title: 'Razón requerida',
                            text: 'Debes proporcionar una razón de cancelación de al menos 10 caracteres.'
                        });
                        return false;
                    }
                    
                    if (reason.length > 500) {
                        AlertService.error({
                            title: 'Razón muy larga',
                            text: 'La razón de cancelación no puede exceder 500 caracteres.'
                        });
                        return false;
                    }
                    
                    return { reason, notes };
                }
            });

            if (formValues) {
                setIsCancelling(true);
                
                const cancellationData = {
                    cancellationReason: formValues.reason,
                    cancellationNotes: formValues.notes || null
                };

                const result = await dispatch(cancelOrder({ 
                    orderId: order.id, 
                    cancellationData 
                })).unwrap();

                // Mostrar éxito
                await AlertService.success({
                    title: 'Pedido cancelado',
                    text: `El pedido #${order.orderNumber || order.id} ha sido cancelado exitosamente. El stock ha sido restaurado.`,
                    timer: 3000
                });

                // Opcional: regresar a la lista de pedidos
                if (onBack) {
                    onBack();
                }
            }
        } catch (error) {
            console.error('Error al cancelar pedido:', error);
            await AlertService.error({
                title: 'Error al cancelar',
                text: error || 'Ha ocurrido un error al cancelar el pedido. Por favor, inténtalo de nuevo.'
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const formatDate = (dateString) => {
        return format(new Date(dateString), 'dd MMMM yyyy HH:mm', { locale: es });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'Pending': '#f59e0b',
            'Processing': '#3b82f6',
            'Shipped': '#8b5cf6',
            'Delivered': '#10b981',
            'Cancelled': '#ef4444',
            'Refunded': '#6b7280'
        };
        return statusColors[status] || '#6b7280';
    };

    const getStatusText = (status) => {
        const statusTexts = {
            'Pending': 'Pendiente',
            'Processing': 'Procesando',
            'Shipped': 'Enviado',
            'Delivered': 'Entregado',
            'Cancelled': 'Cancelado',
            'Refunded': 'Reembolsado'
        };
        return statusTexts[status] || status;
    };

    const getStatusSteps = () => {
        const steps = [
            { key: 'Pending', label: 'Pedido Confirmado', icon: '✓' },
            { key: 'Processing', label: 'Procesando', icon: '●' },
            { key: 'Shipped', label: 'Enviado', icon: '→' },
            { key: 'Delivered', label: 'Entregado', icon: '✓' }
        ];

        const currentIndex = steps.findIndex(step => step.key === order.status);
        const isCancelled = order.status === 'Cancelled';
        const isRefunded = order.status === 'Refunded';

        return steps.map((step, index) => ({
            ...step,
            completed: !isCancelled && !isRefunded && index <= currentIndex,
            current: !isCancelled && !isRefunded && index === currentIndex,
            disabled: isCancelled || isRefunded
        }));
    };

    if (!order) {
        return (
            <div className="order-details-empty">
                <p>Selecciona un pedido para ver los detalles</p>
            </div>
        );
    }

    const statusSteps = getStatusSteps();
    const subtotal = order.subTotal || order.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) || 0;
    const shipping = order.shippingTotal || 0;
    const tax = order.taxTotal || 0;

    return (
        <div className="order-details">
            <div className="order-details-header">
                <button onClick={onBack} className="back-button p-2">
                    ← Volver a mis pedidos
                </button>
                <div className="order-title">
                    <h2>Pedido #{order.orderNumber || order.id}</h2>
                    <p className="order-date-detail">
                        Realizado el {formatDate(order.orderDate)}
                    </p>
                </div>
            </div>

            {/* Estado del pedido */}
            <div className="order-status-section">
                <div className="status-header">
                    <h3>Estado del pedido</h3>
                    <div 
                        className="current-status"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                        {getStatusText(order.status)}
                    </div>
                </div>

                {order.status !== 'Cancelled' && order.status !== 'Refunded' && (
                    <div className="status-timeline">
                        {statusSteps.map((step, index) => (
                            <div 
                                key={step.key} 
                                className={`timeline-step ${
                                    step.completed ? 'completed' : ''
                                } ${step.current ? 'current' : ''}`}
                            >
                                <div className="step-icon">
                                    {step.completed ? '✓' : step.icon}
                                </div>
                                <div className="step-content">
                                    <span className="step-label">{step.label}</span>
                                    {step.current && (
                                        <span className="step-current">Actual</span>
                                    )}
                                </div>
                                {index < statusSteps.length - 1 && (
                                    <div className={`step-connector ${step.completed ? 'completed' : ''}`} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Artículos del pedido */}
            <div className="order-items-section">
                <h3>Artículos del pedido ({order.items?.length || 0})</h3>
                <div className="items-list">
                    {order.items?.map((item, index) => (
                        <div key={index} className="order-item">
                            <div className="item-image">
                                {item.itemImage ? (
                                    <img 
                                        src={item.itemImage} 
                                        alt={item.itemName} 
                                    />
                                ) : (
                                    <div className="image-placeholder">
                                        📦
                                    </div>
                                )}
                            </div>
                            <div className="item-details">
                                <h4 className="item-name">
                                    {item.itemName}
                                </h4>
                                <p className="item-description">
                                    {item.brand && `Marca: ${item.brand}`}
                                    {item.sku && ` • SKU: ${item.sku}`}
                                </p>
                                <div className="item-specs">
                                    <span className="quantity">Cantidad: {item.quantity}</span>
                                    <span className="unit-price">
                                        Precio unitario: ${item.unitPrice?.toFixed(2)}
                                    </span>
                                    {item.taxAmount > 0 && (
                                        <span className="tax-amount">
                                            Impuestos: ${item.taxAmount?.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="item-total">
                                ${item.totalPrice?.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Información de envío */}
            {order.shippingAddress && (
                <div className="shipping-section">
                    <h3>Dirección de envío</h3>
                    <div className="address-card">
                        <div className="address-details">
                            <p><strong>{order.customerFullName}</strong></p>
                            <p>{order.shippingAddress.street}</p>
                            {order.shippingAddress.additionalInfo && (
                                <p>{order.shippingAddress.additionalInfo}</p>
                            )}
                            <p>
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                            {order.customerPhone && (
                                <p>Teléfono: {order.customerPhone}</p>
                            )}
                            {order.customerEmail && (
                                <p>Email: {order.customerEmail}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Resumen de pago */}
            <div className="payment-summary">
                <h3>Resumen de pago</h3>
                <div className="summary-card">
                    <div className="summary-line">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {shipping > 0 && (
                        <div className="summary-line">
                            <span>Envío:</span>
                            <span>${shipping.toFixed(2)}</span>
                        </div>
                    )}
                    {tax > 0 && (
                        <div className="summary-line">
                            <span>Impuestos:</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="summary-line total">
                        <span>Total:</span>
                        <span>${order.orderTotal?.toFixed(2) || '0.00'}</span>
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="order-actions-detail">
                {(order.status === 'Delivered' || order.status === 'Entregado' || order.status === 'Completado') && (
                    <button 
                        className="btn-reorder-detail"
                        onClick={() => {
                            // Agregar items al carrito y redirigir
                            alert('Funcionalidad de reordenar próximamente');
                        }}
                    >
                        Volver a comprar
                    </button>
                )}
                {(order.status === 'Pending' || order.status === 'Pendiente' || order.status === 'Processing' || order.status === 'Procesando') && (
                    <button 
                        className={`btn-cancel ${(!canCancelInfo.canCancel || isCancelling || cancelLoading) ? 'disabled' : ''}`}
                        onClick={handleCancelOrder}
                        disabled={!canCancelInfo.canCancel || isCancelling || cancelLoading}
                        title={canCancelInfo.canCancel ? 'Cancelar este pedido' : canCancelInfo.message}
                    >
                        {isCancelling || cancelLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Cancelando...
                            </>
                        ) : (
                            'Cancelar pedido'
                        )}
                    </button>
                )}
                <button 
                    className="btn-support"
                    onClick={() => {
                        window.open('mailto:soporte@tienda.com?subject=Consulta sobre pedido ' + order.orderNumber, '_blank');
                    }}
                >
                    Contactar soporte
                </button>
                {order.trackingNumber && (
                    <button 
                        className="btn-track"
                        onClick={() => {
                            alert('Funcionalidad de seguimiento próximamente');
                        }}
                    >
                        Rastrear pedido
                    </button>
                )}
            </div>
        </div>
    );
};

export default OrderDetails;
