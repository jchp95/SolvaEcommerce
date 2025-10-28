import { useState, useMemo } from 'react';
import PaymentsTable from '../../components/paymentTable/PaymentsTable';
import { DashboardSidebar } from '../../components/sidebar/DashboardSidebar';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  ProgressBar
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
  Legend
} from 'recharts';
import { payments } from '../../mock/payments';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_currentView, setCurrentView] = useState('dashboard');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleNavigate = (view) => {
    setCurrentView(view);
    // Aquí puedes manejar la navegación a diferentes vistas
    console.log(`Navegando a: ${view}`);
    setSidebarOpen(false); // Cerrar sidebar después de navegar
  };


  const filteredPayments = useMemo(() => {
    const now = new Date();
    return payments.filter(payment => {
      const paymentDate = new Date(payment.date);
      if (filterPeriod === 'today') {
        return paymentDate.toDateString() === now.toDateString();
      } else if (filterPeriod === 'last7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return paymentDate >= sevenDaysAgo;
      } else if (filterPeriod === 'last30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return paymentDate >= thirtyDaysAgo;
      }
      return true;
    });
  }, [filterPeriod]);

  // Estadísticas principales
  const totalEarnings = useMemo(() => filteredPayments.reduce((sum, payment) => {
    if (payment.status === 'Completado') {
      return sum + payment.amount;
    }
    return sum;
  }, 0), [filteredPayments]);

  const paymentStatusCounts = useMemo(() => filteredPayments.reduce((counts, payment) => {
    counts[payment.status] = (counts[payment.status] || 0) + 1;
    return counts;
  }, {}), [filteredPayments]);

  // Datos para gráfico de barras
  const dailyEarnings = useMemo(() => {
    const earningsMap = new Map();
    filteredPayments.forEach(payment => {
      if (payment.status === 'Completado') {
        const date = new Date(payment.date).toLocaleDateString('es-MX', {
          month: 'short',
          day: 'numeric'
        });
        earningsMap.set(date, (earningsMap.get(date) || 0) + payment.amount);
      }
    });

    return Array.from(earningsMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [filteredPayments]);

  // Datos para gráfico circular de estados de pago
  const paymentStatusData = useMemo(() => {
    return Object.entries(paymentStatusCounts).map(([name, value]) => ({
      name,
      value,
      color: name === 'Completado' ? '#4CAF50' :
        name === 'Pendiente' ? '#FFC107' :
          name === 'Cancelado' ? '#F44336' : '#9E9E9E'
    }));
  }, [paymentStatusCounts]);

  // Valor máximo para escalado del gráfico
  const maxEarning = useMemo(() => {
    const amounts = dailyEarnings.map(item => item.amount);
    return Math.max(...(amounts.length ? amounts : [0]), 1000);
  }, [dailyEarnings]);

  // Colores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={toggleSidebar}
        onNavigate={handleNavigate}
      />

      <div className="main-content">
        <Container fluid className="admin-dashboard px-4">
          <Row className="mb-3 mt-3">
            <Col className='col-header-dashboard'>
              <Button
                variant="outline-primary"
                onClick={toggleSidebar}
                className="sidebar-toggle-btn me-3"
              >
                <i className="bi bi-list"></i> Menú
              </Button>
              <h2 className="dashboard-title d-inline-block">Dashboard de Administración</h2>
            </Col>
            <Col md="auto" className="d-flex align-items-center">
              <Form.Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="period-selector"
              >
                <option value="all">Todas las Fechas</option>
                <option value="today">Hoy</option>
                <option value="last7days">Últimos 7 Días</option>
                <option value="last30days">Últimos 30 Días</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Tarjetas de Resumen */}
          <Row className="mb-4 g-4">
            <Col md={4}>
              <Card className="summary-card earnings-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">GANANCIAS TOTALES</h6>
                      <h2 className="card-value">${totalEarnings.toFixed(2)}</h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-currency-dollar"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={(totalEarnings / (totalEarnings + 1000)) * 100} // Ejemplo de progreso
                    className="mt-3"
                    variant="success"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="summary-card completed-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">PAGOS COMPLETADOS</h6>
                      <h2 className="card-value">{paymentStatusCounts['Completado'] || 0}</h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={(paymentStatusCounts['Completado'] || 0) / filteredPayments.length * 100 || 0}
                    className="mt-3"
                    variant="primary"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="summary-card pending-card security-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="card-title">PAGOS PENDIENTES</h6>
                      <h2 className="card-value">{paymentStatusCounts['Pendiente'] || 0}</h2>
                    </div>
                    <div className="dashboard-card-icon">
                      <i className="bi bi-clock"></i>
                    </div>
                  </div>
                  <ProgressBar
                    now={(paymentStatusCounts['Pendiente'] || 0) / filteredPayments.length * 100 || 0}
                    className="mt-3"
                    variant="warning"
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Gráficos */}
          <Row className="mb-4 g-4">
            {/* Gráfico de Barras - Ganancias por Día */}
            <Col md={8}>
              <Card className="chart-card">
                <Card.Body>
                  <Card.Title className="chart-title">Ganancias por Día</Card.Title>
                  <div className="chart-container" style={{ height: '400px' }}>
                    {dailyEarnings.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dailyEarnings}
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
                            domain={[0, maxEarning * 1.1]} // 10% más de espacio
                            tick={{ fill: '#666' }}
                          />
                          <Tooltip
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Ganancias']}
                            labelFormatter={(label) => `Fecha: ${label}`}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Bar
                            dataKey="amount"
                            name="Ganancias"
                            fill="#8884d8"
                            radius={[4, 4, 0, 0]}
                            animationDuration={1500}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="no-data-message">
                        <i className="bi bi-graph-up"></i>
                        <p>No hay datos de ganancias para el período seleccionado</p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Gráfico Circular - Distribución de Estados */}
            <Col md={4}>
              <Card className="chart-card">
                <Card.Body>
                  <Card.Title className="chart-title">Estados de Pagos</Card.Title>
                  <div className="chart-container" style={{ height: '400px' }}>
                    {paymentStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentStatusData}
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
                            {paymentStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [`${value} pagos`, name]}
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
                        <p>No hay datos de pagos para el período seleccionado</p>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Payments Table */}
          <Row>
            <Col>
              <Card className="table-card">
                <Card.Body>
                  <Card.Title className="table-title">Pagos Realizados</Card.Title>
                  <PaymentsTable data={filteredPayments} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

        </Container>
      </div>
    </div>
  );
};

export default AdminDashboard;