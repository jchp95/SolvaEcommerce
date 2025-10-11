/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { CategoryService } from '../../api/endpoints/categories';
import PropTypes from 'prop-types';
import { Form, Alert } from 'react-bootstrap';
import { useSpinner } from '../../context/SpinnerContext';
import AlertService from '../../services/AlertService';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ModalCategories = ({
    show,
    onHide,
    onSuccess,
    initialData = { name: '', description: '' },
    isEditing = false,
    categoryId = null
}) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showSpinner, hideSpinner } = useSpinner();

    // Resetear el formulario cuando cambia el modo (crear/editar)
    useEffect(() => {
        if (show) {
            if (isEditing && categoryId) {
                if (formData.name === '' && formData.description === '') {
                    loadCategoryData();
                }
            } else if (!isEditing) {
                setFormData({ name: '', description: '' });
            }
            setErrors({});
        }
    }, [show, isEditing, categoryId]);

    const loadCategoryData = async () => {
        try {
            showSpinner();
            const category = await CategoryService.getById(categoryId);
            setFormData({
                name: category.name || '',
                description: category.description || ''
            });
            hideSpinner();
        } catch (err) {
            hideSpinner();
            setErrors({ submit: err.message });
            await AlertService.error({
                text: 'Error al cargar la categoría',
            });
            onHide();
        }
    };

    const validateForm = () => {
        let newErrors = {};

        // Validación para el nombre
        if (!formData.name.trim()) {
            newErrors.name = 'El nombre de la categoría es requerido';
        } else if (formData.name.length < 3) {
            newErrors.name = 'El nombre debe tener al menos 3 caracteres';
        }

        // Validación para la descripción
        if (!formData.description.trim()) {
            newErrors.description = 'La descripción es requerida';
        } else if (formData.description.length > 500) {
            newErrors.description = 'La descripción no puede exceder los 500 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpiar error cuando el usuario escribe
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
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
                id: isEditing ? parseInt(categoryId) : 0,
                name: formData.name.trim(),
                description: formData.description.trim(),
                identityId: 0
            };

            let response;

            if (isEditing) {
                // Para edición: verificar si existe, excluyendo la categoría actual
                try {
                    await CategoryService.checkExists(payload.name, categoryId);
                    response = await CategoryService.update(categoryId, payload);
                } catch (err) {
                    if (err.response?.status === 409) { // Conflicto - ya existe
                        setErrors({
                            name: 'Ya existe una categoría con este nombre'
                        });
                        hideSpinner();
                        setIsSubmitting(false);
                        return;
                    }
                    throw err; // Re-lanzar otros errores
                }
            } else {
                // Para creación: verificar si existe
                try {
                    await CategoryService.checkExists(payload.name);
                    response = await CategoryService.create(payload);
                } catch (err) {
                    if (err.response?.status === 409) { // Conflicto - ya existe
                        setErrors({
                            name: 'Ya existe una categoría con este nombre'
                        });
                        hideSpinner();
                        setIsSubmitting(false);
                        return;
                    }
                    throw err; // Re-lanzar otros errores
                }
            }

            hideSpinner();
            setIsSubmitting(false);

            if (onSuccess) onSuccess(response.data);

            onHide();
            setFormData({ name: '', description: '' });

            await AlertService.success({
                text: isEditing
                    ? 'Categoría actualizada exitosamente'
                    : 'Categoría creada exitosamente',
            });
        } catch (err) {
            hideSpinner();
            setIsSubmitting(false);
            console.error('Error detallado:', err.response?.data || err.message);

            // Solo mostrar error general si no es un error de validación de nombre
            if (!errors.name) {
                setErrors({
                    submit: err.response?.data?.message ||
                        'Error al procesar la solicitud'
                });
                await AlertService.error({
                    text: isEditing
                        ? 'Error al actualizar la categoría'
                        : 'Error al crear la categoría',
                });
            }
        }
    };

    const handleCancel = () => {
        setFormData({ name: '', description: '' });
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
        >
            {errors.submit && (
                <Alert variant="danger" className="mb-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    {errors.submit}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
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
                    />
                    {errors.name && (
                        <Form.Text className="text-danger">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                            {errors.name}
                        </Form.Text>
                    )}
                </Form.Group>

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
                    />
                    {errors.description && (
                        <Form.Text className="text-danger">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                            {errors.description}
                        </Form.Text>
                    )}
                </Form.Group>
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
    }),
    isEditing: PropTypes.bool,
    categoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ModalCategories.defaultProps = {
    onSuccess: null,
    initialData: { name: '', description: '' },
    isEditing: false,
    categoryId: null,
};

export default ModalCategories;