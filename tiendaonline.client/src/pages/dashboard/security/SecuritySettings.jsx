import { useState, useMemo } from 'react';
import { Button, Form, Card, Badge, Container, Row, Col, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import './SecuritySettings.css';
import AlertService from '../../../services/AlertService';

const SecuritySettings = () => {
  const navigate = useNavigate();
  // Simulación de datos de seguridad
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [email, setEmail] = useState('usuario@ejemplo.com');
  const [phone, setPhone] = useState('+1 809-555-1234');
  const [lastPasswordChange, setLastPasswordChange] = useState('2025-08-15');
  const [loginHistory] = useState([
    { date: '2025-09-28 10:12', device: 'Chrome (Mac)', location: 'Santo Domingo, DO', status: 'Exitoso' },
    { date: '2025-09-27 21:44', device: 'iPhone', location: 'Santo Domingo, DO', status: 'Exitoso' },
    { date: '2025-09-25 08:30', device: 'Edge (Windows)', location: 'Miami, US', status: 'Fallido' },
  ]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handle2FAToggle = async () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    await AlertService.success({
      title: twoFactorEnabled ? '2FA desactivado.' : '2FA activado.'
    });
  };

  const handlePasswordChange = async () => {
    setLastPasswordChange('2025-09-28');
    await AlertService.success({
      title: 'Contraseña cambiada exitosamente.'
    });
  };

  // Columnas para la tabla de historial
  const columns = useMemo(() => [
    {
      header: 'Fecha y Hora',
      accessorKey: 'date',
      cell: info => info.getValue(),
    },
    {
      header: 'Dispositivo',
      accessorKey: 'device',
      cell: info => info.getValue(),
    },
    {
      header: 'Ubicación',
      accessorKey: 'location',
      cell: info => info.getValue(),
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: info => info.getValue() === 'Exitoso' ? (
        <Badge bg="success">Exitoso</Badge>
      ) : (
        <Badge bg="danger">Fallido</Badge>
      ),
    },
  ], []);

  // Instancia de la tabla
  const table = useReactTable({
    data: loginHistory,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  return (
    <div className="admin-layout">
      <Container fluid className="admin-dashboard px-4">
        <Row className="mb-3 mt-3">
          <Col className='col-header-dashboard'>
            <Button variant="secondary" onClick={() => navigate('/dashboard')} className="me-3">
              ← Regresar al Dashboard
            </Button>
            <h2 className="dashboard-title d-inline-block">Seguridad de la Cuenta</h2>
          </Col>
        </Row>
        <Row className="mb-4 g-4">
          <Col md={4}>
            <Card className="summary-card completed-card h-100 security-card">
              <Card.Body>
                <div className="d-flex flex-column h-100 justify-content-between position-relative">
                  <div>
                    <Card.Title as="h3" className="security-card-title mb-1">2FA <span className="badge bg-success ms-2" style={{fontSize:'1rem',verticalAlign:'middle'}}>{twoFactorEnabled ? 'Activo' : 'Inactivo'}</span></Card.Title>
                    <div className="security-card-subtitle mb-3">Autenticación en dos pasos</div>
                    <div className="mb-3">
                      <span className="security-card-desc">Protege tu cuenta con un nivel extra de seguridad. Al activar 2FA, necesitarás un código adicional además de tu contraseña para iniciar sesión.</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-end justify-content-between w-100 mt-auto">
                    <Button size="lg" className="fw-bold px-4" variant={twoFactorEnabled ? 'outline-danger' : 'outline-light'} onClick={handle2FAToggle}>
                      {twoFactorEnabled ? 'Desactivar 2FA' : 'Activar 2FA'}
                    </Button>
                  </div>
                  <div className="security-card-icon">
                    <i className="bi bi-shield-lock"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="summary-card earnings-card h-100 security-card">
              <Card.Body>
                <div className="d-flex flex-column h-100 justify-content-between position-relative">
                  <div>
                    <Card.Title as="h3" className="security-card-title mb-1">Datos de Contacto</Card.Title>
                    <div className="security-card-subtitle mb-3">Correo electrónico y teléfono</div>
                    <div className="mb-3">
                      <span className="security-card-desc">Asegúrate de que tu información esté siempre actualizada para recuperar tu cuenta y recibir alertas importantes.</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="mb-2">
                      <span className="fw-bold">Correo:</span> <span className="security-card-contact">{email}</span>
                    </div>
                    <div>
                      <span className="fw-bold">Teléfono:</span> <span className="security-card-contact">{phone}</span>
                    </div>
                  </div>
                  <div className="security-card-icon">
                    <i className="bi bi-envelope-at"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="summary-card pending-card h-100 security-card">
              <Card.Body>
                <div className="d-flex flex-column h-100 justify-content-between position-relative">
                  <div>
                    <Card.Title as="h3" className="security-card-title mb-1">Contraseña</Card.Title>
                    <div className="security-card-subtitle mb-3">Gestión de acceso</div>
                    <div className="mb-3">
                      <span className="security-card-desc">Cambia tu contraseña regularmente y usa combinaciones seguras para proteger tu cuenta de accesos no autorizados.</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="fw-bold">Último cambio:</span> <span className="security-card-contact">{lastPasswordChange}</span>
                  </div>
                  <div className="d-flex align-items-end justify-content-between w-100 mt-auto">
                    <Button size="lg" className="fw-bold px-4" variant="outline-light" onClick={handlePasswordChange}>Cambiar contraseña</Button>
                  </div>
                  <div className="security-card-icon">
                    <i className="bi bi-key"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card className="table-card">
              <Card.Body>
                <Card.Title className="table-title">Historial de Inicios de Sesión</Card.Title>
                <div className="table-controls mb-3" style={{ justifyContent: 'flex-end' }}>
                  <Form.Control
                    type="search"
                    value={globalFilter || ''}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder="Buscar en historial..."
                    className="search-input me-2"
                    style={{ maxWidth: 300 }}
                  />
                  <Form.Select
                    value={table.getState().pagination.pageSize}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                    className="page-size-selector"
                    style={{ maxWidth: 160 }}
                  >
                    {[5, 10, 20, 30, 40, 50].map(pageSize => (
                      <option key={pageSize} value={pageSize}>
                        Mostrar {pageSize}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="table-responsive">
                  <table className="payments-table security-table" style={{ width: '100%' }}>
                    <thead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th key={header.id} className="text-nowrap">
                              {flexRender(header.column.columnDef.header, header.getContext())}
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
                  </table>
                </div>
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
                      {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                    </strong>
                  </span>
                  <span>
                    Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length} registros
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SecuritySettings;
