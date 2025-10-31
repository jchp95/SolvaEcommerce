// pages/supplier/SupplierRegistration.jsx
import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { Building, FileText, Upload, Clock, ArrowLeft } from 'react-bootstrap-icons';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AlertService from '../../services/AlertService';
import './SupplierRegistration.css';
import { createSupplier } from '../../features/reduxSlices/suppliers/suppliersSlice';

const SupplierRegistration = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector(state => state.suppliers);

    const [formData, setFormData] = useState({
        companyName: '',
        legalName: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        city: '',
        country: 'Cuba',
        postalCode: '', // Agregado para coincidir con el backend
        businessRegistration: '',
    });

    const [documents, setDocuments] = useState({
        businessLicense: null,
        taxCertificate: null,
        idDocument: null
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.companyName.trim()) {
            newErrors.companyName = 'El nombre comercial es requerido';
        }

        if (!formData.contactEmail.trim()) {
            newErrors.contactEmail = 'El email de contacto es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
            newErrors.contactEmail = 'El email no es válido';
        }

        if (!formData.contactPhone.trim()) {
            newErrors.contactPhone = 'El teléfono es requerido';
        }

        if (!documents.businessLicense) {
            newErrors.businessLicense = 'La licencia comercial es requerida';
        }

        if (!documents.taxCertificate) {
            newErrors.taxCertificate = 'El certificado de impuestos es requerido';
        }

        if (!documents.idDocument) {
            newErrors.idDocument = 'La identificación del representante es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        const isValid = validateForm();
        if (!isValid) return;

        // Crear FormData para enviar datos y archivos
        const formDataToSend = new FormData();
        
        // Agregar todos los campos del formulario
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                formDataToSend.append(key, formData[key].toString().trim());
            }
        });

        // Adjuntar archivos PDF - USANDO LOS NOMBRES CORRECTOS
        if (documents.businessLicense) {
            formDataToSend.append("businessLicense", documents.businessLicense);
        }
        if (documents.taxCertificate) {
            formDataToSend.append("taxCertificate", documents.taxCertificate);
        }
        if (documents.idDocument) {
            formDataToSend.append("idDocument", documents.idDocument);
        }

        try {
            // Usar redux thunk para crear el proveedor
            const resultAction = await dispatch(createSupplier(formDataToSend));
            
            if (createSupplier.fulfilled.match(resultAction)) {
                await AlertService.success({
                    title: '¡Solicitud Enviada!',
                    text: 'Tu solicitud ha sido enviada para revisión. Te notificaremos por email cuando sea aprobada.'
                });
                navigate('/supplier/dashboard');
            } else {
                throw new Error(resultAction.payload || 'Error al enviar la solicitud');
            }
        } catch (error) {
            await AlertService.error({
                title: 'Error',
                text: error.message || 'Error al enviar la solicitud'
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (fileType, file) => {
        setDocuments(prev => ({
            ...prev,
            [fileType]: file
        }));
        
        // Limpiar error del archivo
        if (errors[fileType]) {
            setErrors(prev => ({ ...prev, [fileType]: '' }));
        }
    };

    return (
        <Container className="supplier-registration-container py-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Botón de regreso */}
                <div className="mb-4">
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => navigate('/dashboard')}
                        className="back-button"
                    >
                        <ArrowLeft className="me-2" />
                        Regresar al Dashboard
                    </Button>
                </div>

                <Row className="justify-content-center">
                    <Col className='supplier-registration-card' md={10} lg={8}>
                        <Card className="supplier-registration-main-card">
                            <Card.Header className="text-center registration-header">
                                <Building size={40} className="mb-3 text-primary" />
                                <h2 className="registration-title">Registro de Proveedor</h2>
                                <p className="registration-subtitle">
                                    Completa la información de tu negocio para comenzar a vender en nuestra plataforma
                                </p>
                                <Badge bg="warning" className="status-badge">
                                    <Clock className="me-1" />
                                    Aprobación requerida
                                </Badge>
                            </Card.Header>
                            
                            <Card.Body className="registration-body">
                                {error && (
                                    <Alert variant="danger" className="mb-4">
                                        {error}
                                    </Alert>
                                )}

                                <Alert variant="info" className="process-info">
                                    <strong>Proceso de verificación:</strong> 
                                    Tu información será revisada por nuestro equipo. 
                                    Este proceso puede tomar de 1 a 3 días hábiles. Te notificaremos por email.
                                </Alert>

                                <Form onSubmit={handleSubmit}>
                                    {/* Información de la Empresa */}
                                    <section className="mb-5">
                                        <h5 className="section-title">
                                            <Building className="me-2" />
                                            Información de la Empresa
                                        </h5>
                                        
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Nombre Comercial *</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="companyName"
                                                        value={formData.companyName}
                                                        onChange={handleInputChange}
                                                        isInvalid={!!errors.companyName}
                                                        placeholder="Ej: Mi Empresa S.A."
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.companyName}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Razón Social</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="legalName"
                                                        value={formData.legalName}
                                                        onChange={handleInputChange}
                                                        placeholder="Ej: Mi Empresa, Sociedad Anónima"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Descripción del Negocio</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                placeholder="Describe los productos o servicios que ofreces..."
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Registro Mercantil</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="businessRegistration"
                                                        value={formData.businessRegistration}
                                                        onChange={handleInputChange}
                                                        placeholder="Número de registro comercial"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Código Postal</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="postalCode"
                                                        value={formData.postalCode}
                                                        onChange={handleInputChange}
                                                        placeholder="Código postal"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </section>

                                    {/* Información de Contacto */}
                                    <section className="mb-5">
                                        <h5 className="section-title">Información de Contacto</h5>
                                        
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Email de Contacto *</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        name="contactEmail"
                                                        value={formData.contactEmail}
                                                        onChange={handleInputChange}
                                                        isInvalid={!!errors.contactEmail}
                                                        placeholder="contacto@miempresa.com"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.contactEmail}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Teléfono *</Form.Label>
                                                    <Form.Control
                                                        type="tel"
                                                        name="contactPhone"
                                                        value={formData.contactPhone}
                                                        onChange={handleInputChange}
                                                        isInvalid={!!errors.contactPhone}
                                                        placeholder="+53 5 123 4567"
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors.contactPhone}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Dirección</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                placeholder="Dirección completa de tu negocio"
                                            />
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Ciudad</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        placeholder="Ciudad"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>País</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="country"
                                                        value={formData.country}
                                                        onChange={handleInputChange}
                                                        placeholder="País"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </section>

                                    {/* Documentos */}
                                    <section className="mb-4">
                                        <h5 className="section-title">
                                            <FileText className="me-2" />
                                            Documentos Requeridos
                                        </h5>
                                        
                                        <Alert variant="info" className="process-info mt-4">
                                            <strong>Importante:</strong> Todos los documentos deben estar actualizados, 
                                            ser legibles y en formato PDF, JPG o PNG. Tamaño máximo por archivo: 5MB.
                                        </Alert>
                                        
                                        <DocumentUpload
                                            label="Licencia Comercial *"
                                            fileType="businessLicense"
                                            file={documents.businessLicense}
                                            onFileChange={handleFileChange}
                                            error={errors.businessLicense}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        
                                        <DocumentUpload
                                            label="Constancia de Situación Fiscal *"
                                            fileType="taxCertificate"
                                            file={documents.taxCertificate}
                                            onFileChange={handleFileChange}
                                            error={errors.taxCertificate}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        
                                        <DocumentUpload
                                            label="Identificación Oficial del Representante *"
                                            fileType="idDocument"
                                            file={documents.idDocument}
                                            onFileChange={handleFileChange}
                                            error={errors.idDocument}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                    </section>

                                    <div className="text-center">
                                       <Button
                                            variant="primary"
                                            type="submit"
                                            disabled={loading}
                                            className="w-100 submit-button"
                                            size="lg"
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Enviando Solicitud...
                                                </>
                                            ) : (
                                                'Enviar para Aprobación'
                                            )}
                                        </Button>
                                        
                                        <p className="text-muted mt-3 small">
                                            Al enviar esta solicitud, aceptas nuestros términos y condiciones.
                                        </p>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </motion.div>
        </Container>
    );
};

// Componente de subida de documentos (sin cambios)
const DocumentUpload = ({ label, fileType, file, onFileChange, error, accept }) => {
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validar tamaño (5MB máximo)
            if (selectedFile.size > 5 * 1024 * 1024) {
                AlertService.error({
                    title: 'Archivo muy grande',
                    text: 'El archivo no puede ser mayor a 5MB'
                });
                return;
            }
            onFileChange(fileType, selectedFile);
        }
    };

    const handleRemoveFile = () => {
        onFileChange(fileType, null);
    };

    return (
        <Form.Group className="mb-4">
            <Form.Label className="document-label">{label}</Form.Label>
            <div className="document-upload-area">
                <Form.Control
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="d-none"
                    id={`file-${fileType}`}
                />
                <label 
                    htmlFor={`file-${fileType}`} 
                    className={`document-upload-label ${error ? 'is-invalid' : ''}`}
                >
                    {file ? (
                        <div className="document-preview">
                            <div className="document-info">
                                <FileText className="document-icon" />
                                <div className="document-details">
                                    <span className="document-name">{file.name}</span>
                                    <small className="document-size">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </small>
                                </div>
                            </div>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemoveFile();
                                }}
                                className="remove-button"
                            >
                                Eliminar
                            </Button>
                        </div>
                    ) : (
                        <div className="document-placeholder">
                            <Upload className="upload-icon" />
                            <div className="placeholder-text">
                                <span>Seleccionar {label}</span>
                                <small>PDF, JPG, PNG (max. 5MB)</small>
                            </div>
                        </div>
                    )}
                </label>
                {error && (
                    <div className="invalid-feedback d-block">
                        {error}
                    </div>
                )}
            </div>
        </Form.Group>
    );
};

export default SupplierRegistration;