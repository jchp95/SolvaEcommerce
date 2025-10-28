/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { CategoryService } from '../../api/endpoints/products';
import { createProduct, updateProduct, fetchProductById } from '../../features/reduxSlices/products/productsSlice';
import { showSpinner, hideSpinner } from '../../features/reduxSlices/spinner/spinnerSlice';
import PropTypes from 'prop-types';
import { Form, Alert, Row, Col, Button } from 'react-bootstrap';
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
        shortDescription: '',
        price: 0,
        compareAtPrice: null,
        stock: 0,
        brand: '',
        sku: '',
        features: [],
        specs: {},
        badges: [],
        expiryDate: '',
        categoryId: '',
        imageUrl: '',
        imageFileName: '',
        identityId: 0,
        isPublished: false,
        isFeatured: false,
        hasFreeShipping: false
    },
    isEditing = false,
    productId = null
}) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);

    // Cargar datos al mostrar el modal
    useEffect(() => {
        if (show) {
            loadCategories();
            
            if (isEditing && productId) {
                if (!formData.name) { // Solo cargar si no hay datos
                    loadProductData();
                }
            } else if (!isEditing) {
                resetForm();
            }
            setErrors({});
        }
    }, [show, isEditing, productId]);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            shortDescription: '',
            price: 0,
            compareAtPrice: null,
            stock: 0,
            brand: '',
            sku: '',
            features: [],
            specs: {},
            badges: [],
            expiryDate: '',
            categoryId: '',
            imageUrl: '',
            imageFileName: '',
            identityId: 0,
            isPublished: false,
            isFeatured: false,
            hasFreeShipping: false
        });
    };

    const loadCategories = async () => {
        try {
            dispatch(showSpinner());
            const response = await CategoryService.getAll();
            setCategories(response.data || []);
            dispatch(hideSpinner());
        } catch (error) {
            dispatch(hideSpinner());
            console.error('Error loading categories:', error);
            setErrors({ submit: 'Error al cargar categorías' });
        }
    };



    const loadProductData = async () => {
        try {
            dispatch(showSpinner());
            const product = await dispatch(fetchProductById(productId)).unwrap();
            
            // Mapear datos del producto al formulario (asegurar que strings no sean null)
            setFormData({
                name: product.name || '',
                description: product.description || '',
                shortDescription: product.shortDescription || '',
                price: product.price || 0,
                compareAtPrice: product.compareAtPrice || null,
                stock: product.stock || 0,
                brand: product.brand || '',
                sku: product.sku || '',
                features: product.featuresList || [],
                specs: product.specsDictionary || {},
                badges: product.badgesList || [],
                expiryDate: product.expiryDate || '',
                categoryId: product.categoryId || '',
                imageUrl: product.imageUrl || '',
                imageFileName: product.imageFileName || '',
                identityId: product.identityId || 0,
                isPublished: Boolean(product.isPublished),
                isFeatured: Boolean(product.isFeatured),
                hasFreeShipping: Boolean(product.hasFreeShipping)
            });
            dispatch(hideSpinner());
        } catch (err) {
            dispatch(hideSpinner());
            console.error('Error loading product:', err);
            setErrors({ submit: err.message || 'Error al cargar el producto' });
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

        // Validación para la descripción corta
        if (formData.shortDescription && formData.shortDescription.length > 200) {
            newErrors.shortDescription = 'La descripción corta no puede exceder los 200 caracteres';
        }

        // Validación para el precio
        if (formData.price <= 0) {
            newErrors.price = 'El precio debe ser mayor que 0';
        } else if (formData.price > 1000000) {
            newErrors.price = 'El precio no puede exceder 1,000,000';
        }

        // Validación para el precio de comparación
        if (formData.compareAtPrice && formData.compareAtPrice <= 0) {
            newErrors.compareAtPrice = 'El precio de comparación debe ser mayor que 0';
        }

        // Validación para el stock
        if (formData.stock < 0) {
            newErrors.stock = 'El stock no puede ser negativo';
        }

        // Validación para la categoría
        if (!formData.categoryId) {
            newErrors.categoryId = 'Debe seleccionar una categoría';
        }

        // Validación para la marca
        if (!formData.brand.trim()) {
            newErrors.brand = 'La marca es requerida';
        } else if (formData.brand.length > 100) {
            newErrors.brand = 'La marca no puedee exceder los 100 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : 
                   name === 'price' || name === 'compareAtPrice' || name === 'stock' || 
                   name === 'categoryId' || name === 'identityId' 
                   ? (value === '' ? null : Number(value))
                   : value
        }));

        // Limpiar error cuando el usuario escribe
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        
        // Limpiar error de submit cuando el usuario modifica campos relevantes
        if (errors.submit && (name === 'name' || name === 'description' || name === 'brand')) {
            setErrors(prev => ({ ...prev, submit: '' }));
        }
    };

    const handleJsonFieldChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
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
            dispatch(showSpinner());

            // Preparar datos para enviar
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                shortDescription: formData.shortDescription?.trim() || '',
                price: parseFloat(formData.price),
                compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
                stock: parseInt(formData.stock),
                brand: formData.brand.trim(),
                sku: formData.sku?.trim() || '',
                features: Array.isArray(formData.features) ? formData.features : [],
                specs: typeof formData.specs === 'object' ? formData.specs : {},
                badges: Array.isArray(formData.badges) ? formData.badges : [],
                expiryDate: formData.expiryDate || null,
                categoryId: parseInt(formData.categoryId),
                identityId: parseInt(formData.identityId) || 0,
                isPublished: Boolean(formData.isPublished),
                isFeatured: Boolean(formData.isFeatured),
                hasFreeShipping: Boolean(formData.hasFreeShipping),
                imageFile: formData.imageFile || null
            };

            console.log('Enviando payload:', payload);

            let response;
            if (isEditing && productId) {
                response = await dispatch(updateProduct({ 
                    id: productId, 
                    data: payload 
                })).unwrap();
            } else {
                response = await dispatch(createProduct(payload)).unwrap();
            }

            // Solo si todo es exitoso, cerramos el modal
            dispatch(hideSpinner());
            setIsSubmitting(false);

            if (onSuccess) onSuccess(response);
            onHide();
            resetForm();

            await AlertService.success({
                text: isEditing
                    ? 'Producto actualizado exitosamente'
                    : 'Producto creado exitosamente',
            });
        } catch (err) {
            console.error('Error en handleSubmit ModalProducts:', err);
            dispatch(hideSpinner());
            setIsSubmitting(false);
            
            // Manejo mejorado del mensaje de error para Redux Toolkit y respuestas de API
            let errorMessage = 'Error al procesar la solicitud';
            
            // Si es un error de Redux Toolkit (rejectWithValue)
            if (err && typeof err === 'object') {
                if (err.message && typeof err.message === 'string') {
                    // Error directo con message
                    errorMessage = err.message;
                } else if (err.success === false && err.message) {
                    // Respuesta de API con formato { success: false, message: "..." }
                    errorMessage = err.message;
                } else if (err.response?.data?.message) {
                    // Error de Axios con respuesta
                    errorMessage = err.response.data.message;
                } else if (typeof err === 'string') {
                    // Error como string directo
                    errorMessage = err;
                }
            }
            
            // Mostrar el error en el modal (mantener el modal abierto)
            setErrors({
                submit: errorMessage
            });
            
            // Mostrar alert de error pero NO cerrar el modal
            await AlertService.error({
                text: errorMessage,
                title: isEditing ? 'Error al actualizar producto' : 'Error al crear producto'
            });

            // IMPORTANTE: NO llamar onHide() ni resetForm() aquí
            // El modal debe permanecer abierto para que el usuario pueda corregir el error
        }
    };

    const handleCancel = () => {
        resetForm();
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
                                placeholder="Ingrese el nombre del producto"
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
                            <Form.Label>Marca *</Form.Label>
                            <Form.Control
                                type="text"
                                name="brand"
                                value={formData.brand}
                                onChange={handleInputChange}
                                isInvalid={!!errors.brand}
                                className="form-input-dark"
                                required
                                maxLength={100}
                                placeholder="Ingrese la marca"
                            />
                            {errors.brand && (
                                <Form.Text className="text-danger">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                    {errors.brand}
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Col>
                </Row>                <Form.Group className="mb-3">
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
                        {categories.map(category =>
                            category && category.id != null ? (
                            <option key={category.id} value={category.id}>
                                {category.name ?? 'Sin nombre'}
                            </option>
                            ) : null
                        )}
                    </Form.Select>
                    {errors.categoryId && (
                        <Form.Text className="text-danger">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                            {errors.categoryId}
                        </Form.Text>
                    )}
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Descripción *</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={formData.description || ''}
                        onChange={handleInputChange}
                        isInvalid={!!errors.description}
                        className="form-input-dark"
                        required
                        maxLength={500}
                        placeholder="Descripción completa del producto"
                    />
                    {errors.description && (
                        <Form.Text className="text-danger">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                            {errors.description}
                        </Form.Text>
                    )}
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Descripción Corta</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={2}
                        name="shortDescription"
                        value={formData.shortDescription || ''}
                        onChange={handleInputChange}
                        isInvalid={!!errors.shortDescription}
                        className="form-input-dark"
                        maxLength={200}
                        placeholder="Descripción breve para listados (opcional)"
                    />
                    {errors.shortDescription && (
                        <Form.Text className="text-danger">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                            {errors.shortDescription}
                        </Form.Text>
                    )}
                </Form.Group>

                <Row>
                    <Col md={4}>
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
                                placeholder="0.00"
                            />
                            {errors.price && (
                                <Form.Text className="text-danger">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                    {errors.price}
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Precio Comparación</Form.Label>
                            <Form.Control
                                type="number"
                                name="compareAtPrice"
                                value={formData.compareAtPrice || ''}
                                onChange={handleInputChange}
                                isInvalid={!!errors.compareAtPrice}
                                className="form-input-dark"
                                min="0.01"
                                step="0.01"
                                placeholder="Precio anterior (opcional)"
                            />
                            {errors.compareAtPrice && (
                                <Form.Text className="text-danger">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                    {errors.compareAtPrice}
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Stock *</Form.Label>
                            <Form.Control
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleInputChange}
                                isInvalid={!!errors.stock}
                                className="form-input-dark"
                                required
                                min="0"
                                placeholder="0"
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

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>SKU</Form.Label>
                            <Form.Control
                                type="text"
                                name="sku"
                                value={formData.sku || ''}
                                onChange={handleInputChange}
                                className="form-input-dark"
                                maxLength={50}
                                placeholder="Código SKU (opcional)"
                            />
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Fecha de Vencimiento</Form.Label>
                            <Form.Control
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate || ''}
                                onChange={handleInputChange}
                                className="form-input-dark"
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={4}>
                        <Form.Check
                            type="checkbox"
                            name="isPublished"
                            label="Publicado"
                            checked={formData.isPublished}
                            onChange={handleInputChange}
                            className="form-check-dark"
                        />
                    </Col>
                    <Col md={4}>
                        <Form.Check
                            type="checkbox"
                            name="isFeatured"
                            label="Destacado"
                            checked={formData.isFeatured}
                            onChange={handleInputChange}
                            className="form-check-dark"
                        />
                    </Col>
                    <Col md={4}>
                        <Form.Check
                            type="checkbox"
                            name="hasFreeShipping"
                            label="Envío Gratis"
                            checked={formData.hasFreeShipping}
                            onChange={handleInputChange}
                            className="form-check-dark"
                        />
                    </Col>
                </Row>

                <Row className="mb-3 align-items-start">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Imagen del Producto</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="form-input-dark"
                            />
                            <Form.Text className="text-muted">
                                Formatos: JPG, PNG, GIF. Tamaño máximo: 5MB
                            </Form.Text>
                        </Form.Group>
                    </Col>

                    {formData.imageUrl && (
                        <Col md={6}>
                            <div className="text-center">
                                <img
                                    src={formData.imageUrl}
                                    alt="Vista previa"
                                    style={{
                                        maxWidth: '150px',
                                        maxHeight: '150px',
                                        borderRadius: '8px',
                                        border: '1px solid #dee2e6'
                                    }}
                                />
                                <p className="small text-muted mt-2">
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

// PropTypes actualizados (remover supplierId)
ModalProducts.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    initialData: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        shortDescription: PropTypes.string,
        price: PropTypes.number,
        compareAtPrice: PropTypes.number,
        stock: PropTypes.number,
        brand: PropTypes.string,
        sku: PropTypes.string,
        features: PropTypes.array,
        specs: PropTypes.object,
        badges: PropTypes.array,
        expiryDate: PropTypes.string,
        categoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        imageUrl: PropTypes.string,
        imageFileName: PropTypes.string,
        identityId: PropTypes.number,
        isPublished: PropTypes.bool,
        isFeatured: PropTypes.bool,
        hasFreeShipping: PropTypes.bool
    }),
    isEditing: PropTypes.bool,
    productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ModalProducts.defaultProps = {
    onSuccess: null,
    initialData: {
        name: '',
        description: '',
        shortDescription: '',
        price: 0,
        compareAtPrice: null,
        stock: 0,
        brand: '',
        sku: '',
        features: [],
        specs: {},
        badges: [],
        expiryDate: '',
        categoryId: '',
        imageUrl: '',
        imageFileName: '',
        identityId: 0,
        isPublished: false,
        isFeatured: false,
        hasFreeShipping: false
    },
    isEditing: false,
    productId: null,
};

export default ModalProducts;