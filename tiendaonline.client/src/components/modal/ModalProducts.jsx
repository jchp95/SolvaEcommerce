/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { ProductService, CategoryService } from '../../api/endpoints/products';
import PropTypes from 'prop-types';
import { Form, Alert, Row, Col } from 'react-bootstrap';
import { useSpinner } from '../../context/SpinnerContext';
import AlertService from '../../services/AlertService';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ModalProducts = ({
    show,
    onHide,
    onSuccess,
    initialData = {
        name: '',
        description: '',
        price: 0,
        stock: 0,
        categoryId: '',
        imageUrl: '',
        imageFileName: '',
        identityId: 0
    },
    isEditing = false,
    productId = null
}) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const { showSpinner, hideSpinner } = useSpinner();

    // Cargar categorías al montar el componente
    useEffect(() => {
        const loadCategories = async () => {
            try {
                showSpinner();
                const response = await CategoryService.getAll();
                setCategories(response.data);
                hideSpinner();
            } catch {
                hideSpinner();
                setErrors({ submit: 'Error al cargar categorías' });
            }
        };

        if (show) {
            loadCategories();
        }
    }, [show]);

    // Resetear el formulario cuando cambia el modo (crear/editar)
    useEffect(() => {
        if (show) {
            if (isEditing && productId) {
                if (Object.values(formData).every(val => !val)) {
                    loadProductData();
                }
            } else if (!isEditing) {
                setFormData({
                    name: '',
                    description: '',
                    price: 0,
                    stock: 0,
                    categoryId: '',
                    imageUrl: '',
                    imageFileName: '',
                    identityId: 0
                });
            }
            setErrors({});
        }
    }, [show, isEditing, productId]);

    const loadProductData = async () => {
        try {
            showSpinner();
            const product = await ProductService.getById(productId);
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || 0,
                stock: product.stock || 0,
                categoryId: product.categoryId || '',
                imageUrl: product.imageUrl || '',
                imageFileName: product.imageFileName || '',
                identityId: product.identityId || 0
            });
            hideSpinner();
        } catch (err) {
            hideSpinner();
            setErrors({ submit: err.message });
            await AlertService.error({
                text: 'Error al cargar el producto',
            });
            onHide();
        }
    };

    const validateForm = () => {
        let newErrors = {};

        // Validación para el nombre
        if (!formData.name.trim()) {
            newErrors.name = 'El nombre del producto es requerido';
        } else if (formData.name.length > 100) {
            newErrors.name = 'El nombre no puede exceder los 100 caracteres';
        }

        // Validación para la descripción
        if (!formData.description.trim()) {
            newErrors.description = 'La descripción es requerida';
        } else if (formData.description.length > 500) {
            newErrors.description = 'La descripción no puede exceder los 500 caracteres';
        }

        // Validación para el precio
        if (formData.price <= 0) {
            newErrors.price = 'El precio debe ser mayor que 0';
        } else if (formData.price > 1000000) {
            newErrors.price = 'El precio no puede exceder 1,000,000';
        }

        // Validación para el stock
        if (formData.stock < 0) {
            newErrors.stock = 'El stock no puede ser negativo';
        }

        // Validación para la categoría
        if (!formData.categoryId) {
            newErrors.categoryId = 'Debe seleccionar una categoría';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stock' || name === 'categoryId' || name === 'identityId'
                ? Number(value)
                : value
        }));

        // Limpiar error cuando el usuario escribe
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                imageFile: file,
                imageFileName: file.name,
                imageUrl
            }));
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            showSpinner();

            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                categoryId: parseInt(formData.categoryId),
                identityId: parseInt(formData.identityId) || 0,
                imageFile: formData.imageFile || null
            };

            let response; // ✅ Declaramos response aquí

            if (isEditing) {
                // Para edición: verificar si existe, excluyendo el producto actual
                try {
                    await ProductService.checkExists(payload.name, productId);
                    response = await ProductService.update(productId, payload);
                } catch (err) {
                    if (err.response?.status === 409) {
                        setErrors({
                            name: 'Ya existe un producto con ese nombre'
                        });
                        hideSpinner();
                        setIsSubmitting(false);
                        return;
                    }
                    throw err;
                }
            } else {
                // Para creación: verificar si existe
                try {
                    await ProductService.checkExists(payload.name);
                    response = await ProductService.create(payload);
                } catch (err) {
                    if (err.response?.status === 409) {
                        setErrors({
                            name: 'Ya existe un producto con ese nombre'
                        });
                        hideSpinner();
                        setIsSubmitting(false);
                        return;
                    }
                    throw err;
                }
            }

            hideSpinner();
            setIsSubmitting(false);

            if (onSuccess) onSuccess(response.data);

            onHide();
            setFormData({
                name: '',
                description: '',
                price: 0,
                stock: 0,
                categoryId: '',
                imageUrl: '',
                imageFileName: '',
                identityId: 0
            });

            await AlertService.success({
                text: isEditing
                    ? 'Producto actualizado exitosamente'
                    : 'Producto creado exitosamente',
            });
        } catch (err) {
            hideSpinner();
            setIsSubmitting(false);
            console.error('Error detallado:', err.response?.data || err.message);

            if (!errors.name) {
                setErrors({
                    submit: err.response?.data?.message ||
                        'Error al procesar la solicitud'
                });
                await AlertService.error({
                    text: isEditing
                        ? 'Error al actualizar el producto'
                        : 'Error al crear el producto',
                });
            }
        }
    };


    const handleCancel = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            stock: 0,
            categoryId: '',
            imageUrl: ''
        });
        setErrors({});
        onHide();
    };

    return (
        <Modal
            show={show}
            onHide={handleCancel}
            title={isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
            footerButtons={[
                {
                    text: 'Cancelar',
                    variant: 'outline-secondary',
                    onClick: handleCancel,
                    disabled: isSubmitting
                },
                {
                    text: isEditing ? 'Actualizar' : 'Guardar',
                    variant: 'primary',
                    onClick: handleSubmit,
                    disabled: isSubmitting,
                    isLoading: isSubmitting
                },
            ]}
            size="lg"
        >
            {errors.submit && (
                <Alert variant="danger" className="mb-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    {errors.submit}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre *</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                isInvalid={!!errors.name}
                                className="form-input-dark"
                                required
                                maxLength={100}
                            />
                            {errors.name && (
                                <Form.Text className="text-danger">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                    {errors.name}
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Categoría *</Form.Label>
                            <Form.Select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                isInvalid={!!errors.categoryId}
                                className="form-input-dark"
                                required
                            >
                                <option value="">Seleccionar categoría</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </Form.Select>
                            {errors.categoryId && (
                                <Form.Text className="text-danger">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                    {errors.categoryId}
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Precio *</Form.Label>
                            <Form.Control
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                isInvalid={!!errors.price}
                                className="form-input-dark"
                                required
                                min="0.01"
                                step="0.01"
                            />
                            {errors.price && (
                                <Form.Text className="text-danger">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                    {errors.price}
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Stock</Form.Label>
                            <Form.Control
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleInputChange}
                                isInvalid={!!errors.stock}
                                className="form-input-dark"
                                required
                                min="0"
                            />
                            {errors.stock && (
                                <Form.Text className="text-danger">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                    {errors.stock}
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-4">
                    <Form.Label>Descripción *</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        isInvalid={!!errors.description}
                        className="form-input-dark"
                        required
                        maxLength={500}
                    />
                    {errors.description && (
                        <Form.Text className="text-danger">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                            {errors.description}
                        </Form.Text>
                    )}
                </Form.Group>

                <Row className="mb-3 align-items-start">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Imagen del producto</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="form-input-dark"
                            />
                        </Form.Group>
                    </Col>

                    {formData.imageUrl && (
                        <Col md={6}>
                            <div>
                                <img
                                    src={formData.imageUrl}
                                    alt="Vista previa"
                                    style={{
                                        maxWidth: '150px',
                                        maxHeight: '150px',
                                        borderRadius: '4px',
                                        display: 'block'
                                    }}
                                />
                                <p className="small text-muted mt-1 justify-content-start">
                                    {formData.imageFileName || 'Imagen actual'}
                                </p>
                            </div>
                        </Col>
                    )}
                </Row>
            </Form>
        </Modal>
    );
};

ModalProducts.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    initialData: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        price: PropTypes.number,
        stock: PropTypes.number,
        categoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        imageUrl: PropTypes.string,
        imageFileName: PropTypes.string,
        identityId: PropTypes.number
    }),
    isEditing: PropTypes.bool,
    productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ModalProducts.defaultProps = {
    onSuccess: null,
    initialData: {
        name: '',
        description: '',
        price: 0,
        stock: 0,
        categoryId: '',
        imageUrl: '',
        imageFileName: '',
        identityId: 0
    },
    isEditing: false,
    productId: null,
};

export default ModalProducts;