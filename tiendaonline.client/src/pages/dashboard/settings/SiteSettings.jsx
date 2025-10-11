import { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    Button,
    Image,
    InputGroup
} from 'react-bootstrap';
import {
    Building,
    Envelope,
    Telephone,
    GeoAlt,
    Globe,
    Facebook,
    Instagram,
    Twitter,
    QrCode,
    ImageFill,
    InfoCircle
} from 'react-bootstrap-icons';
import { motion } from 'framer-motion';
import { SiteSettingsService } from '../../../api/endpoints/siteSettings';
import AlertService from '../../../services/AlertService';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteSettings, updateSiteSettings } from '../../../features/reduxSlices/siteSettings/siteSettingsSlice';
import './SiteSettings.css';

const SiteSettings = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        siteName: '',
        logoUrl: '',
        description: '',
        address: '',
        phoneNumber: '',
        email: '',
        qrCodeUrl: '',
        website: '',
        facebookUrl: '',
        instagramUrl: '',
        twitterUrl: ''
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [logoFile, setLogoFile] = useState(null);
    const [qrFile, setQrFile] = useState(null);

    const dispatch = useDispatch();
    const { data: siteSettings, loading: reduxLoading } = useSelector(state => state.siteSettings);

    useEffect(() => {
        dispatch(fetchSiteSettings());
    }, [dispatch]);

    useEffect(() => {
        if (siteSettings) {
            setFormData({
                siteName: siteSettings.siteName || '',
                logoUrl: siteSettings.logoUrl || '',
                description: siteSettings.description || '',
                address: siteSettings.address || '',
                phoneNumber: siteSettings.phoneNumber || '',
                email: siteSettings.email || '',
                qrCodeUrl: siteSettings.qrCodeUrl || '',
                website: siteSettings.website || '',
                facebookUrl: siteSettings.facebookUrl || '',
                instagramUrl: siteSettings.instagramUrl || '',
                twitterUrl: siteSettings.twitterUrl || ''
            });
        }
    }, [siteSettings]);

    const loadSiteSettings = () => {
        dispatch(fetchSiteSettings());
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.siteName.trim()) {
            newErrors.siteName = 'El nombre del sitio es requerido';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'El email no es válido';
        }

        if (formData.phoneNumber && !/^[+]?[0-9\s\-()]+$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'El número de teléfono no es válido';
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

        // Mostrar confirmación antes de guardar
        const result = await AlertService.confirm({
            title: '¿Guardar Configuración?',
            text: 'Se actualizará la información del sitio web.',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            setLoading(true);
            let updatedFormData = { ...formData };

            // Subir logo si hay un archivo nuevo
            if (logoFile) {
                try {
                    const logoUrl = await uploadFile(logoFile, 'logo');
                    updatedFormData.logoUrl = logoUrl;
                } catch (error) {
                    await AlertService.error({
                        title: 'Error al subir Logo',
                        text: 'No se pudo subir el archivo del logo. Intenta nuevamente.'
                    });
                    setLoading(false);
                    return;
                }
            }

            // Subir QR si hay un archivo nuevo
            if (qrFile) {
                try {
                    const qrUrl = await uploadFile(qrFile, 'qr');
                    updatedFormData.qrCodeUrl = qrUrl;
                } catch (error) {
                    await AlertService.error({
                        title: 'Error al subir Código QR',
                        text: 'No se pudo subir el archivo del código QR. Intenta nuevamente.'
                    });
                    setLoading(false);
                    return;
                }
            }

            const action = await dispatch(updateSiteSettings(updatedFormData));
            if (updateSiteSettings.fulfilled.match(action)) {
                const savedSettings = action.payload;
                setFormData({
                    siteName: savedSettings.siteName || '',
                    logoUrl: savedSettings.logoUrl || '',
                    description: savedSettings.description || '',
                    address: savedSettings.address || '',
                    phoneNumber: savedSettings.phoneNumber || '',
                    email: savedSettings.email || '',
                    qrCodeUrl: savedSettings.qrCodeUrl || '',
                    website: savedSettings.website || '',
                    facebookUrl: savedSettings.facebookUrl || '',
                    instagramUrl: savedSettings.instagramUrl || '',
                    twitterUrl: savedSettings.twitterUrl || ''
                });
                setLogoFile(null);
                setQrFile(null);
                await AlertService.success({
                    title: '¡Configuración Guardada!',
                    text: 'La información del sitio ha sido actualizada correctamente.'
                });
            } else {
                await AlertService.error({
                    title: 'Error al Guardar',
                    text: action.payload?.message || 'No se pudo actualizar la configuración.'
                });
            }
        } catch (error) {
            await AlertService.error({
                title: 'Error del Servidor',
                text: 'Ocurrió un error inesperado. Intenta nuevamente más tarde.'
            });
        } finally {
            setLoading(false);
        }
    };

    const showAlert = async (type, message) => {
        if (type === 'success') {
            await AlertService.success({
                title: '¡Éxito!',
                text: message
            });
        } else if (type === 'error') {
            await AlertService.error({
                title: 'Error',
                text: message
            });
        }
    };

    const handleFileChange = async (e, fileType) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            await AlertService.error({
                title: 'Tipo de Archivo Inválido',
                text: 'Solo se permiten archivos de imagen: JPG, PNG, GIF, WEBP'
            });
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            await AlertService.error({
                title: 'Archivo Muy Grande',
                text: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). El tamaño máximo permitido es 5MB.`
            });
            return;
        }

        // Crear vista previa
        const reader = new FileReader();
        reader.onloadend = () => {
            if (fileType === 'logo') {
                setLogoFile(file);
            } else if (fileType === 'qr') {
                setQrFile(file);
            }
        };
        reader.readAsDataURL(file);
    };

    const uploadFile = async (file, fileType) => {
        const formDataToUpload = new FormData();
        formDataToUpload.append('file', file);
        formDataToUpload.append('type', fileType);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataToUpload
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al subir el archivo');
            }

            const data = await response.json();
            if (data.success && data.data) {
                return data.data.url;
            } else {
                throw new Error(data.message || 'Error en la respuesta del servidor');
            }
        } catch (error) {
            throw error;
        }
    };

    const renderInputField = (name, label, icon, placeholder, type = 'text') => (
        <Col md={6} className="mb-3">
            <Form.Group>
                <Form.Label className="settings-label">
                    {icon} {label}
                </Form.Label>
                <InputGroup>
                    <Form.Control
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        isInvalid={!!errors[name]}
                        className="settings-input"
                    />
                </InputGroup>
                {errors[name] && (
                    <Form.Control.Feedback type="invalid">
                        {errors[name]}
                    </Form.Control.Feedback>
                )}
            </Form.Group>
        </Col>
    );

    const renderFileUploadField = (fileType, label, icon, accept = "image/*") => {
        const file = fileType === 'logo' ? logoFile : qrFile;
        const hasFile = !!file;
        
        const handleChangeFile = () => {
            const fileInput = document.getElementById(`${fileType}-upload`);
            if (fileInput) {
                fileInput.click();
            }
        };
        
        return (
            <Col md={6} className="mb-3">
                <Form.Group>
                    <Form.Label className="settings-label">
                        {icon} {label}
                    </Form.Label>
                    <div className="file-upload-container">
                        <Form.Control
                            type="file"
                            accept={accept}
                            onChange={(e) => handleFileChange(e, fileType)}
                            className="settings-file-input"
                            id={`${fileType}-upload`}
                            style={{ display: 'none' }}
                        />
                        <div className="file-upload-label" onClick={!hasFile ? handleChangeFile : undefined}>
                            <div className={`file-upload-content ${hasFile ? 'has-file' : ''}`}>
                                {hasFile ? (
                                    <div className="file-preview">
                                        <div className="file-info">
                                            <small className="text-muted">
                                                {file.name}
                                            </small>
                                            <div className="mt-1">
                                                <small className="text-success">
                                                    ✓ Archivo seleccionado
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
                                ) : (
                                    <div className="file-placeholder">
                                        {icon}
                                        <span>Seleccionar {label}</span>
                                        <small>JPG, PNG, GIF hasta 5MB</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Form.Group>
            </Col>
        );
    };

    return (
        <div className="settings-container">
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
                        <Card className="settings-card">
                            <Card.Header className="settings-header">
                                <Row className="text-center">
                                    <Col>
                                        <h2 className="settings-title">
                                            Configuración del Sitio
                                        </h2>
                                        <p className="settings-subtitle">
                                            Administra la información básica de tu tienda online
                                        </p>
                                    </Col>
                                </Row>
                            </Card.Header>
                            <Card.Body className="settings-body">
                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        {/* Columna Izquierda */}
                                        <Col md={6}>
                                            {/* Información Básica */}
                                            <Card className="settings-section-card mb-4">
                                                <Card.Header>
                                                    <h5 className="section-title">
                                                        <InfoCircle className="me-2" />
                                                        Información Básica
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        {renderInputField('siteName', 'Nombre del Sitio', <Building />, 'Ingresa el nombre de tu tienda')}
                                                        {renderInputField('description', 'Descripción', <InfoCircle />, 'Descripción de tu tienda')}
                                                    </Row>
                                                    <Row>
                                                        {renderFileUploadField('logo', 'Logo', <ImageFill />)}
                                                        {renderFileUploadField('qr', 'Código QR', <QrCode />)}
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        {/* Columna Derecha */}
                                        <Col md={6}>
                                            {/* Información de Contacto */}
                                            <Card className="settings-section-card mb-4">
                                                <Card.Header>
                                                    <h5 className="section-title">
                                                        <Telephone className="me-2" />
                                                        Información de Contacto
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        {renderInputField('email', 'Email', <Envelope />, 'contacto@tutienda.com', 'email')}
                                                        {renderInputField('phoneNumber', 'Teléfono', <Telephone />, '+1 (555) 123-4567')}
                                                    </Row>
                                                    <Row>
                                                        <Col md={12} className="mb-3">
                                                            <Form.Group>
                                                                <Form.Label className="settings-label">
                                                                    <GeoAlt /> Dirección
                                                                </Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={3}
                                                                    name="address"
                                                                    value={formData.address}
                                                                    onChange={handleChange}
                                                                    placeholder="Ingresa la dirección completa de tu tienda"
                                                                    className="settings-input"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                            {/* Redes Sociales y Web */}
                                            <Card className="settings-section-card mb-4">
                                                <Card.Header>
                                                    <h5 className="section-title">
                                                        <Globe className="me-2" />
                                                        Redes Sociales y Web
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Row>
                                                        {renderInputField('website', 'Sitio Web', <Globe />, 'https://tutienda.com')}
                                                        {renderInputField('facebookUrl', 'Facebook', <Facebook />, 'https://facebook.com/tutienda')}
                                                    </Row>
                                                    <Row>
                                                        {renderInputField('instagramUrl', 'Instagram', <Instagram />, 'https://instagram.com/tutienda')}
                                                        {renderInputField('twitterUrl', 'Twitter', <Twitter />, 'https://twitter.com/tutienda')}
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                    {/* Botones de acción */}
                                    <div className="settings-actions">
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
                                                'Guardar Configuración'
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            type="button"
                                            onClick={loadSiteSettings}
                                            disabled={loading}
                                            className="ms-3"
                                        >
                                            Recargar
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </motion.div>
        </div>
    );
};

export default SiteSettings;
