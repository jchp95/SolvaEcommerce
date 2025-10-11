import { useMemo, useState, useEffect } from 'react';
import { ReportsService } from '../../../api/endpoints/reports';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import { Table, ButtonGroup, Button, Form, Alert, Badge } from 'react-bootstrap';
import { useSpinner } from '../../../context/SpinnerContext';
import { useNavigate } from 'react-router-dom';
import '../reports/ReportsList.css';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const { showSpinner, hideSpinner } = useSpinner();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        showSpinner();
        const response = await ReportsService.getAll();
        setReports(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        hideSpinner();
      }
    };
    fetchReports();
  }, []);

  const columns = useMemo(
    () => [
      { header: 'ID', accessorKey: 'id', cell: info => <span>#{info.getValue()}</span>, size: 80 },
      { header: 'Tipo', accessorKey: 'type', cell: info => <span>{info.getValue()}</span> },
      { header: 'Descripción', accessorKey: 'description', cell: info => <span>{info.getValue()}</span> },
      { header: 'Fecha', accessorKey: 'date', cell: info => <span>{info.getValue()}</span> },
      { header: 'Total', accessorKey: 'total', cell: info => <span>${info.getValue()}</span>, size: 100 },
    ],
    [reports]
  );

  const table = useReactTable({
    data: reports,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (error) return (
    <div className="container mt-4">
      <Alert variant="danger">{error}</Alert>
    </div>
  );

  return (
    <div className="modern-table-container">
      <div className="mb-3">
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          ← Regresar al Dashboard
        </Button>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="table-title">Reportes <Badge>{reports.length}</Badge></h2>
        <Form.Control
          type="search"
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar reportes..."
          className="search-input"
        />
      </div>
      <div className="table-responsive">
        <Table hover className="products-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-nowrap"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="d-flex align-items-center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
      <div className="table-pagination mt-3">
        <ButtonGroup>
          <Button variant="outline-primary" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>«</Button>
          <Button variant="outline-primary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</Button>
          <Button variant="outline-primary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</Button>
          <Button variant="outline-primary" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>»</Button>
        </ButtonGroup>
        <span className="mx-3">
          Página <strong>{table.getState().pagination.pageIndex + 1} de {table.getPageCount()}</strong>
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
    </div>
  );
};

export default ReportsPage;