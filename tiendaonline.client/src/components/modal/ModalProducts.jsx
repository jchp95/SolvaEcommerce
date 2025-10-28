/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { CategoryService } from '../../api/endpoints/products';
import { createProduct, updateProduct, fetchProductById } from '../../features/reduxSlices/products/productsSlice';
// ⬇️ quitado el spinner global
// import { showSpinner, hideSpinner } from '../../features/reduxSlices/spinner/spinnerSlice';
import PropTypes from 'prop-types';
import { Form, Alert, Row, Col, Button, Badge } from 'react-bootstrap';
import AlertService from '../../services/AlertService';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const DEFAULT_FORM = {
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
    categoryName: '',
    imageUrl: '',
    imageFileName: '',
    identityId: 0,
    isPublished: false,
    isFeatured: false,
    hasFreeShipping: false,
};

const ModalProducts = ({
                           show,
                           onHide,
                           onSuccess,
                           initialData = DEFAULT_FORM,
                           isEditing = false,
                           productId = null
                       }) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const categoriesLoadedRef = useRef(false);

    // Helpers
    const tryParseJson = (value) => {
        if (typeof value !== 'string') return null;
        const s = value.trim();
        if (!s) return null;
        if (s.startsWith('{') || s.startsWith('[')) {
            try { return JSON.parse(s); } catch { return null; }
        }
        return null;
    };
    const normalizeArray = (raw) => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            const parsed = tryParseJson(raw);
            return Array.isArray(parsed) ? parsed : raw.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [];
    };
    const normalizeObject = (raw) => {
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            const parsed = tryParseJson(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        }
        return {};
    };
    const pickProduct = (raw) => raw?.data ?? raw?.result ?? raw?.product ?? raw?.payload ?? raw;

    const resetForm = () => setFormData(DEFAULT_FORM);

    // Carga silenciosa de categorías
    const loadCategories = async () => {
        if (categoriesLoadedRef.current) return;
        try {
            const response = await CategoryService.getAll();
            setCategories(response?.data || []);
            categoriesLoadedRef.current = true;
        } catch {
            // silencioso
        }
    };

    // Cargar producto sin spinner global (pre-llenado inmediato + merge silencioso)
    const loadProductData = async () => {
        let cancelled = false;
        try {
            const raw = await dispatch(fetchProductById(productId)).unwrap();
            if (cancelled) return;
            const p = pickProduct(raw);
            if (!p || typeof p !== 'object') throw new Error('Respuesta inválida del backend');

            const features = normalizeArray(p.features ?? p.featuresList ?? p.featuresString ?? p.featuresJson ?? []);
            const specs = normalizeObject(p.specs ?? p.specsDictionary ?? p.specsString ?? p.specsJson ?? null);
            const badges = normalizeArray(p.badges ?? p.badgesList ?? p.tags ?? p.badgesString ?? []);

            setFormData(prev => ({
                ...prev, // respetamos lo que ya se mostró
                name: p.name ?? prev.name,
                description: p.description ?? prev.description,
                shortDescription: p.shortDescription ?? prev.shortDescription,
                price: Number(p.price ?? prev.price ?? 0),
                compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : (prev.compareAtPrice ?? null),
                stock: Number(p.stock ?? prev.stock ?? 0),
                brand: p.brand ?? prev.brand,
                sku: p.sku ?? prev.sku,
                features: features,
                specs: specs,
                badges: badges,
                expiryDate: p.expiryDate ?? prev.expiryDate,
                categoryId: p.categoryId ?? prev.categoryId ?? '',
                categoryName: p.categoryName ?? p.category?.name ?? prev.categoryName ?? '',
                imageUrl: p.imageUrl ?? prev.imageUrl,
                imageFileName: p.imageFileName ?? prev.imageFileName,
                identityId: Number(p.identityId ?? prev.identityId ?? 0),
                isPublished: p.isPublished != null ? Boolean(p.isPublished) : prev.isPublished,
                isFeatured: p.isFeatured != null ? Boolean(p.isFeatured) : prev.isFeatured,
                hasFreeShipping: p.hasFreeShipping != null ? Boolean(p.hasFreeShipping) : prev.hasFreeShipping,
            }));
        } catch (err) {
            setErrors({ submit: err.message || 'Error al cargar el producto' });
            await AlertService.error({ text: 'Error al cargar el producto' });
            onHide();
        }
        return () => { cancelled = true; };
    };

    // Al abrir modal
    useEffect(() => {
        if (!show) return;

        (async () => {
            setErrors({});
            if (isEditing && productId) {
                // 1) Mostrar al instante lo que llega de la tabla
                setFormData(prev => ({
                    ...DEFAULT_FORM,
                    ...initialData
                }));
                // 2) Traer del backend en segundo plano (sin spinner global)
                await loadProductData();
            } else {
                // Creación: limpiar y (opcional) precargar categorías en silencio
                resetForm();
                await loadCategories();
            }
        })();
    }, [show, isEditing, productId]);

    // Al enfocar el select: cargar categorías si aún no están
    const handleCategoriesFocus = async () => {
        if (!categoriesLoadedRef.current) {
            await loadCategories();
        }
    };

    // Validaciones
    const validateForm = () => {
        const e = {};
        if (!formData.name.trim()) e.name = 'El nombre del producto es requerido';
        else if (formData.name.length > 100) e.name = 'El nombre no puede exceder los 100 caracteres';

        if (!formData.description.trim()) e.description = 'La descripción es requerida';
        else if (formData.description.length > 500) e.description = 'La descripción no puede exceder los 500 caracteres';

        if (formData.shortDescription && formData.shortDescription.length > 200)
            e.shortDescription = 'La descripción corta no puede exceder los 200 caracteres';

        if (Number(formData.price) <= 0) e.price = 'El precio debe ser mayor que 0';
        else if (Number(formData.price) > 1000000) e.price = 'El precio no puede exceder 1,000,000';

        if (formData.compareAtPrice != null && Number(formData.compareAtPrice) <= 0)
            e.compareAtPrice = 'El precio de comparación debe ser mayor que 0';

        if (Number(formData.stock) < 0) e.stock = 'El stock no puede ser negativo';

        if (formData.categoryId === '' || formData.categoryId === null || formData.categoryId === undefined)
            e.categoryId = 'Debe seleccionar una categoría';

        if (!formData.brand.trim()) e.brand = 'La marca es requerida';
        else if (formData.brand.length > 100) e.brand = 'La marca no puede exceder los 100 caracteres';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // Handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? checked
                : ['price', 'compareAtPrice', 'stock', 'categoryId', 'identityId'].includes(name)
                    ? (value === '' ? null : Number(value))
                    : value
        }));

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (errors.submit && ['name', 'description', 'brand'].includes(name))
            setErrors(prev => ({ ...prev, submit: '' }));
    };

    // Features
    const handleAddFeature = () =>
        setFormData(prev => ({ ...prev, features: [...(prev.features || []), ''] }));
    const handleFeatureChange = (i, v) => {
        const list = [...(formData.features || [])];
        list[i] = v;
        setFormData(prev => ({ ...prev, features: list }));
    };
    const handleRemoveFeature = (i) =>
        setFormData(prev => ({ ...prev, features: (prev.features || []).filter((_, idx) => idx !== i) }));

    // Specs
    const handleAddSpec = () => {
        const sp = { ...(formData.specs || {}) };
        let key = 'Nueva Especificación';
        let n = 1;
        while (sp[key]) { key = `Nueva Especificación ${n++}`; }
        sp[key] = '';
        setFormData(prev => ({ ...prev, specs: sp }));
    };
    const handleSpecChange = (oldKey, newKey, value) => {
        const sp = { ...(formData.specs || {}) };
        if (oldKey !== newKey) delete sp[oldKey];
        sp[newKey] = value;
        setFormData(prev => ({ ...prev, specs: sp }));
    };
    const handleRemoveSpec = (key) => {
        const sp = { ...(formData.specs || {}) };
        delete sp[key];
        setFormData(prev => ({ ...prev, specs: sp }));
    };

    // Badges
    const handleAddBadge = () =>
        setFormData(prev => ({ ...prev, badges: [...(prev.badges || []), ''] }));
    const handleBadgeChange = (i, v) => {
        const list = [...(formData.badges || [])];
        list[i] = v;
        setFormData(prev => ({ ...prev, badges: list }));
    };
    const handleRemoveBadge = (i) =>
        setFormData(prev => ({ ...prev, badges: (prev.badges || []).filter((_, idx) => idx !== i) }));

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const imageUrl = URL.createObjectURL(file);
        setFormData(prev => ({
            ...prev,
            imageFile: file,
            imageFileName: file.name,
            imageUrl
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);

            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                shortDescription: formData.shortDescription?.trim() || '',
                price: Number(formData.price),
                compareAtPrice: formData.compareAtPrice != null ? Number(formData.compareAtPrice) : null,
                stock: Number(formData.stock),
                brand: formData.brand.trim(),
                sku: formData.sku?.trim() || '',
                features: Array.isArray(formData.features) ? formData.features : [],
                specs: (formData.specs && typeof formData.specs === 'object') ? formData.specs : {},
                badges: Array.isArray(formData.badges) ? formData.badges : [],
                expiryDate: formData.expiryDate || null,
                categoryId: Number(formData.categoryId),
                identityId: Number(formData.identityId) || 0,
                isPublished: Boolean(formData.isPublished),
                isFeatured: Boolean(formData.isFeatured),
                hasFreeShipping: Boolean(formData.hasFreeShipping),
                imageFile: formData.imageFile || null
            };

            let response;
            if (isEditing && productId) {
                response = await dispatch(updateProduct({ id: productId, data: payload })).unwrap();
            } else {
                response = await dispatch(createProduct(payload)).unwrap();
            }

            if (onSuccess) onSuccess(response);
            resetForm();
            onHide();

            await AlertService.success({
                text: isEditing ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
            });
        } catch (err) {
            let msg = 'Error al procesar la solicitud';
            if (err?.message) msg = err.message;
            else if (err?.success === false && err?.message) msg = err.message;
            else if (err?.response?.data?.message) msg = err.response.data.message;
            else if (typeof err === 'string') msg = err;

            setErrors({ submit: msg });
            await AlertService.error({
                text: msg,
                title: isEditing ? 'Error al actualizar producto' : 'Error al crear producto'
            });
        } finally {
            setIsSubmitting(false);
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
                { text: 'Cancelar', variant: 'outline-secondary', onClick: handleCancel, disabled: isSubmitting },
                { text: isEditing ? 'Actualizar' : 'Guardar', variant: 'primary', onClick: handleSubmit, disabled: isSubmitting, isLoading: isSubmitting },
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
                </Row>

                {/* Categoría: muestra la actual de inmediato; carga catálogo al abrir el select */}
                <Form.Group className="mb-3">
                    <Form.Label>Categoría *</Form.Label>
                    <Form.Select
                        name="categoryId"
                        value={formData.categoryId ?? ''}
                        onChange={handleInputChange}
                        onFocus={handleCategoriesFocus}
                        isInvalid={!!errors.categoryId}
                        className="form-input-dark"
                        required
                    >
                        {(!categories || categories.length === 0) ? (
                            <>
                                <option value="">
                                    {formData.categoryId ? 'Cargando categorías… (manteniendo la actual)' : 'Seleccionar categoría'}
                                </option>
                                {formData.categoryId !== '' && (
                                    <option value={formData.categoryId}>
                                        {formData.categoryName || `Categoría #${formData.categoryId}`}
                                    </option>
                                )}
                            </>
                        ) : (
                            <>
                                <option value="">Seleccionar categoría</option>
                                {categories.map(c =>
                                    c && c.id != null ? (
                                        <option key={c.id} value={c.id}>
                                            {c.name ?? 'Sin nombre'}
                                        </option>
                                    ) : null
                                )}
                            </>
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
                                value={formData.compareAtPrice ?? ''}
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
                        <Form.Check type="checkbox" name="isPublished" label="Publicado" checked={formData.isPublished} onChange={handleInputChange} className="form-check-dark" />
                    </Col>
                    <Col md={4}>
                        <Form.Check type="checkbox" name="isFeatured" label="Destacado" checked={formData.isFeatured} onChange={handleInputChange} className="form-check-dark" />
                    </Col>
                    <Col md={4}>
                        <Form.Check type="checkbox" name="hasFreeShipping" label="Envío Gratis" checked={formData.hasFreeShipping} onChange={handleInputChange} className="form-check-dark" />
                    </Col>
                </Row>

                <Row className="mb-3 align-items-start">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Imagen del Producto</Form.Label>
                            <Form.Control type="file" accept="image/*" onChange={handleImageUpload} className="form-input-dark" />
                            <Form.Text className="text-muted">Formatos: JPG, PNG, GIF. Tamaño máximo: 5MB</Form.Text>
                        </Form.Group>
                    </Col>

                    {formData.imageUrl && (
                        <Col md={6}>
                            <div className="text-center">
                                <img
                                    src={formData.imageUrl}
                                    alt="Vista previa"
                                    style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', border: '1px solid #dee2e6' }}
                                />
                                <p className="small text-muted mt-2">
                                    {formData.imageFileName || 'Imagen actual'}
                                </p>
                            </div>
                        </Col>
                    )}
                </Row>

                {/* Features */}
                <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="mb-0">Características</Form.Label>
                        <Button variant="outline-primary" size="sm" onClick={handleAddFeature} type="button">
                            <FontAwesomeIcon icon={faPlus} className="me-1" />
                            Agregar
                        </Button>
                    </div>
                    <Form.Text className="text-muted d-block mb-2">Lista de características principales del producto</Form.Text>
                    {Array.isArray(formData.features) && formData.features.length > 0 ? (
                        <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {formData.features.map((feature, index) => (
                                <div key={index} className="d-flex gap-2 mb-2">
                                    <Form.Control
                                        type="text"
                                        value={feature}
                                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                                        placeholder={`Característica ${index + 1}`}
                                        className="form-input-dark"
                                    />
                                    <Button variant="outline-danger" size="sm" onClick={() => handleRemoveFeature(index)} type="button">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted small mb-0">No hay características agregadas</p>
                    )}
                </Form.Group>

                {/* Specs */}
                <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="mb-0">Especificaciones Técnicas</Form.Label>
                        <Button variant="outline-primary" size="sm" onClick={handleAddSpec} type="button">
                            <FontAwesomeIcon icon={faPlus} className="me-1" />
                            Agregar
                        </Button>
                    </div>
                    <Form.Text className="text-muted d-block mb-2">Especificaciones técnicas del producto (clave: valor)</Form.Text>
                    {formData.specs && Object.keys(formData.specs).length > 0 ? (
                        <div className="border rounded p-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            {Object.entries(formData.specs).map(([key, value], index) => (
                                <Row key={index} className="mb-2 g-2">
                                    <Col md={5}>
                                        <Form.Control
                                            type="text"
                                            value={key}
                                            onChange={(e) => handleSpecChange(key, e.target.value, value)}
                                            placeholder="Nombre (ej: Peso)"
                                            className="form-input-dark"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Control
                                            type="text"
                                            value={value}
                                            onChange={(e) => handleSpecChange(key, key, e.target.value)}
                                            placeholder="Valor (ej: 150g)"
                                            className="form-input-dark"
                                        />
                                    </Col>
                                    <Col md={1}>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleRemoveSpec(key)}
                                            type="button"
                                            className="w-100"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted small mb-0">No hay especificaciones agregadas</p>
                    )}
                </Form.Group>

                {/* Badges */}
                <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="mb-0">Etiquetas / Badges</Form.Label>
                        <Button variant="outline-primary" size="sm" onClick={handleAddBadge} type="button">
                            <FontAwesomeIcon icon={faPlus} className="me-1" />
                            Agregar
                        </Button>
                    </div>
                    <Form.Text className="text-muted d-block mb-2">
                        Etiquetas destacadas que aparecerán en la tarjeta del producto (ej: Nuevo, Oferta, Bestseller)
                    </Form.Text>
                    {Array.isArray(formData.badges) && formData.badges.length > 0 ? (
                        <>
                            <div className="border rounded p-2 mb-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {formData.badges.map((badge, index) => (
                                    <div key={index} className="d-flex gap-2 mb-2">
                                        <Form.Control
                                            type="text"
                                            value={badge}
                                            onChange={(e) => handleBadgeChange(index, e.target.value)}
                                            placeholder={`Badge ${index + 1}`}
                                            className="form-input-dark"
                                            maxLength={20}
                                        />
                                        <Button variant="outline-danger" size="sm" onClick={() => handleRemoveBadge(index)} type="button">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="d-flex flex-wrap gap-2 p-2 bg-light rounded">
                                <small className="text-muted me-2">Vista previa:</small>
                                {(formData.badges || []).filter(b => b && b.trim()).map((badge, index) => (
                                    <Badge key={index} bg="primary" className="d-flex align-items-center">
                                        {badge}
                                    </Badge>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-muted small mb-0">No hay badges agregados</p>
                    )}
                </Form.Group>
            </Form>
        </Modal>
    );
};

// PropTypes
ModalProducts.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    initialData: PropTypes.shape(DEFAULT_FORM),
    isEditing: PropTypes.bool,
    productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ModalProducts.defaultProps = {
    onSuccess: null,
    initialData: DEFAULT_FORM,
    isEditing: false,
    productId: null,
};

export default ModalProducts;
