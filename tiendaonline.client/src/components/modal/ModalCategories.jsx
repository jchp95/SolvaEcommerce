/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchCategories, createCategory, updateCategory } from '../../features/reduxSlices/categories/categoriesSlice';
import { showSpinner, hideSpinner } from '../../features/reduxSlices/spinner/spinnerSlice';
import PropTypes from 'prop-types';
import { Form, Alert, Row, Col } from 'react-bootstrap';
import AlertService from '../../services/AlertService';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ModalCategories = ({
    show,
    onHide,
    onSuccess,
    initialData = { 
        name: '', 
        description: '', 
        slug: '',
        parentCategoryId: null,
        metaTitle: '',
        metaDescription: ''
    },
    isEditing = false,
    categoryId = null
}) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [parentCategories, setParentCategories] = useState([]);

    // Cargar categorías padre disponibles
    useEffect(() => {
        if (show) {
            loadParentCategories();
        }
    }, [show]);

    // Resetear el formulario cuando cambia el modo (crear/editar)
    useEffect(() => {
        if (show) {
            if (isEditing && categoryId) {
                if (formData.name === '' && formData.description === '') {
                    loadCategoryData();
                }
            } else if (!isEditing) {
                setFormData(initialData);
            }
            setErrors({});
        }
    }, [show, isEditing, categoryId]);

    const loadParentCategories = async () => {
        try {
            const res = await dispatch(fetchCategories()).unwrap();
            // Filtrar categorías que pueden ser padres (excluyendo la actual si está editando)
            const availableParents = Array.isArray(res) 
                ? res.filter(cat => !isEditing || cat.id !== categoryId)
                : [];
            setParentCategories(availableParents);
        } catch (err) {
            console.error('Error loading parent categories:', err);
        }
    };

    const loadCategoryData = async () => {
        try {
            dispatch(showSpinner());
            const res = await dispatch(fetchCategories()).unwrap();
            const category = Array.isArray(res)
                ? res.find(cat => String(cat.id) === String(categoryId))
                : null;
            if (category) {
                setFormData({
                    name: category.name || '',
                    description: category.description || '',
                    slug: category.slug || '',
                    displayOrder: category.displayOrder || 0,
                    parentCategoryId: category.parentCategoryId || null,
                    metaTitle: category.metaTitle || '',
                    metaDescription: category.metaDescription || ''
                });
            }
            dispatch(hideSpinner());
        } catch (err) {
            dispatch(hideSpinner());
            setErrors({ submit: 'Error al cargar la categoría' });
            await AlertService.error({ text: 'Error al cargar la categoría' });
            onHide();
        }
    };

    const validateForm = () => {
        let newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'El nombre de la categoría es requerido';
        } else if (formData.name.length < 3) {
            newErrors.name = 'El nombre debe tener al menos 3 caracteres';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'La descripción es requerida';
        } else if (formData.description.length > 500) {
            newErrors.description = 'La descripción no puede exceder los 500 caracteres';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'El slug es requerido';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = 'El slug solo puede contener letras minúsculas, números y guiones';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        const processedValue = type === 'number' ? parseInt(value) || 0 : value;
        
        setFormData(prev => ({ ...prev, [name]: processedValue }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Generar slug automáticamente desde el nombre
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({ 
            ...prev, 
            name,
            // Generar slug automáticamente si está vacío o coincide con el nombre anterior
            slug: !prev.slug || prev.slug === generateSlug(prev.name) 
                ? generateSlug(name) 
                : prev.slug
        }));
        if (errors.name) {
            setErrors(prev => ({ ...prev, name: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        try {
            setIsSubmitting(true);
            dispatch(showSpinner());
            let response;
            
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                slug: formData.slug.trim().toLowerCase(),
                parentCategoryId: formData.parentCategoryId || null,
                metaTitle: formData.metaTitle?.trim() || '',
                metaDescription: formData.metaDescription?.trim() || ''
            };

            if (isEditing) {
                response = await dispatch(updateCategory({ id: categoryId, data: payload })).unwrap();
            } else {
                response = await dispatch(createCategory(payload)).unwrap();
            }
            
            dispatch(hideSpinner());
            setIsSubmitting(false);
            if (onSuccess) onSuccess(response);
            onHide();
            setFormData(initialData);
            await AlertService.success({
                text: isEditing
                    ? 'Categoría actualizada exitosamente'
                    : 'Categoría creada exitosamente',
            });
        } catch (err) {
            dispatch(hideSpinner());
            setIsSubmitting(false);
            setErrors({
                submit: err?.message || 'Error al procesar la solicitud'
            });
            await AlertService.error({
                text: isEditing
                    ? 'Error al actualizar la categoría'
                    : 'Error al crear la categoría',
            });
        }
    };

    const handleCancel = () => {
        setFormData(initialData);
        setErrors({});
        onHide();
    };

    return (
        <Modal
            show={show}
            onHide={handleCancel}
            title={isEditing ? 'Editar Categoría' : 'Crear Nueva Categoría'}
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
                                onChange={handleNameChange}
                                isInvalid={!!errors.name}
                                className="form-input-dark"
                                required
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
                            <Form.Label>Slug *</Form.Label>
                            <Form.Control
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleInputChange}
                                isInvalid={!!errors.slug}
                                className="form-input-dark"
                                required
                            />
                            {errors.slug && (
                                <Form.Text className="text-danger">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                                    {errors.slug}
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
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
                    />
                    {errors.description && (
                        <Form.Text className="text-danger">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                            {errors.description}
                        </Form.Text>
                    )}
                </Form.Group>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Categoría Padre</Form.Label>
                            <Form.Select
                                name="parentCategoryId"
                                value={formData.parentCategoryId || ''}
                                onChange={handleInputChange}
                                className="form-input-dark"
                            >
                                <option value="">Sin categoría padre</option>
                                {parentCategories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Meta Título</Form.Label>
                            <Form.Control
                                type="text"
                                name="metaTitle"
                                value={formData.metaTitle}
                                onChange={handleInputChange}
                                className="form-input-dark"
                                maxLength={60}
                            />
                            <Form.Text className="text-muted">
                                {formData.metaTitle?.length || 0}/60 caracteres
                            </Form.Text>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Meta Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="metaDescription"
                                value={formData.metaDescription}
                                onChange={handleInputChange}
                                className="form-input-dark"
                                maxLength={160}
                            />
                            <Form.Text className="text-muted">
                                {formData.metaDescription?.length || 0}/160 caracteres
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

ModalCategories.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    initialData: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        slug: PropTypes.string,
        displayOrder: PropTypes.number,
        parentCategoryId: PropTypes.number,
        metaTitle: PropTypes.string,
        metaDescription: PropTypes.string,
    }),
    isEditing: PropTypes.bool,
    categoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ModalCategories.defaultProps = {
    onSuccess: null,
    initialData: { 
        name: '', 
        description: '', 
        slug: '',
        displayOrder: 0,
        parentCategoryId: null,
        metaTitle: '',
        metaDescription: ''
    },
    isEditing: false,
    categoryId: null,
};

export default ModalCategories;