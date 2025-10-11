import { Offcanvas } from 'react-bootstrap';
import { X } from 'react-bootstrap-icons';
import './Sidebar.css';

const Sidebar = ({
  isOpen,
  onClose,
  title = "Panel de Administración",
  children,
  width = 280,
  placement = "start" // <- por defecto a la izquierda
}) => {
  return (
    <Offcanvas
      show={isOpen}
      onHide={onClose}
      placement={placement}
      style={{ width }}
      className="sidebar-container"
    >
      <Offcanvas.Header className="sidebar-header">
        <Offcanvas.Title className="sidebar-title">{title}</Offcanvas.Title>
        <button
          onClick={onClose}
          className="sidebar-close-btn ms-2"
          aria-label="Cerrar menú"
        >
          <X size={24} />
        </button>
      </Offcanvas.Header>

      <Offcanvas.Body className="sidebar-body">
        {children}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default Sidebar;
