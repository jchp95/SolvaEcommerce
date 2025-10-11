import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ModalUser = ({ show, onHide, onSuccess, isEditing = false, userId, initialData, canEditUserName = false }) => {
  const [form, setForm] = useState({ email: '', phoneNumber: '', userName: '' });
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (show && initialData) {
      setForm({
        email: initialData.email || '',
        phoneNumber: initialData.phoneNumber || '',
        userName: initialData.userName || ''
      });
    }
  }, [show, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidated(true);
    if (!form.email || (canEditUserName && !form.userName)) return;
    onSuccess({ ...initialData, ...form });
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
      </Modal.Header>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          {canEditUserName && (
            <Form.Group className="mb-3" controlId="userName">
              <Form.Label>Usuario</Form.Label>
              <Form.Control
                type="text"
                name="userName"
                value={form.userName}
                onChange={handleChange}
                required
                autoFocus
              />
              <Form.Control.Feedback type="invalid">
                El nombre de usuario es obligatorio.
              </Form.Control.Feedback>
            </Form.Group>
          )}
          <Form.Group className="mb-3" controlId="userEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoFocus={!canEditUserName}
            />
            <Form.Control.Feedback type="invalid">
              El correo es obligatorio y debe ser válido.
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="userPhone">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control
              type="text"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Guardar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalUser;
