import { useState, useEffect, useMemo } from 'react';
import { DashboardSidebar } from '../../components/sidebar/DashboardSidebar.jsx';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  ProgressBar,
  Alert,
  Spinner,
  Table
} from 'react-bootstrap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { SupplierService } from '../../api/endpoints/supplier.jsx';
import './SupplierDashboard.css';

const SupplierDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_currentView, setCurrentView] = useState('dashboard');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierInfo, setSupplierInfo] = useState(null);
  const [stripeAccountStatus, setStripeAccountStatus] = useState(null);
  const [loadingStripe, setLoadingStripe] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleNavigate = (view) => {
    setCurrentView(view);
    console.log(`Navegando a: ${view}`);
    setSidebarOpen(false);
  };

  // Cargar información del proveedor y dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Primero obtener la info del proveedor actual
        const supplier = await SupplierService.getMySupplier();
        setSupplierInfo(supplier);

        // Luego obtener el dashboard
        const dashboard = await SupplierService.getDashboard(supplier.id);
        setDashboardData(dashboard);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
        setError('Error al cargar las estadísticas del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Cargar estado de la cuenta de Stripe
  useEffect(() => {
    const loadStripeStatus = async () => {
      try {
        const status = await SupplierService.getStripeAccountStatus();
        setStripeAccountStatus(status.data);
      } catch (err) {
        console.error('Error cargando estado de Stripe:', err);
      }
    };

    if (supplierInfo) {
      loadStripeStatus();
    }
  }, [supplierInfo]);

  // Manejar creación de cuenta de Stripe
  const handleCreateStripeAccount = async () => {
    try {
      setLoadingStripe(true);
      const response = await SupplierService.createStripeAccount();
      
      if (response.success) {
        // Obtener el link de onboarding
        const onboardingResponse = await SupplierService.getStripeOnboardingLink(
          `${window.location.origin}/dashboard/supplier?success=true`,
          `${window.location.origin}/dashboard/supplier?refresh=true`
        );
        
        if (onboardingResponse.success && onboardingResponse.data.url) {
          // Redirigir al usuario al proceso de onboarding de Stripe
          window.location.href = onboardingResponse.data.url;
        }
      }
    } catch (err) {
      console.error('Error al crear cuenta de Stripe:', err);
      setError('Error al configurar la cuenta de Stripe. Por favor, intenta nuevamente.');
    } finally {
      setLoadingStripe(false);
    }
  };

  // Manejar acceso al dashboard de Stripe
  const handleOpenStripeDashboard = async () => {
    try {
      setLoadingStripe(true);
      const response = await SupplierService.getStripeDashboardLink();
      
      if (response.success && response.data.url) {
        // Abrir el dashboard de Stripe en una nueva ventana
        window.open(response.data.url, '_blank');
      }
    } catch (err) {
      console.error('Error al abrir dashboard de Stripe:', err);
      setError('Error al acceder al dashboard de Stripe.');
    } finally {
      setLoadingStripe(false);
    }
  };

  // Filtrar datos por período
  const filteredMonthlyIncome = useMemo(() => {
    if (!dashboardData?.monthlyIncome) return [];

    const now = new Date();
    return dashboardData.monthlyIncome.filter(item => {
      const itemDate = new Date(item.year, item.month - 1);
      if (filterPeriod === 'last3months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return itemDate >= threeMonthsAgo;
      } else if (filterPeriod === 'last6months') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return itemDate >= sixMonthsAgo;
      }
      return true;
    });
  }, [dashboardData, filterPeriod]);

  // Formatear datos para gráficos
  const monthlyIncomeData = useMemo(() => {
    return filteredMonthlyIncome.map(item => ({
      name: `${item.month}/${item.year}`,
      income: item.income
    }));
  }, [filteredMonthlyIncome]);

  // Datos para gráfico de órdenes
  const ordersData = useMemo(() => {
    if (!dashboardData) return [];
    return [
      { name: 'Pendientes', value: dashboardData.pendingOrders, color: '#FFC107' },
      { name: 'Completadas', value: dashboardData.completedOrders, color: '#4CAF50' },
      { name: 'Canceladas', value: dashboardData.cancelledOrders, color: '#F44336' }
    ];
  }, [dashboardData]);

  const totalOrders = useMemo(() => {
    return ordersData.reduce((sum, item) => sum + item.value, 0);
  }, [ordersData]);

  // Valor máximo para el gráfico de ingresos
  const maxIncome = useMemo(() => {
    const incomes = monthlyIncomeData.map(item => item.income);
    return Math.max(...(incomes.length ? incomes : [0]), 1000);
  }, [monthlyIncomeData]);

  if (loading) {
    return (
      <div className="admin-layout">
        <Container fluid className="supplier-dashboard px-4 d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <Spinner animation="border" variant="primary" />
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <Container fluid className="supplier-dashboard px-4">
          <Alert variant="danger" className="mt-4">{error}</Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={toggleSidebar}
        onNavigate={handleNavigate}
      />

      <div className="main-content">
        <Container fluid className="supplier-dashboard px-4">
          <Row className="mb-3 mt-3">
            <Col className='col-header-dashboard'>
              <Button
                variant="outline-primary"
                onClick={toggleSidebar}
                className="sidebar-toggle-btn me-3"
              >
                <i className="bi bi-list"></i> Menú
              </Button>
              <h2 className="dashboard-title d-inline-block">
                Dashboard de Proveedor
                {supplierInfo && <span className="supplier-name"> - {supplierInfo.companyName}</span>}
              </h2>
            </Col>
            <Col md="auto" className="d-flex align-items-center">
              <Form.Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="period-selector"
              >
                <option value="all">Todos los Meses</option>
                <option value="last3months">Últimos 3 Meses</option>
                <option value="last6months">Últimos 6 Meses</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Tarjetas de Resumen */}
          <Row className="mb-4 g-4">
            <Col md={3}>
              <Card className="summary-card earnings-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">VENTAS TOTALES</h6>
                      <h2 className="card-value">${dashboardData?.totalSales?.toFixed(2) || '0.00'}</h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-currency-dollar"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={100}
                    className="mt-3"
                    variant="success"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="summary-card products-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">PRODUCTOS ACTIVOS</h6>
                      <h2 className="card-value">{dashboardData?.activeProducts || 0}</h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-box-seam"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={(dashboardData?.activeProducts || 0) > 0 ? 100 : 0}
                    className="mt-3"
                    variant="info"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="summary-card stock-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">STOCK TOTAL</h6>
                      <h2 className="card-value">{dashboardData?.totalStock || 0}</h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-boxes"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={(dashboardData?.totalStock || 0) > 0 ? 100 : 0}
                    className="mt-3"
                    variant="primary"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="summary-card rating-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">VALORACIÓN</h6>
                      <h2 className="card-value">
                        {dashboardData?.averageRating ? dashboardData.averageRating.toFixed(1) : 'N/A'}
                        {dashboardData?.averageRating && <i className="bi bi-star-fill ms-2" style={{ fontSize: '1.5rem', color: '#FFC107' }}></i>}
                      </h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-star"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={dashboardData?.averageRating ? (dashboardData.averageRating / 5) * 100 : 0}
                    className="mt-3"
                    variant="warning"
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Segunda fila de tarjetas - Órdenes */}
          <Row className="mb-4 g-4">
            <Col md={4}>
              <Card className="summary-card pending-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">ÓRDENES PENDIENTES</h6>
                      <h2 className="card-value">{dashboardData?.pendingOrders || 0}</h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-clock-history"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={totalOrders > 0 ? (dashboardData?.pendingOrders / totalOrders) * 100 : 0}
                    className="mt-3"
                    variant="warning"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="summary-card completed-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">ÓRDENES COMPLETADAS</h6>
                      <h2 className="card-value">{dashboardData?.completedOrders || 0}</h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={totalOrders > 0 ? (dashboardData?.completedOrders / totalOrders) * 100 : 0}
                    className="mt-3"
                    variant="success"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="summary-card cancelled-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">ÓRDENES CANCELADAS</h6>
                      <h2 className="card-value">{dashboardData?.cancelledOrders || 0}</h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-x-circle"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={totalOrders > 0 ? (dashboardData?.cancelledOrders / totalOrders) * 100 : 0}
                    className="mt-3"
                    variant="danger"
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Configuración de Pagos - Stripe Connect */}
          <Row className="mb-4">
            <Col md={12}>
              <Card className="security-card stripe-connect-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <Card.Title className="mb-1">
                        <i className="bi bi-credit-card me-2"></i>
                        Configuración de Pagos - Stripe Connect
                      </Card.Title>
                      <p className="text-muted mb-0">
                        Configura tu cuenta de Stripe para recibir pagos de tus ventas
                      </p>
                    </div>
                    <div>
                      <img 
                        src="https://stripe.com/img/v3/home/social.png" 
                        alt="Stripe" 
                        style={{ height: '30px' }}
                      />
                    </div>
                  </div>

                  {stripeAccountStatus ? (
                    <>
                      {!stripeAccountStatus.hasAccount ? (
                        <Alert variant="info" className="mb-3">
                          <i className="bi bi-info-circle me-2"></i>
                          Para recibir pagos de tus ventas, necesitas configurar una cuenta de Stripe Connect.
                          Es un proceso rápido y seguro.
                        </Alert>
                      ) : stripeAccountStatus.enabled ? (
                        <Alert variant="success" className="mb-3">
                          <i className="bi bi-check-circle me-2"></i>
                          Tu cuenta de Stripe está completamente configurada y activa. Puedes recibir pagos.
                        </Alert>
                      ) : (
                        <Alert variant="warning" className="mb-3">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Tu cuenta de Stripe necesita información adicional para estar completamente configurada.
                        </Alert>
                      )}

                      <Row className="g-3">
                        <Col md={3}>
                          <div className="stripe-status-item">
                            <small className="text-muted d-block">Estado de Cuenta</small>
                            <strong>
                              {stripeAccountStatus.hasAccount ? (
                                <span className="text-success">
                                  <i className="bi bi-check-circle-fill me-1"></i>
                                  Creada
                                </span>
                              ) : (
                                <span className="text-secondary">
                                  <i className="bi bi-x-circle me-1"></i>
                                  No configurada
                                </span>
                              )}
                            </strong>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="stripe-status-item">
                            <small className="text-muted d-block">Información Completa</small>
                            <strong>
                              {stripeAccountStatus.detailsSubmitted ? (
                                <span className="text-success">
                                  <i className="bi bi-check-circle-fill me-1"></i>
                                  Sí
                                </span>
                              ) : (
                                <span className="text-warning">
                                  <i className="bi bi-exclamation-circle me-1"></i>
                                  Pendiente
                                </span>
                              )}
                            </strong>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="stripe-status-item">
                            <small className="text-muted d-block">Cobros Habilitados</small>
                            <strong>
                              {stripeAccountStatus.chargesEnabled ? (
                                <span className="text-success">
                                  <i className="bi bi-check-circle-fill me-1"></i>
                                  Sí
                                </span>
                              ) : (
                                <span className="text-secondary">
                                  <i className="bi bi-x-circle me-1"></i>
                                  No
                                </span>
                              )}
                            </strong>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="stripe-status-item">
                            <small className="text-muted d-block">Pagos Habilitados</small>
                            <strong>
                              {stripeAccountStatus.payoutsEnabled ? (
                                <span className="text-success">
                                  <i className="bi bi-check-circle-fill me-1"></i>
                                  Sí
                                </span>
                              ) : (
                                <span className="text-secondary">
                                  <i className="bi bi-x-circle me-1"></i>
                                  No
                                </span>
                              )}
                            </strong>
                          </div>
                        </Col>
                      </Row>

                      <div className="mt-4 d-flex gap-3">
                        {!stripeAccountStatus.hasAccount ? (
                          <Button 
                            variant="primary" 
                            onClick={handleCreateStripeAccount}
                            disabled={loadingStripe}
                          >
                            {loadingStripe ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Configurando...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-plus-circle me-2"></i>
                                Configurar Cuenta de Stripe
                              </>
                            )}
                          </Button>
                        ) : (
                          <>
                            {!stripeAccountStatus.enabled && (
                              <Button 
                                variant="warning" 
                                onClick={handleCreateStripeAccount}
                                disabled={loadingStripe}
                              >
                                {loadingStripe ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Cargando...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-pencil-square me-2"></i>
                                    Completar Información
                                  </>
                                )}
                              </Button>
                            )}
                            <Button 
                              variant="outline-primary" 
                              onClick={handleOpenStripeDashboard}
                              disabled={loadingStripe}
                            >
                              {loadingStripe ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  Abriendo...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-box-arrow-up-right me-2"></i>
                                  Abrir Dashboard de Stripe
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>

                      {stripeAccountStatus.hasAccount && stripeAccountStatus.accountId && (
                        <div className="mt-3">
                          <small className="text-muted">
                            ID de Cuenta: <code>{stripeAccountStatus.accountId}</code>
                          </small>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2 text-muted">Cargando información de Stripe...</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Gráficos */}
          <Row className="mb-4 g-4">
            {/* Gráfico de Línea - Ingresos por Mes */}
            <Col md={8}>
              <Card className="chart-card">
                <Card.Body>
                  <Card.Title className="chart-title">Ingresos Mensuales</Card.Title>
                  <div className="chart-container" style={{ height: '400px' }}>
                    {monthlyIncomeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={monthlyIncomeData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tick={{ fill: '#666' }}
                          />
                          <YAxis
                            tickFormatter={(value) => `$${value}`}
                            domain={[0, maxIncome * 1.1]}
                            tick={{ fill: '#666' }}
                          />
                          <Tooltip
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Ingresos']}
                            labelFormatter={(label) => `Mes: ${label}`}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="income"
                            name="Ingresos"
                            stroke="#8884d8"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            activeDot={{ r: 8 }}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-data-message">
                        <i className="bi bi-graph-up"></i>
                        <p>No hay datos de ingresos para el período seleccionado</p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Gráfico Circular - Distribución de Órdenes */}
            <Col md={4}>
              <Card className="chart-card">
                <Card.Body>
                  <Card.Title className="chart-title">Estado de Órdenes</Card.Title>
                  <div className="chart-container" style={{ height: '400px' }}>
                    {ordersData.some(item => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={ordersData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            animationDuration={1500}
                          >
                            {ordersData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [`${value} órdenes`, name]}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-data-message">
                        <i className="bi bi-pie-chart"></i>
                        <p>No hay datos de órdenes disponibles</p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Alertas de Bajo Stock y Productos Más Vendidos */}
          <Row className="mb-4 g-4">
            {/* Alertas de Bajo Stock */}
            <Col md={6}>
              <Card className="table-card">
                <Card.Body>
                  <Card.Title className="table-title">
                    <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
                    Alertas de Bajo Stock
                  </Card.Title>
                  {dashboardData?.lowStockAlerts && dashboardData.lowStockAlerts.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover className="low-stock-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th className="text-center">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.lowStockAlerts.map((alert) => (
                            <tr key={alert.productId}>
                              <td className="product-name">{alert.productName}</td>
                              <td className="text-center">
                                <span className="badge bg-warning text-dark">
                                  {alert.stock} unidades
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="no-data-message">
                      <i className="bi bi-check-circle"></i>
                      <p>No hay productos con bajo stock</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Productos Más Vendidos */}
            <Col md={6}>
              <Card className="table-card">
                <Card.Body>
                  <Card.Title className="table-title">
                    <i className="bi bi-trophy-fill me-2 text-warning"></i>
                    Top 5 Productos Más Vendidos
                  </Card.Title>
                  {dashboardData?.topProducts && dashboardData.topProducts.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover className="top-products-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th className="text-center">Vendidos</th>
                            <th className="text-end">Ventas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.topProducts.map((product, index) => (
                            <tr key={product.productId}>
                              <td>
                                <span className="ranking-badge me-2">#{index + 1}</span>
                                {product.productName}
                              </td>
                              <td className="text-center">
                                <span className="badge bg-primary">
                                  {product.quantitySold}
                                </span>
                              </td>
                              <td className="text-end text-success fw-bold">
                                ${product.totalSales.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="no-data-message">
                      <i className="bi bi-graph-down"></i>
                      <p>No hay datos de ventas disponibles</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

        </Container>
      </div>
    </div>
  );
};

export default SupplierDashboard;

