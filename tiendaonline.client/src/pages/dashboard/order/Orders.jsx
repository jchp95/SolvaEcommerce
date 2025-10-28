import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Badge, 
  Button, 
  Form, 
  InputGroup,
  ButtonGroup,
  Modal,
  Alert,
  Spinner
} from 'react-bootstrap';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
  Eye,
  PencilSquare,
  Search,
  ArrowClockwise,
  Download,
  XLg
} from 'react-bootstrap-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  fetchOrdersForManagement, 
  updateOrderManagement, 
  clearErrors,
  selectManagementOrders,
  selectManagementLoading,
  selectManagementError,
  selectUpdateLoading,
  selectUpdateError
} from '../../../features/reduxSlices/orders/ordersSlice';
import AlertService from '../../../services/AlertService';
import './Orders.css';

const Orders = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const orders = useSelector(selectManagementOrders);
  const loading = useSelector(selectManagementLoading);
  const error = useSelector(selectManagementError);
  const updateLoading = useSelector(selectUpdateLoading);
  const updateError = useSelector(selectUpdateError);
  
  // Estados locales
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    shippingStatus: '',
    trackingNumber: '',
    adminNotes: ''
  });

  useEffect(() => {
    dispatch(clearErrors());
    dispatch(fetchOrdersForManagement());
  }, [dispatch]);

  // Define table columns
  const columns = useMemo(
    () => [
      {
        header: 'Pedido',
        accessorKey: 'orderNumber',
        cell: info => (
          <div>
            <span className="order-number">#{info.getValue()}</span>
            <br />
            <small className="order-id">ID: {info.row.original.id}</small>
          </div>
        ),
        size: 120
      },
      {
        header: 'Cliente',
        accessorKey: 'customerFullName',
        cell: info => (
          <div>
            <span className="customer-name">{info.getValue()}</span>
            <br />
            <small className="customer-email">{info.row.original.customerEmail}</small>
          </div>
        ),
        size: 200
      },
      {
        header: 'Fecha',
        accessorKey: 'orderDate',
        cell: info => (
          <small>{formatDate(info.getValue())}</small>
        ),
        size: 130
      },
      {
        header: 'Estado',
        accessorKey: 'status',
        cell: info => getStatusBadge(info.getValue()),
        size: 120
      },
      {
        header: 'Envío',
        accessorKey: 'shippingStatus',
        cell: info => (
          <div>
            {getShippingStatusBadge(info.getValue())}
            {info.row.original.trackingNumber && (
              <div>
                <small className="text-muted">
                  Tracking: {info.row.original.trackingNumber}
                </small>
              </div>
            )}
          </div>
        ),
        size: 150
      },
      {
        header: 'Total',
        accessorKey: 'orderTotal',
        cell: info => (
          <strong>{formatCurrency(info.getValue())}</strong>
        ),
        size: 100
      },
      {
        header: 'Acciones',
        accessorKey: 'actions',
        cell: ({ row }) => (
          <div className="d-flex gap-1">
            <Button
              size="sm"
              variant="outline-info"
              onClick={() => handleViewOrder(row.original)}
              title="Ver detalles"
            >
              <Eye />
            </Button>
            <Button
              size="sm"
              variant="outline-warning"
              onClick={() => handleUpdateOrder(row.original)}
              disabled={row.original.status === 'Cancelled' || row.original.status === 'Refunded'}
              title="Editar pedido"
            >
              <PencilSquare />
            </Button>
          </div>
        ),
        size: 120
      },
    ],
    [orders]
  );

  // Filtrar orders basado en filtros adicionales
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filtrar por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(order => 
            new Date(order.orderDate) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(order => 
            new Date(order.orderDate) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(order => 
            new Date(order.orderDate) >= filterDate
          );
          break;
      }
    }
    
    // Ordenar por fecha más reciente
    return filtered.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  }, [orders, statusFilter, dateFilter]);

  // React Table configuration
  const table = useReactTable({
    data: filteredOrders,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Funciones para manejar acciones
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleUpdateOrder = (order) => {
    setSelectedOrder(order);
    setUpdateData({
      status: order.status,
      shippingStatus: order.shippingStatus,
      trackingNumber: order.trackingNumber || '',
      adminNotes: order.adminNotes || ''
    });
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = async () => {
    try {
      const result = await dispatch(updateOrderManagement({
        orderId: selectedOrder.id,
        updateData
      })).unwrap();
      
      await AlertService.success({
        title: 'Orden actualizada',
        text: 'La orden ha sido actualizada exitosamente.',
        timer: 2000
      });
      
      setShowUpdateModal(false);
      setSelectedOrder(null);
      setUpdateData({
        status: '',
        shippingStatus: '',
        trackingNumber: '',
        adminNotes: ''
      });
    } catch (error) {
      await AlertService.error({
        title: 'Error',
        text: error || 'Ha ocurrido un error al actualizar la orden.'
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { variant: 'warning', text: 'Pendiente' },
      'Confirmed': { variant: 'info', text: 'Confirmado' },
      'Processing': { variant: 'info', text: 'Procesando' },
      'Shipped': { variant: 'primary', text: 'Enviado' },
      'Delivered': { variant: 'success', text: 'Entregado' },
      'Cancelled': { variant: 'danger', text: 'Cancelado' },
      'Refunded': { variant: 'secondary', text: 'Reembolsado' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getShippingStatusBadge = (shippingStatus) => {
    const statusConfig = {
      'NotShipped': { variant: 'secondary', text: 'No Enviado' },
      'Shipped': { variant: 'primary', text: 'Enviado' },
      'Delivered': { variant: 'success', text: 'Entregado' },
      'Returned': { variant: 'warning', text: 'Devuelto' }
    };
    
    const config = statusConfig[shippingStatus] || { variant: 'secondary', text: shippingStatus };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="orders-management-page">
      <Container fluid>
        {/* Header */}
        <div className="orders-header">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="orders-title">
                Gestión de Pedidos <Badge bg="primary">{filteredOrders.length}</Badge>
              </h2>
              <p className="orders-subtitle">
                Administra y actualiza el estado de los pedidos
              </p>
            </div>
            <div className="d-flex gap-2">
              <Form.Control
                type="search"
                value={globalFilter || ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Buscar pedidos..."
                className="search-input"
                style={{ width: '300px' }}
              />
              <Button
                variant="outline-primary"
                onClick={() => dispatch(fetchOrdersForManagement())}
                disabled={loading}
              >
                <ArrowClockwise className="me-2" />
                {loading ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <Button variant="outline-success">
                <Download className="me-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Additional Filters */}
          <Card className="filters-card">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Estado del pedido</Form.Label>
                    <Form.Select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Todos los estados</option>
                      <option value="Pending">Pendiente</option>
                      <option value="Confirmed">Confirmado</option>
                      <option value="Processing">Procesando</option>
                      <option value="Shipped">Enviado</option>
                      <option value="Delivered">Entregado</option>
                      <option value="Cancelled">Cancelado</option>
                      <option value="Refunded">Reembolsado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Período</Form.Label>
                    <Form.Select 
                      value={dateFilter} 
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="today">Hoy</option>
                      <option value="week">Última semana</option>
                      <option value="month">Último mes</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-secondary"
                      onClick={() => {
                        setGlobalFilter('');
                        setStatusFilter('all');
                        setDateFilter('all');
                      }}
                    >
                      <XLg className="me-2" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>

        {/* Error Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => dispatch(clearErrors())} className="mb-4">
            <XLg className="me-2" />
            <strong>Error:</strong> {error}
          </Alert>
        )}
        
        {updateError && (
          <Alert variant="danger" className="mb-4">
            <XLg className="me-2" />
            <strong>Error:</strong> {updateError}
          </Alert>
        )}

        {/* Orders Table */}
        <Card className="orders-table-card">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Cargando pedidos...</p>
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <div className="text-center py-5">
                <Search size={48} className="text-muted mb-3" />
                <h5>No se encontraron pedidos</h5>
                <p className="text-muted">
                  {globalFilter || statusFilter !== 'all' || dateFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Aún no hay pedidos registrados'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="orders-table">
                    <thead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th
                              key={header.id}
                              className="text-nowrap"
                              onClick={header.column.getToggleSortingHandler()}
                              style={{ width: header.getSize(), cursor: 'pointer' }}
                            >
                              <div className="d-flex align-items-center">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {{
                                  asc: <span className="ms-1">↑</span>,
                                  desc: <span className="ms-1">↓</span>,
                                }[header.column.getIsSorted()] ?? null}
                              </div>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* React Table Pagination */}
                <div className="table-pagination mt-3">
                  <ButtonGroup>
                    <Button
                      variant="outline-primary"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      «
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      ‹
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      ›
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      »
                    </Button>
                  </ButtonGroup>

                  <span className="mx-3">
                    Página{' '}
                    <strong>
                      {table.getState().pagination.pageIndex + 1} de{' '}
                      {table.getPageCount()}
                    </strong>
                  </span>

                  <Form.Select
                    value={table.getState().pagination.pageSize}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                    className="page-size-selector"
                  >
                    {[5, 10, 20, 30, 40, 50].map(pageSize => (
                      <option key={pageSize} value={pageSize}>
                        Mostrar {pageSize}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </>
            )}
          </Card.Body>
        </Card>

        {/* Order Details Modal */}
        <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Detalles del Pedido #{selectedOrder?.orderNumber}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedOrder && (
              <Row>
                <Col md={6}>
                  <h6>Información del Cliente</h6>
                  <p><strong>Nombre:</strong> {selectedOrder.customerFullName}</p>
                  <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                  <p><strong>Teléfono:</strong> {selectedOrder.customerPhone || 'No especificado'}</p>
                  
                  <h6 className="mt-4">Dirección de Envío</h6>
                  {selectedOrder.shippingAddress && (
                    <div>
                      <p>{selectedOrder.shippingAddress.street}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                      <p>{selectedOrder.shippingAddress.postalCode}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  )}
                </Col>
                <Col md={6}>
                  <h6>Detalles del Pedido</h6>
                  <p><strong>Fecha:</strong> {formatDate(selectedOrder.orderDate)}</p>
                  <p><strong>Estado:</strong> {getStatusBadge(selectedOrder.status)}</p>
                  <p><strong>Estado de Envío:</strong> {getShippingStatusBadge(selectedOrder.shippingStatus)}</p>
                  <p><strong>Método de Envío:</strong> {selectedOrder.shippingMethod || 'Estándar'}</p>
                  
                  <h6 className="mt-4">Totales</h6>
                  <p><strong>Subtotal:</strong> {formatCurrency(selectedOrder.subTotal)}</p>
                  <p><strong>Envío:</strong> {formatCurrency(selectedOrder.shippingTotal)}</p>
                  <p><strong>Impuestos:</strong> {formatCurrency(selectedOrder.taxTotal)}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedOrder.orderTotal)}</p>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Update Order Modal */}
        <Modal show={showUpdateModal} onHide={() => {
          setShowUpdateModal(false);
          dispatch(clearErrors());
        }}>
          <Modal.Header closeButton>
            <Modal.Title>Actualizar Pedido #{selectedOrder?.orderNumber}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {updateError && (
              <Alert variant="danger" className="mb-3">
                <XLg className="me-2" />
                {updateError}
              </Alert>
            )}
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estado del Pedido</Form.Label>
                    <Form.Select 
                      value={updateData.status}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="Pending">Pendiente</option>
                      <option value="Confirmed">Confirmado</option>
                      <option value="Processing">Procesando</option>
                      <option value="Shipped">Enviado</option>
                      <option value="Delivered">Entregado</option>
                      <option value="Cancelled">Cancelado</option>
                      <option value="Refunded">Reembolsado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Estado de Envío</Form.Label>
                    <Form.Select 
                      value={updateData.shippingStatus}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, shippingStatus: e.target.value }))}
                    >
                      <option value="NotShipped">No Enviado</option>
                      <option value="Shipped">Enviado</option>
                      <option value="Delivered">Entregado</option>
                      <option value="Returned">Devuelto</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Número de Seguimiento</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingresa el número de tracking"
                  value={updateData.trackingNumber}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Notas Administrativas</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Notas internas sobre el pedido"
                  value={updateData.adminNotes}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, adminNotes: e.target.value }))}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowUpdateModal(false);
              dispatch(clearErrors());
            }}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveUpdate}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Actualizando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default Orders;
