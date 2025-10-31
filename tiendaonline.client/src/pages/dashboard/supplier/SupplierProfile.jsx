import { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Form,
    Button,
    Badge,
    Alert,
    InputGroup,
    Spinner
} from 'react-bootstrap';
import {
    Building,
    Envelope,
    Telephone,
    GeoAlt,
    Clock,
    CheckCircle,
    XCircle,
    Upload,
    ArrowLeft,
    ImageFill,
    FileEarmarkPdf,
    Eye,
    Download
} from 'react-bootstrap-icons';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './SupplierProfile.css';
import { fetchSupplierProfile, updateSupplierProfile } from '../../../features/reduxSlices/suppliers/suppliersSlice';
import AlertService from '../../../services/AlertService';

    const SupplierProfile = () => {
        const dispatch = useDispatch();
        const navigate = useNavigate();
        const { profile, loading } = useSelector(state => state.suppliers);
        
        const [formData, setFormData] = useState({
        id: 0, // ← Agregar ID
        companyName: '',
        legalName: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        city: '',
        country: 'Cuba',
        postalCode: '',
        businessRegistration: '',
        // NUEVOS CAMPOS
        taxId: '',
        commissionRate: 15.0, // Valor por defecto
        paymentMethod: '',
        paymentAccount: '',
        logo: '', // Para la URL actual del logo
        banner: '' // Para la URL actual del banner
    });

    const [logoFile, setLogoFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [isEditing, setIsEditing] = useState(true);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        dispatch(fetchSupplierProfile());
    }, [dispatch]);

    useEffect(() => {
        if (profile) {
            setFormData({
                id: profile.id || 0,
                companyName: profile.companyName || '',
                legalName: profile.legalName || '',
                description: profile.description || '',
                contactEmail: profile.contactEmail || '',
                contactPhone: profile.contactPhone || '',
                address: profile.address || '',
                city: profile.city || '',
                country: profile.country || 'Cuba',
                postalCode: profile.postalCode || '',
                businessRegistration: profile.businessRegistration || '',
                // NUEVOS CAMPOS
                taxId: profile.taxId || '',
                commissionRate: profile.commissionRate || 15.0,
                paymentMethod: profile.paymentMethod || '',
                paymentAccount: profile.paymentAccount || '',
                logo: profile.logo || '',
                banner: profile.banner || ''
            });
        }
    }, [profile]);

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            await AlertService.error({
                title: 'Formulario Incompleto',
                text: 'Por favor corrige los errores en el formulario antes de continuar.'
            });
            return;
        }

        try {
            // Crear objeto con todos los datos del formulario
            const submitData = {
                ...formData,
                // Asegurar que los valores numéricos sean correctos
                commissionRate: parseFloat(formData.commissionRate) || 15.0
            };

            // Si hay archivos nuevos, procesarlos primero
            let updatedData = { ...submitData };

            if (logoFile) {
                // Aquí deberías subir el archivo y obtener la URL
                // Por ahora mantenemos la URL existente
                console.log('Nuevo logo seleccionado:', logoFile);
            }

            if (bannerFile) {
                // Aquí deberías subir el archivo y obtener la URL
                console.log('Nuevo banner seleccionado:', bannerFile);
            }

            // Enviar la solicitud PUT con todos los datos
            await dispatch(updateSupplierProfile({ 
                id: profile.id, 
                formData: updatedData 
            })).unwrap();
            
            await AlertService.success({
                title: 'Perfil Actualizado',
                text: 'La información de tu proveedor ha sido actualizada correctamente.'
            });

            setIsEditing(false);
            setLogoFile(null);
            setBannerFile(null);

            // Recargar los datos actualizados
            dispatch(fetchSupplierProfile());

        } catch (error) {
            await AlertService.error({
                title: 'Error',
                text: error.message || 'Error al actualizar el perfil'
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

    const handleFileChange = async (e, fileType) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
            await AlertService.error({
                title: 'Archivo no válido',
                text: 'Solo se permiten archivos de imagen'
            });
            return;
        }

        // Validar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
            await AlertService.error({
                title: 'Archivo muy grande',
                text: 'La imagen no puede ser mayor a 5MB'
            });
            return;
        }

        if (fileType === 'logo') {
            setLogoFile(file);
        } else if (fileType === 'banner') {
            setBannerFile(file);
        }
    };

    const getStatusBadge = () => {
        switch (profile?.status) {
            case 'pending':
            case 'Pending':
                return <Badge bg="warning" className="status-badge"><Clock className="me-1" /> Pendiente</Badge>;
            case 'active':
            case 'Active':
                return <Badge bg="success" className="status-badge"><CheckCircle className="me-1" /> Activo</Badge>;
            case 'suspended':
            case 'Suspended':
                return <Badge bg="danger" className="status-badge"><XCircle className="me-1" /> Suspendido</Badge>;
            default:
                return <Badge bg="secondary" className="status-badge">Desconocido</Badge>;
        }
    };

    const handleViewDocument = (documentUrl) => {
        if (documentUrl) {
            window.open(`${window.location.origin}${documentUrl}`, '_blank');
        }
    };

    const handleDownloadDocument = (documentUrl, documentName) => {
        if (documentUrl) {
            const link = document.createElement('a');
            link.href = `${window.location.origin}${documentUrl}`;
            link.download = documentName;
            link.click();
        }
    };

    const renderInputField = (name, label, icon, placeholder, type = 'text', as = 'input', rows = null) => (
        <Form.Group className="mb-3">
            <Form.Label className="profile-label">
                {icon} {label}
            </Form.Label>
            <InputGroup>
                <Form.Control
                    type={type}
                    as={as}
                    rows={rows}
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={!isEditing}
                    isInvalid={!!errors[name]}
                    className="profile-input"
                />
            </InputGroup>
            {errors[name] && (
                <Form.Control.Feedback type="invalid">
                    {errors[name]}
                </Form.Control.Feedback>
            )}
        </Form.Group>
    );

    const renderFileUploadField = (fileType, label, currentImage, aspectRatio = "1/1") => {
        const file = fileType === 'logo' ? logoFile : bannerFile;
        const hasFile = !!file;
        const hasCurrentImage = !!currentImage;
        
        const handleChangeFile = () => {
            const fileInput = document.getElementById(`${fileType}-upload`);
            if (fileInput) {
                fileInput.click();
            }
        };
        
        return (
            <Form.Group className="mb-3">
                <Form.Label className="profile-label">
                    <ImageFill /> {label}
                </Form.Label>
                <div className="file-upload-container">
                    <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, fileType)}
                        className="profile-file-input"
                        id={`${fileType}-upload`}
                        style={{ display: 'none' }}
                        disabled={!isEditing}
                    />
                    <div 
                        className={`file-upload-label ${!isEditing ? 'disabled' : ''}`} 
                        onClick={!isEditing ? undefined : handleChangeFile}
                        style={{ aspectRatio }}
                    >
                        <div className={`file-upload-content ${hasFile || hasCurrentImage ? 'has-file' : ''}`}>
                            {(hasFile || hasCurrentImage) ? (
                                <div className="file-preview">
                                    <img 
                                        src={hasFile ? URL.createObjectURL(file) : currentImage} 
                                        alt={`Preview ${fileType}`} 
                                        className="preview-image"
                                    />
                                    {isEditing && (
                                        <div className="file-overlay">
                                            <div className="file-info">
                                                <small className="text-light">
                                                    {hasFile ? file.name : 'Imagen actual'}
                                                </small>
                                                <div className="mt-1">
                                                    <small className="text-light">
                                                        {hasFile ? '✓ Nuevo archivo seleccionado' : 'Haz clic para cambiar'}
                                                    </small>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline-light"
                                                size="sm"
                                                className="mt-2"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleChangeFile();
                                                }}
                                            >
                                                Cambiar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="file-placeholder">
                                    <Upload size={32} className="mb-2" />
                                    <span>Subir {label}</span>
                                    <small>JPG, PNG, GIF (max. 5MB)</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Form.Group>
        );
    };

    const renderDocumentCard = (documentType, documentUrl, title, description) => {
        const fileName = documentUrl ? documentUrl.split('/').pop() : 'No disponible';
        
        return (
            <Card className="document-card">
                <Card.Body className="document-card-body">
                    <div className="document-icon">
                        <FileEarmarkPdf size={32} />
                    </div>
                    <div className="document-info">
                        <h6 className="document-title">{title}</h6>
                        <p className="document-description">{description}</p>
                        {documentUrl ? (
                            <div className="document-actions">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="document-btn"
                                    onClick={() => handleViewDocument(documentUrl)}
                                >
                                    <Eye className="me-1" />
                                    Ver
                                </Button>
                                <Button
                                    variant="outline-success"
                                    size="sm"
                                    className="document-btn"
                                    onClick={() => handleDownloadDocument(documentUrl, fileName)}
                                >
                                    <Download className="me-1" />
                                    Descargar
                                </Button>
                            </div>
                        ) : (
                            <Badge bg="secondary" className="document-status">
                                No disponible
                            </Badge>
                        )}
                    </div>
                </Card.Body>
            </Card>
        );
    };

    if (loading && !profile) {
        return (
            <div className="supplier-profile-container">
                <div className="text-center">
                    <Spinner animation="border" role="status" className="profile-spinner">
                        <span className="visually-hidden">Cargando...</span>
                    </Spinner>
                    <p className="mt-2 profile-loading-text">Cargando perfil del proveedor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="supplier-profile-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Row>
                    <Col>
                        {/* Botón de regreso al dashboard */}
                        <div className="mb-3">
                            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                                ← Regresar al Dashboard
                            </Button>
                        </div>
                        
                        <Card className="supplier-profile-card">
                            <Card.Header className="profile-header">
                                <Row className="text-center">
                                    <Col>
                                        <h2 className="profile-title">
                                            Perfil del Proveedor
                                        </h2>
                                        <p className="profile-subtitle">
                                            Gestiona la información de tu negocio
                                            {profile && (
                                                <span className="ms-2">{getStatusBadge()}</span>
                                            )}
                                        </p>
                                    </Col>
                                </Row>
                            </Card.Header>
                            
                            <Card.Body className="profile-body">
                                {profile?.status === 'pending' && (
                                    <Alert variant="warning" className="profile-alert">
                                        <strong>Tu cuenta está en revisión:</strong> 
                                        Puedes actualizar tu información, pero no podrás publicar productos hasta que tu cuenta sea aprobada.
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        {/* Columna Izquierda */}
                                        <Col md={6}>
                                            {/* Banner y Logo */}
                                            <Card className="profile-section-card mb-4">
                                                <Card.Header>
                                                    <h5 className="section-title">
                                                        <ImageFill className="me-2" />
                                                        Imágenes del Proveedor
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={8}>
                                                            {renderFileUploadField(
                                                                'banner', 
                                                                'Banner del Proveedor', 
                                                                profile?.banner, 
                                                                "16/9"
                                                            )}
                                                        </Col>
                                                        <Col md={4}>
                                                            {renderFileUploadField(
                                                                'logo', 
                                                                'Logo', 
                                                                profile?.logo, 
                                                                "1/1"
                                                            )}
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>

                                            {/* Información de la Empresa */}
                                            <Card className="profile-section-card mb-4">
                                                <Card.Header>
                                                    <h5 className="section-title">
                                                        <Building className="me-2" />
                                                        Información de la Empresa
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {renderInputField(
                                                        'companyName', 
                                                        'Nombre Comercial', 
                                                        <Building />, 
                                                        'Ingresa el nombre comercial'
                                                    )}
                                                    {renderInputField(
                                                        'legalName', 
                                                        'Razón Social', 
                                                        <Building />, 
                                                        'Ingresa la razón social'
                                                    )}
                                                    {renderInputField(
                                                        'description', 
                                                        'Descripción', 
                                                        <Building />, 
                                                        'Describe tu negocio, productos y servicios...',
                                                        'text',
                                                        'textarea',
                                                        3
                                                    )}
                                                </Card.Body>
                                            </Card>

                                            {/* Documentos del Proveedor */}
                                            <Card className="profile-section-card">
                                                <Card.Header>
                                                    <h5 className="section-title">
                                                        <FileEarmarkPdf className="me-2" />
                                                        Documentos
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={12}>
                                                            {renderDocumentCard(
                                                                'businessLicense',
                                                                profile?.businessLicense,
                                                                'Licencia Comercial',
                                                                'Documento oficial de registro comercial'
                                                            )}
                                                        </Col>
                                                        <Col md={12} className="mt-3">
                                                            {renderDocumentCard(
                                                                'taxCertificate',
                                                                profile?.taxCertificate,
                                                                'Constancia Fiscal',
                                                                'Certificado de situación fiscal'
                                                            )}
                                                        </Col>
                                                        <Col md={12} className="mt-3">
                                                            {renderDocumentCard(
                                                                'idDocument',
                                                                profile?.idDocument,
                                                                'Identificación del Representante',
                                                                'Documento de identificación oficial'
                                                            )}
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        {/* Columna Derecha */}
                                        <Col md={6}>
                                            {/* Información de Contacto */}
                                            <Card className="profile-section-card mb-4">
                                                <Card.Header>
                                                    <h5 className="section-title">
                                                        <Envelope className="me-2" />
                                                        Información de Contacto
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {renderInputField(
                                                        'contactEmail', 
                                                        'Email de Contacto', 
                                                        <Envelope />, 
                                                        'contacto@empresa.com',
                                                        'email'
                                                    )}
                                                    {renderInputField(
                                                        'contactPhone', 
                                                        'Teléfono', 
                                                        <Telephone />, 
                                                        '+53 5 123 4567'
                                                    )}
                                                    {renderInputField(
                                                        'address', 
                                                        'Dirección', 
                                                        <GeoAlt />, 
                                                        'Ingresa la dirección completa',
                                                        'text',
                                                        'textarea',
                                                        2
                                                    )}
                                                    <Row>
                                                        <Col md={6}>
                                                            {renderInputField(
                                                                'city', 
                                                                'Ciudad', 
                                                                <GeoAlt />, 
                                                                'Ciudad'
                                                            )}
                                                        </Col>
                                                        <Col md={6}>
                                                            {renderInputField(
                                                                'country', 
                                                                'País', 
                                                                <GeoAlt />, 
                                                                'País'
                                                            )}
                                                        </Col>
                                                    </Row>
                                                    {renderInputField(
                                                        'postalCode', 
                                                        'Código Postal', 
                                                        <GeoAlt />, 
                                                        'Código postal'
                                                    )}
                                                </Card.Body>
                                            </Card>

                                            {/* Información Legal */}
                                            <Card className="profile-section-card">
                                                <Card.Header>
                                                    <h5 className="section-title">Información Legal</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {renderInputField(
                                                        'businessRegistration', 
                                                        'Registro Mercantil', 
                                                        <Building />, 
                                                        'Número de registro comercial'
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {isEditing && (
                                        <div className="profile-actions">
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Guardando...
                                                    </>
                                                ) : (
                                                    'Guardar Cambios'
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </motion.div>
        </div>
    );
};

export default SupplierProfile;