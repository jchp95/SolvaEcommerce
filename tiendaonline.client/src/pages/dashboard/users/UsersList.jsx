import { useMemo, useState, useEffect } from 'react';
import { UsersService } from '../../../api/endpoints/users';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import { Table, Button, ButtonGroup, Form, Alert, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { showSpinner, hideSpinner } from '../../../features/reduxSlices/spinner/spinnerSlice';
import ModalUser from '../../../components/modal/ModalUser';
import { useNavigate } from 'react-router-dom';
import './UsersList.css';

const UsersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false); // Para futuro modal de crear usuario
  const [editingUser, setEditingUser] = useState(null); // Para futuro modal de editar usuario

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        dispatch(showSpinner());
        const response = await UsersService.getAll();
        setUsers(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        dispatch(hideSpinner());
      }
    };
    fetchUsers();
  }, []);

  const columns = useMemo(
    () => [
      { header: 'ID', accessorKey: 'id', cell: info => <span>#{info.getValue()}</span>, size: 80 },
      { header: 'Usuario', accessorKey: 'userName', cell: info => <span>{info.getValue()}</span> },
      { header: 'Email', accessorKey: 'email', cell: info => <span>{info.getValue()}</span> },
      { header: 'Teléfono', accessorKey: 'phoneNumber', cell: info => <span>{info.getValue() || '-'}</span> },
      { header: 'Email Confirmado', accessorKey: 'emailConfirmed', cell: info => info.getValue() ? <Badge bg="success">Sí</Badge> : <Badge bg="secondary">No</Badge> },
      { header: '2FA', accessorKey: 'twoFactorEnabled', cell: info => info.getValue() ? <Badge bg="success">Sí</Badge> : <Badge bg="secondary">No</Badge> },
      { header: 'Bloqueado', accessorKey: 'lockoutEnabled', cell: info => info.getValue() ? <Badge bg="danger">Sí</Badge> : <Badge bg="success">No</Badge> },
      {
        header: 'Acciones',
        accessorKey: 'actions',
        cell: ({ row }) => (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setEditingUser(row.original)}
          >
            Editar
          </Button>
        ),
        size: 120
      },
    ],
    [users]
  );

  const table = useReactTable({
    data: users,
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

  const handleUpdateSuccess = async (updatedUser) => {
    try {
      dispatch(showSpinner());
      await UsersService.update(updatedUser.id, {
        id: updatedUser.id,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        userName: updatedUser.userName,
        lockoutEnabled: updatedUser.lockoutEnabled,
        twoFactorEnabled: updatedUser.twoFactorEnabled
      });
      setUsers(users.map(user =>
        user.id === updatedUser.id
          ? { ...user, email: updatedUser.email, phoneNumber: updatedUser.phoneNumber, userName: updatedUser.userName }
          : user
      ));
      setEditingUser(null);
    } catch (err) {
      setError('Error al actualizar el usuario');
    } finally {
      dispatch(hideSpinner());
    }
  };

  return (
    <div className="modern-table-container">
      <div className="mb-3">
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          ← Regresar al Dashboard
        </Button>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="table-title">Lista de usuarios <Badge>{users.length}</Badge></h2>
        <div className="d-flex gap-3">
          <Form.Control
            type="search"
            value={globalFilter || ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar usuarios..."
            className="search-input"
          />
          {/* <Button variant="primary" onClick={() => setShowCreateModal(true)}>Nuevo Usuario</Button> */}
        </div>
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
      {/*
      <ModalUser
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
      */}
      <ModalUser
        show={!!editingUser}
        onHide={() => setEditingUser(null)}
        onSuccess={handleUpdateSuccess}
        isEditing={true}
        userId={editingUser?.id}
        initialData={editingUser}
        key={editingUser?.id || 'edit'}
        canEditUserName={true}
      />
    </div>
  );
};

export default UsersList;
