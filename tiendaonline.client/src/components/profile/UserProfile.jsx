import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faCheck, faTimes, faCamera } from '@fortawesome/free-solid-svg-icons';
import './UserProfile.css';

const UserProfile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        dateOfBirth: user?.dateOfBirth || '',
        address: {
            streetAddress: user?.address?.streetAddress || '',
            apartment: user?.address?.apartment || '',
            city: user?.address?.city || '',
            state: user?.address?.state || '',
            zipCode: user?.address?.zipCode || '',
            country: user?.address?.country || ''
        }
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSave = () => {
        // TODO: Implement API call to update user profile
        console.log('Saving user data:', formData);
        setIsEditing(false);
        // dispatch(updateUserProfile(formData));
    };

    const handleCancel = () => {
        setFormData({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phoneNumber: user?.phoneNumber || '',
            dateOfBirth: user?.dateOfBirth || '',
            address: {
                streetAddress: user?.address?.streetAddress || '',
                apartment: user?.address?.apartment || '',
                city: user?.address?.city || '',
                state: user?.address?.state || '',
                zipCode: user?.address?.zipCode || '',
                country: user?.address?.country || ''
            }
        });
        setIsEditing(false);
    };

    return (
        <div className="user-profile">
            {/* Header principal que replica el estilo del CustomerProfile */}
            <div className="profile-welcome-section">
                <div className="profile-header-main">
                    <div className="profile-left">
                        <div className="profile-avatar-main">
                            <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div className="profile-info-main">
                            <h2 className="profile-welcome-title">
                                Mi Información Personal
                            </h2>
                            <p className="profile-welcome-subtitle">
                                Gestiona tu información de cuenta y preferencias
                            </p>
                        </div>
                    </div>
                    <div className="profile-right">
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="btn-edit-main"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                                Editar perfil
                            </button>
                        ) : (
                            <div className="edit-actions-main">
                                <button onClick={handleSave} className="btn-save-main">
                                    <FontAwesomeIcon icon={faCheck} />
                                    Guardar
                                </button>
                                <button onClick={handleCancel} className="btn-cancel-main">
                                    <FontAwesomeIcon icon={faTimes} />
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="profile-content">
                {/* Información personal */}
                <div className="profile-section">
                    <h3>Información Personal</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            ) : (
                                <div className="form-display">{user?.firstName || 'No especificado'}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Apellido</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            ) : (
                                <div className="form-display">{user?.lastName || 'No especificado'}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <div className="form-display email">{user?.email}</div>
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            ) : (
                                <div className="form-display">{user?.phoneNumber || 'No especificado'}</div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Fecha de nacimiento</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            ) : (
                                <div className="form-display">
                                    {user?.dateOfBirth ? 
                                        new Date(user.dateOfBirth).toLocaleDateString('es-ES') : 
                                        'No especificado'
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dirección */}
                <div className="profile-section">
                    <h3>Dirección</h3>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Dirección</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="address.streetAddress"
                                    value={formData.address.streetAddress}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Calle y número"
                                />
                            ) : (
                                <div className="form-display">
                                    {user?.address?.streetAddress || 'No especificado'}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Apartamento/Depto</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="address.apartment"
                                    value={formData.address.apartment}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Opcional"
                                />
                            ) : (
                                <div className="form-display">
                                    {user?.address?.apartment || 'No especificado'}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Ciudad</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="address.city"
                                    value={formData.address.city}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            ) : (
                                <div className="form-display">
                                    {user?.address?.city || 'No especificado'}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Estado/Provincia</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="address.state"
                                    value={formData.address.state}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            ) : (
                                <div className="form-display">
                                    {user?.address?.state || 'No especificado'}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Código postal</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="address.zipCode"
                                    value={formData.address.zipCode}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            ) : (
                                <div className="form-display">
                                    {user?.address?.zipCode || 'No especificado'}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>País</label>
                            {isEditing ? (
                                <select
                                    name="address.country"
                                    value={formData.address.country}
                                    onChange={handleInputChange}
                                    className="form-input"
                                >
                                    <option value="">Seleccionar país</option>
                                    <option value="Cuba">Cuba</option>
                                    <option value="Argentina">Argentina</option>
                                    <option value="Brasil">Brasil</option>
                                    <option value="Chile">Chile</option>
                                    <option value="Colombia">Colombia</option>
                                    <option value="México">México</option>
                                    <option value="Perú">Perú</option>
                                    <option value="Uruguay">Uruguay</option>
                                    <option value="Venezuela">Venezuela</option>
                                    <option value="España">España</option>
                                    <option value="Estados Unidos">Estados Unidos</option>
                                </select>
                            ) : (
                                <div className="form-display">
                                    {user?.address?.country || 'No especificado'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Configuración de cuenta */}
                <div className="profile-section">
                    <h3>Configuración de Cuenta</h3>
                    <div className="account-settings">
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Cambiar contraseña</h4>
                                <p>Actualiza tu contraseña regularmente para mantener tu cuenta segura</p>
                            </div>
                            <button className="btn-secondary">
                                Cambiar contraseña
                            </button>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Notificaciones</h4>
                                <p>Configura cómo y cuándo quieres recibir notificaciones</p>
                            </div>
                            <button className="btn-secondary">
                                Configurar
                            </button>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Privacidad</h4>
                                <p>Gestiona tu privacidad y los datos que compartimos</p>
                            </div>
                            <button className="btn-secondary">
                                Ver configuración
                            </button>
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="profile-section">
                    <h3>Información de Cuenta</h3>
                    <div className="account-info">
                        <div className="info-item">
                            <span className="info-label">Rol:</span>
                            <span className="info-value">{user?.role}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Miembro desde:</span>
                            <span className="info-value">
                                {user?.createdAt ? 
                                    new Date(user.createdAt).toLocaleDateString('es-ES') : 
                                    'No disponible'
                                }
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Estado de la cuenta:</span>
                            <span className={`info-value status ${user?.isActive ? 'active' : 'inactive'}`}>
                                {user?.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
