import { useMemo } from 'react';
import './PaymentsTable.css';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import {
    Table,
    Button,
    ButtonGroup,
    Form,
    Badge
} from 'react-bootstrap';

const PaymentStatusBadge = ({ status }) => {
    const variant = {
        'Completado': 'success',
        'Pendiente': 'warning',
        'Cancelado': 'danger',
        'Rechazado': 'secondary'
    }[status] || 'primary';

    return <Badge pill bg={variant}>{status}</Badge>;
};

const PaymentsTable = ({ data }) => {
    const columns = useMemo(() => [
        {
            header: 'ID Pago',
            accessorKey: 'id',
            cell: info => <span className="payment-id">#{info.getValue()}</span>
        },
        {
            header: 'Cliente',
            accessorKey: 'customerName',
            cell: info => <span className="customer-name">{info.getValue()}</span>
        },
        {
            header: 'Monto',
            accessorKey: 'amount',
            cell: info => <span className="payment-amount">${info.getValue().toFixed(2)}</span>,
            footer: () => 'Total'
        },
        {
            header: 'Fecha',
            accessorKey: 'date',
            cell: info => (
                <span className="payment-date">
                    {new Date(info.getValue()).toLocaleDateString()}
                </span>
            )
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: info => <PaymentStatusBadge status={info.getValue()} />,
            filterFn: 'equals'
        },
        {
            header: 'Productos',
            accessorKey: 'products',
            cell: info => (
                <div className="payment-products">
                    {info.getValue().map((product, index) => (
                        <span key={index} className="product-name">
                            {product.name} (${product.price.toFixed(2)})
                        </span>
                    ))}
                </div>
            )
        }
    ], []);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 5
            }
        }
    });

    return (
        <div className="modern-table-container">
            <div className="table-controls mb-3">
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

            <div className="table-responsive">
                <Table hover className="payments-table">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className="text-nowrap">
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
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
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline-primary"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Siguiente
                    </Button>
                </ButtonGroup>

                <span className="mx-3">
                    Página{' '}
                    <strong>
                        {table.getState().pagination.pageIndex + 1} de{' '}
                        {table.getPageCount()}
                    </strong>
                </span>

                <span>
                    Mostrando{' '}
                    {table.getRowModel().rows.length} de{' '}
                    {table.getRowCount()} registros
                </span>
            </div>
        </div>
    );
};

export default PaymentsTable;