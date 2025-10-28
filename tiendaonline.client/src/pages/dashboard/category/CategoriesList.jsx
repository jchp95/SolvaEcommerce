/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCategories,
  deleteCategory
} from '../../../features/reduxSlices/categories/categoriesSlice';
import {
  showSpinner,
  hideSpinner
} from '../../../features/reduxSlices/spinner/spinnerSlice';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import { Table, Button, ButtonGroup, Form, Alert, Badge } from 'react-bootstrap';
import AlertService from '../../../services/AlertService';
import ModalCategories from '../../../components/modal/ModalCategories';
import { useNavigate } from 'react-router-dom';
import './CategoriesList.css';

const CategoriesList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.categories.items);
  const isLoading = useSelector((state) => state.categories.loading);
  const error = useSelector((state) => state.categories.error);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Fetch categories from Redux slice
  useEffect(() => {
    dispatch(showSpinner());
    dispatch(fetchCategories()).finally(() => dispatch(hideSpinner()));
  }, [dispatch]);

  // Define table columns - mantener useMemo como en la versión vieja
  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
        cell: info => <span className="category-id">#{info.getValue()}</span>,
        size: 80
      },
      {
        header: 'Nombre',
        accessorKey: 'name',
        cell: info => <span className="category-name">{info.getValue()}</span>
      },
      {
        header: 'Slug',
        accessorKey: 'slug',
        cell: info => <span className="category-slug">{info.getValue()}</span>,
        size: 120
      },
      {
        header: 'Descripción',
        accessorKey: 'description',
        cell: info => (
          <span className="category-description">
            {info.getValue() || <span className="text-muted">Sin descripción</span>}
          </span>
        )
      },
      {
        header: 'Categoría Padre',
        accessorKey: 'parentCategoryId',
        cell: info => {
          const parentId = info.getValue();
          if (!parentId) return <span className="text-muted">Ninguna</span>;
          
          const parentCategory = categories.find(cat => cat.id === parentId);
          return (
            <span className="category-parent">
              {parentCategory ? parentCategory.name : `#${parentId}`}
            </span>
          );
        },
        size: 150
      },
      {
        header: 'Meta Título',
        accessorKey: 'metaTitle',
        cell: info => (
          <span className="category-metaTitle">
            {info.getValue() || <span className="text-muted">Sin meta título</span>}
          </span>
        )
      },
      {
        header: 'Meta Descripción',
        accessorKey: 'metaDescription',
        cell: info => (
          <span className="category-metaDescription">
            {info.getValue() || <span className="text-muted">Sin meta descripción</span>}
          </span>
        )
      },
      {
        header: 'Orden',
        accessorKey: 'displayOrder',
        cell: info => <span className="category-order">{info.getValue()}</span>,
        size: 80
      },
      {
        header: 'Estado',
        accessorKey: 'isActive',
        cell: info => (
          <Badge bg={info.getValue() ? 'success' : 'secondary'}>
            {info.getValue() ? 'Activa' : 'Inactiva'}
          </Badge>
        ),
        size: 100
      },
      {
        header: 'Fecha Creación',
        accessorKey: 'createdAt',
        cell: info => {
          const date = info.getValue();
          if (!date) return <span className="text-muted">N/A</span>;
          return (
            <span className="category-createdAt">
              {new Date(date).toLocaleDateString('es-ES')}
            </span>
          );
        },
        size: 120
      },
      {
        header: 'Fecha Actualización',
        accessorKey: 'updatedAt',
        cell: info => {
          const date = info.getValue();
          if (!date) return <span className="text-muted">N/A</span>;
          return (
            <span className="category-updatedAt">
              {new Date(date).toLocaleDateString('es-ES')}
            </span>
          );
        },
        size: 120
      },
      {
        header: 'Acciones',
        accessorKey: 'actions',
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setEditingCategory(row.original)}
            >
              Editar
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              disabled={!row.original.isActive}
            >
              Eliminar
            </Button>
          </div>
        ),
        size: 150
      },
    ],
    [categories] // Mantener la misma dependencia que la versión vieja
  );

  // Table instance
  const table = useReactTable({
    data: categories,
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

  // Handle delete category
  const handleDelete = async (id) => {
    const result = await AlertService.confirm({
      text: "¿Estás seguro que deseas eliminar esta categoría?",
    });
    if (!result.isConfirmed) return;
    try {
      dispatch(showSpinner());
      await dispatch(deleteCategory(id)).unwrap();
      dispatch(hideSpinner());
      await AlertService.success({
        text: 'La categoría ha sido eliminada.',
      });
    } catch (err) {
      dispatch(hideSpinner());
      await AlertService.error({
        text: 'No se pudo eliminar la categoría.',
      });
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
  };

  const handleUpdateSuccess = () => {
    setEditingCategory(null);
  };

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
        <h2 className="table-title">Lista de Categorías <Badge>{categories.length}</Badge></h2>
        <div className="d-flex gap-3">
          <Form.Control
            type="search"
            value={globalFilter || ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar categorías..."
            className="search-input"
          />
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            Nueva Categoría
          </Button>
        </div>
      </div>

      <div className="table-responsive">
        <Table hover className="categories-table">
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

      {/* Modal para crear */}
      <ModalCategories
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Modal para editar */}
      <ModalCategories
        show={!!editingCategory}
        onHide={() => setEditingCategory(null)}
        onSuccess={handleUpdateSuccess}
        isEditing={true}
        categoryId={editingCategory?.id}
        initialData={{
          name: editingCategory?.name || '',
          description: editingCategory?.description || '',
          slug: editingCategory?.slug || '',
          metaTitle: editingCategory?.metaTitle || '',
          metaDescription: editingCategory?.metaDescription || '',
          displayOrder: editingCategory?.displayOrder || 0,
          parentCategoryId: editingCategory?.parentCategoryId || null,
          isActive: editingCategory?.isActive || false,
        }}
        key={editingCategory?.id || 'create'}
      />
    </div>
  );
};

export default CategoriesList;