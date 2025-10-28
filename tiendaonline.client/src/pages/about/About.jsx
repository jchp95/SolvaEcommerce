import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import "./About.css";

export default function About() {
  return (
    <Container fluid className="about-page cu-page" as="main">
      <Row className="justify-content-center mb-4">
        <Col xs={12} md={10} lg={8}>
          <Card className="about-card cu-card cu-gradient-card text-center mb-4">
            <Card.Body>
              <Card.Title as="h2" className="about-title mb-3">Sobre SOLVA</Card.Title>
              <Card.Text className="about-desc">
                SOLVA es una robusta plataforma de comercio electrónico desarrollada utilizando <strong>React</strong>, que ofrece estilos modernos y una excelente experiencia de usuario, junto con <strong>.NET Core Web API</strong> y <strong>C#</strong> como tecnologías centrales.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="g-4 justify-content-center align-items-stretch mb-4">
        <Col xs={12} md={6}>
          <Card className="about-card cu-card cu-gradient-card h-100">
            <Card.Body>
              <Card.Title as="h3" className="about-section-title mb-2">¿A quién va dirigida?</Card.Title>
              <Card.Text>
                Esta plataforma está diseñada para Micro, Pequeñas y Medianas Empresas (Mipymes) en Cuba que desean expandir su alcance y comercializar sus productos de manera efectiva. Lanzamiento previsto: <strong>enero de 2026</strong>.
                <br />
                En SOLVA, valoramos el cumplimiento de las normativas y regulaciones que rigen sus negocios, asegurando una plataforma segura y de confianza para su crecimiento.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="about-card cu-card cu-gradient-card h-100">
            <Card.Body>
              <Card.Title as="h3" className="about-section-title mb-2">Pagos y Flexibilidad</Card.Title>
              <Card.Text>
                SOLVA ofrecerá un sistema de pago diverso: efectivo y transferencias en moneda nacional, MLC, USD, y pagos internacionales (PayPal, Mastercard, Visa, Stripe, Tropipay, entre otras). Cada proveedor podrá elegir sus métodos preferidos y los usuarios accederán a una amplia gama de opciones.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="justify-content-center mb-4">
        <Col xs={12} md={10} lg={8}>
          <Card className="about-card cu-card cu-gradient-card text-center">
            <Card.Body>
              <Card.Title as="h3" className="about-section-title mb-2">Sostenibilidad y Futuro</Card.Title>
              <Card.Text>
                Se implementará un impuesto del <strong>1% al 3%</strong> por cada venta realizada, destinado al mantenimiento de la plataforma y a la continuidad de mejoras y promociones para nuestros socios más destacados.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
