//components/Modal/Modal.jsx
import { useEffect } from 'react';
import { Button, Modal as BootstrapModal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import './Modal.css'; // Importamos los estilos

const Modal = ({
    show,
    onHide,
    title,
    children,
    size,
    footerButtons,
    centered,
    scrollable,
    backdrop,
    keyboard,
}) => {
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [show]);

    return (
        <BootstrapModal
            show={show}
            onHide={onHide}
            size={size}
            centered={centered}
            scrollable={scrollable}
            backdrop={backdrop}
            keyboard={keyboard}
            className="modal-dark-theme"
        >
            {title && (
                <BootstrapModal.Header closeButton closeVariant="white">
                    <BootstrapModal.Title className="modal-title">
                        {title}
                    </BootstrapModal.Title>
                </BootstrapModal.Header>
            )}

            <BootstrapModal.Body className={scrollable ? 'modal-scrollable' : ''}>
                {children}
            </BootstrapModal.Body>

            {footerButtons && (
                <BootstrapModal.Footer>
                    {footerButtons.map((button, index) => (
                        <Button
                            key={index}
                            variant={button.variant || 'secondary'}
                            onClick={button.onClick}
                            disabled={button.disabled}
                            className={`modal-btn ${button.variant === 'primary'
                                ? 'modal-btn-primary'
                                : 'modal-btn-secondary'
                                } ${button.className || ''}`}
                        >
                            {button.text}
                        </Button>
                    ))}
                </BootstrapModal.Footer>
            )}
        </BootstrapModal>
    );
};

Modal.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    size: PropTypes.oneOf(['sm', 'lg', 'xl']),
    footerButtons: PropTypes.arrayOf(
        PropTypes.shape({
            text: PropTypes.string.isRequired,
            variant: PropTypes.string,
            onClick: PropTypes.func,
            disabled: PropTypes.bool,
            className: PropTypes.string,
        })
    ),
    centered: PropTypes.bool,
    scrollable: PropTypes.bool,
    backdrop: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['static'])]),
    keyboard: PropTypes.bool,
};

Modal.defaultProps = {
    size: 'lg',
    centered: true,
    scrollable: false,
    backdrop: true,
    keyboard: true,
};

export default Modal;