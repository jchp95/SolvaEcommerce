/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useMemo, useState, useEffect } from 'react';
import { ProductService } from '../../../api/endpoints/products';
import { formatImageUrl } from '../../../utils/Images';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
} from '@tanstack/react-table';
import { Table, Button, ButtonGroup, Form, Alert, Badge } from 'react-bootstrap';
import { useSpinner } from '../../../context/SpinnerContext';
import AlertService from '../../../services/AlertService';
import ModalProducts from '../../../components/modal/ModalProducts';
import { useNavigate } from 'react-router-dom';
import '../category/CategoriesList.css';

const ProductsList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { showSpinner, hideSpinner } = useSpinner();

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        showSpinner();
        const response = await ProductService.getAll();
        console.log('Datos recibidos:', response.data); // <-- Agrega esto
        setProducts(response.data);
      }
      catch (err) {
        setError(err.message);
      }
      finally {
        hideSpinner();
      }
    };

    fetchProducts();
  }, []);

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
        header: 'Descripción',
        accessorKey: 'description',
        cell: info => (
          <span className="product-description">
            {info.getValue() || <span className="text-muted">Sin descripción</span>}
          </span>
        )
      },
      {
        header: 'Precio',
        accessorKey: 'price',
        cell: info => (
          <span className="product-price">
            ${info.getValue().toFixed(2)}
          </span>
        ),
        size: 100
      },
      {
        header: 'Stock',
        accessorKey: 'stock',
        cell: info => (
          <span className={`product-stock ${info.getValue() <= 0 ? 'text-danger' : ''}`}>
            {info.getValue()}
          </span>
        ),
        size: 80
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
        header: 'Acciones',
        accessorKey: 'actions',
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setEditingProduct(row.original)}
            >
              Editar
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
            >
              Eliminar
            </Button>
          </div>
        ),
        size: 150
      },
    ],
    [products]
  );

  // Table instance
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
      showSpinner();
      await ProductService.delete(id);
      setProducts(products.filter(product => product.id !== id));
      hideSpinner();
      await AlertService.success({
        text: 'El producto ha sido eliminado.',
      });
    } catch (err) {
      hideSpinner();
      setError('Error al eliminar el producto');
      await AlertService.error({
        text: 'No se pudo eliminar el producto.',
      });
    }
  };

  const handleCreateSuccess = (newProduct) => {
    // Asegúrate de que el nuevo producto tenga categoryName
    const productWithCategory = {
      ...newProduct,
      categoryName: newProduct.categoryName || 'Desconocido'
    };
    setProducts([...products, productWithCategory]);
    setShowCreateModal(false);
  };

  const handleUpdateSuccess = (updatedProduct) => {
    // Mantén el categoryName existente si no viene en la respuesta
    setProducts(products.map(product =>
      product.id === updatedProduct.id
        ? {
          ...updatedProduct,
          categoryName: updatedProduct.categoryName || product.categoryName
        }
        : product
    ));
    setEditingProduct(null);
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
        <h2 className="table-title">Lista de productos <Badge>{products.length}</Badge></h2>
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
            onClick={() => setShowCreateModal(true)}
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
        onHide={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Modal para editar */}
      <ModalProducts
        show={!!editingProduct}
        onHide={() => setEditingProduct(null)}
        onSuccess={handleUpdateSuccess}
        isEditing={true}
        productId={editingProduct?.id}
        initialData={{
          name: editingProduct?.name || '',
          description: editingProduct?.description || '',
          price: editingProduct?.price || 0,
          stock: editingProduct?.stock || 0,
          categoryId: editingProduct?.categoryId || 0,
          imageUrl: editingProduct?.imageUrl || '',
          imageFileName: editingProduct?.imageFileName || '',
          identityId: editingProduct?.identityId || 0
        }}
        key={editingProduct?.id || 'create'}
      />
    </div>
  );
};

export default ProductsList;