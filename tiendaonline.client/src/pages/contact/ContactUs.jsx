// ContactUs.jsx (versión con React-Bootstrap)
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSiteSettings } from "../../features/reduxSlices/siteSettings/siteSettingsSlice";
import {
  FaWhatsapp,
  FaTelegram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaUserTie,
  FaRegClock,
  FaStar,
} from "react-icons/fa";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert
} from "react-bootstrap";
import "./ContactUs.css";

const initialState = { name: "", email: "", message: "" };

export default function ContactUs() {
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);
  const dispatch = useDispatch();
  const { data: siteSettings, status } = useSelector((s) => s.siteSettings);

  useEffect(() => {
    if (!siteSettings && status !== "loading") dispatch(fetchSiteSettings());
  }, [dispatch, siteSettings, status]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: integra tu POST real aquí
    setSubmitted(true);
    setForm(initialState);
    window.setTimeout(() => setSubmitted(false), 3500);
  };

  const logoUrl = siteSettings?.logoUrl || null;
  const horario = siteSettings?.schedule || "Lunes a Viernes: 9:00–18:00\nSábados: 10:00–14:00";
  const direccion = siteSettings?.address || "";
  const email = siteSettings?.email || "";
  const phone = siteSettings?.phoneNumber || "";

  const mapaSrc = useMemo(
    () => `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`,
    [direccion]
  );

  const isLoading = status === "loading";

  return (
    <Container fluid className="cu-page" as="main">
      {/* HERO */}
      <Row className="align-items-center cu-hero mb-4" as="header" aria-labelledby="contacto-title">
        <Card className="cu-hero-badge cu-hero-gradient text-center position-relative overflow-hidden" body as="section" aria-label="Soporte personalizado">
          {logoUrl && (
            <div className="cu-hero-logo-bg">
              <img src={logoUrl} alt="Logo" className="cu-hero-logo-img" loading="lazy" />
            </div>
          )}
          <h3 id="contacto-title" className="cu-hero-title">Contacto</h3>
          <p className="cu-hero-subtitle">¿Dudas, sugerencias o soporte? Escríbenos y te respondemos pronto.</p>
          <div className="d-flex flex-column align-items-center gap-2 mt-3">
            <strong>Soporte personalizado</strong>
            <p className="m-0">Agentes reales. Respuestas claras.</p>
          </div>
        </Card>
      </Row>

      {/* GRID DE 3 CARDS DE CONTACTO */}
      <Row className="g-4 cu-grid justify-content-center align-items-stretch mb-4" as="section">
        <Col xs={12} md={4}>
          <Card className="cu-card cu-contact-card text-center h-100 position-relative d-flex align-items-center justify-content-center" aria-label="Email">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center h-100 position-relative">
              <div className="cu-contact-card-icon">
                <FaEnvelope size={64} aria-hidden="true" />
              </div>
              <div className="w-100 d-flex flex-column align-items-center justify-content-center">
                <div className="cu-contact-card-subtitle mb-2">Contáctanos por correo</div>
                <Card.Text>
                  {email ? (
                    <a href={`mailto:${email}`} className="cu-contact-card-link">{email}</a>
                  ) : (
                    <span className="cu-contact-card-link text-muted">No disponible</span>
                  )}
                </Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="cu-card cu-contact-card text-center h-100 position-relative d-flex align-items-center justify-content-center" aria-label="Teléfono">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center h-100 position-relative">
              <div className="cu-contact-card-icon">
                <FaPhoneAlt size={64} aria-hidden="true" />
              </div>
              <div className="w-100 d-flex flex-column align-items-center justify-content-center">
                <div className="cu-contact-card-subtitle mb-2">Llámanos o envía WhatsApp</div>
                <Card.Text>
                  {phone ? (
                    <a href={`tel:${phone.replace(/\s+/g, "")}`} className="cu-contact-card-link">{phone}</a>
                  ) : (
                    <span className="cu-contact-card-link text-muted">No disponible</span>
                  )}
                </Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="cu-card cu-contact-card text-center h-100 position-relative d-flex align-items-center justify-content-center" aria-label="Dirección">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center h-100 position-relative">
              <div className="cu-contact-card-icon">
                <FaMapMarkerAlt size={64} aria-hidden="true" />
              </div>
              <div className="w-100 d-flex flex-column align-items-center justify-content-center">
                <div className="cu-contact-card-subtitle mb-2">Visítanos</div>
                <Card.Text className="cu-contact-card-link text-center" style={{whiteSpace: 'pre-line'}}>
                  {direccion || <span className="text-muted">No disponible</span>}
                </Card.Text>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MAPA DEBAJO DE LAS CARDS */}
      <Row className="justify-content-center mb-4">
        <Col xs={12} md={10} lg={8}>
          <Card className="cu-card cu-map-card">
            <Card.Body className="p-0">
              {isLoading ? (
                <div className="cu-skeleton cu-skel-map" style={{ minHeight: 250 }} />
              ) : (
                <iframe
                  title="Ubicación de la tienda"
                  src={mapaSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ border: 0, width: "100%", height: 300, borderRadius: "0 0 1rem 1rem" }}
                  allowFullScreen=""
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}