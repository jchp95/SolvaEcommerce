/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useMemo, useState, useEffect } from 'react';
import { formatImageUrl } from '../../../utils/Images';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import {
    PencilSquare,
    Eye,
    Trash
} from 'react-bootstrap-icons';
import { Table, Button, ButtonGroup, Form, Alert, Badge } from 'react-bootstrap';
import AlertService from '../../../services/AlertService';
import ModalProducts from '../../../components/modal/ModalProducts';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct, clearError } from '../../../features/reduxSlices/products/productsSlice';
import { showSpinner, hideSpinner } from '../../../features/reduxSlices/spinner/spinnerSlice';
import '../category/CategoriesList.css';

const ProductsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.items);
  const isLoading = useSelector((state) => state.products.loading);
  const error = useSelector((state) => state.products.error);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch products from Redux slice
  useEffect(() => {
    dispatch(showSpinner());
    dispatch(fetchProducts()).finally(() => dispatch(hideSpinner()));
  }, [dispatch]);

  // Define table columns
  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
        cell: info => <span className="product-id">#{info.getValue()}</span>,
        size: 80
      },
      {
        header: 'Imagen',
        accessorKey: 'imageUrl',
        cell: info => (
          info.getValue() ? (
            <img
              src={formatImageUrl(info.getValue())}
              alt="Producto"
              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/placeholder-product.png';
              }}
            />
          ) : (
            <span className="text-muted">Sin imagen</span>
          )
        ),
        size: 120
      },
      {
        header: 'Nombre',
        accessorKey: 'name',
        cell: info => <span className="product-name">{info.getValue()}</span>
      },
      {
        header: 'Descripción Corta',
        accessorKey: 'shortDescription',
        cell: info => (
          <span className="product-short-description">
            {info.getValue() || <span className="text-muted">-</span>}
          </span>
        )
      },
      {
        header: 'Precio',
        accessorKey: 'price',
        cell: info => (
          <div className="d-flex flex-column">
            <span className="product-price fw-bold">
              ${info.getValue().toFixed(2)}
            </span>
            {info.row.original.compareAtPrice && info.row.original.compareAtPrice > info.getValue() && (
              <span className="text-muted text-decoration-line-through small">
                ${info.row.original.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        ),
        size: 120
      },
      {
        header: 'Stock',
        accessorKey: 'stock',
        cell: info => {
          const stock = info.getValue();
          const isLowStock = info.row.original.trackInventory && stock <= info.row.original.minStockQuantity && stock > 0;
          const isOutOfStock = stock <= 0;
          
          return (
            <span className={`product-stock ${isOutOfStock ? 'text-danger fw-bold' : isLowStock ? 'text-warning' : 'text-success'}`}>
              {stock}
              {isLowStock && <span className="ms-1">⚠️</span>}
            </span>
          );
        },
        size: 100
      },
      {
        header: 'Marca',
        accessorKey: 'brand',
        cell: info => (
          <span className="product-brand">
            {info.getValue()}
          </span>
        ),
        size: 100
      },
      {
        header: 'Categoría',
        accessorKey: 'categoryName',
        cell: info => (
          <span className="product-category">
            {info.getValue()}
          </span>
        ),
        size: 120
      },
      {
        header: 'SKU',
        accessorKey: 'sku',
        cell: info => info.getValue() || <span className="text-muted">-</span>,
        size: 100
      },
      {
        header: 'Estado',
        accessorKey: 'isPublished',
        cell: info => (
          <Badge 
            bg={info.getValue() ? 'success' : 'secondary'}
            className="status-badge"
          >
            {info.getValue() ? 'Publicado' : 'Borrador'}
          </Badge>
        ),
        size: 100
      },
      {
        header: 'Destacado',
        accessorKey: 'isFeatured',
        cell: info => (
          info.getValue() ? (
            <Badge bg="warning" text="dark">⭐ Destacado</Badge>
          ) : (
            <span className="text-muted">-</span>
          )
        ),
        size: 100
      },
      {
        header: 'Envío Gratis',
        accessorKey: 'hasFreeShipping',
        cell: info => (
          info.getValue() ? (
            <Badge bg="info">🚚 Gratis</Badge>
          ) : (
            <span className="text-muted">-</span>
          )
        ),
        size: 100
      },
      {
        header: 'Rating',
        accessorKey: 'rating',
        cell: info => (
          <div className="d-flex align-items-center">
            <span className="text-warning me-1">★</span>
            <span>{info.getValue().toFixed(1)}</span>
            <span className="text-muted ms-1">({info.row.original.reviewCount})</span>
          </div>
        ),
        size: 100
      },
      {
        header: 'Acciones',
        accessorKey: 'actions',
        cell: ({ row }) => (
          <div className="d-flex gap-1 flex-wrap">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                dispatch(clearError()); // Limpiar errores previos
                setEditingProduct(row.original);
              }}
              title="Editar producto"
            >
              <PencilSquare />
            </Button>
            {!row.original.isPublished && (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => handlePublish(row.original.id)}
                title="Publicar producto"
              >
                <Eye />
              </Button>
            )}
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
              title="Eliminar producto"
            >
              <Trash />
            </Button>
          </div>
        ),
        size: 180
      },
    ],
    [products]
  );

  // Resto del código permanece igual...
  const table = useReactTable({
    data: products,
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

  // Handle delete product
  const handleDelete = async (id) => {
    const result = await AlertService.confirm({
      text: "¿Estás seguro que deseas eliminar este producto?",
    });
    if (!result.isConfirmed) return;
    try {
      dispatch(showSpinner());
      await dispatch(deleteProduct(id)).unwrap();
      dispatch(hideSpinner());
      await AlertService.success({
        text: 'El producto ha sido eliminado.',
      });
    } catch (err) {
      dispatch(hideSpinner());
      await AlertService.error({
        text: 'No se pudo eliminar el producto.',
      });
    }
  };

  // Handle publish product
  const handlePublish = async (id) => {
    const result = await AlertService.confirm({
      text: "¿Estás seguro que deseas publicar este producto?",
    });
    if (!result.isConfirmed) return;
    
    try {
      dispatch(showSpinner());
      // Aquí necesitamos un endpoint específico para publicar
      // Por ahora, vamos a simular con una actualización
      const response = await fetch(`/api/products/${id}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        dispatch(hideSpinner());
        await AlertService.success({
          text: 'El producto ha sido publicado exitosamente.',
        });
        // Recargar la lista de productos
        dispatch(fetchProducts());
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al publicar el producto');
      }
    } catch (err) {
      dispatch(hideSpinner());
      await AlertService.error({
        text: err.message || 'No se pudo publicar el producto.',
      });
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    // Recargar la lista de productos después de crear uno nuevo
    dispatch(fetchProducts());
  };

  const handleUpdateSuccess = () => {
    setEditingProduct(null);
    // Recargar la lista de productos después de actualizar uno
    dispatch(fetchProducts());
  };

  // Solo mostrar error si es un error de carga de productos, no de creación/edición
  if (error && isLoading === false && products.length === 0) return (
    <div className="container mt-4">
      <Alert variant="danger">
        {typeof error === 'string' ? error : error?.message || 'Error al cargar productos'}
      </Alert>
    </div>
  );

  return (
    <div className="modern-table-container">
      <div className="mb-3">
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          ← Regresar al Dashboard
        </Button>
      </div>
      
      {/* Mostrar error de productos (si existe) pero mantener la vista */}
      {error && products.length > 0 && (
        <Alert variant="warning" dismissible className="mb-3">
          <strong>Advertencia:</strong> {typeof error === 'string' ? error : error?.message || 'Hubo un problema con la operación'}
        </Alert>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="table-title">Lista de productos <Badge bg="primary">{products.length}</Badge></h2>
        <div className="d-flex gap-3">
          <Form.Control
            type="search"
            value={globalFilter || ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar productos..."
            className="search-input"
          />
          <Button
            variant="primary"
            onClick={() => {
              dispatch(clearError()); // Limpiar errores previos
              setShowCreateModal(true);
            }}
          >
            Nuevo Producto
          </Button>
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

      {/* Paginación y modales permanecen igual */}
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
      <ModalProducts
        show={showCreateModal}
        onHide={() => {
          dispatch(clearError()); // Limpiar errores al cerrar el modal
          setShowCreateModal(false);
        }}
        onSuccess={handleCreateSuccess}
      />

      {/* Modal para editar */}
      <ModalProducts
          show={!!editingProduct}
          onHide={() => {
            dispatch(clearError()); // Limpiar errores al cerrar el modal
            setEditingProduct(null);
          }}
          onSuccess={handleUpdateSuccess}
          isEditing={true}
          productId={editingProduct?.id}
          initialData={editingProduct || {}} // ← AGREGAR || {} PARA VALOR POR DEFECTO
          key={editingProduct?.id || 'create'}
      />
    </div>
  );
};

export default ProductsList;