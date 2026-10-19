import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <strong>Quórum</strong>
        <p>
          Protótipo de escritório virtual de agentes para sellers de marketplace.
          Contas, números e decisões desta demonstração são fictícios.
        </p>
      </div>
      <div className="footer-links">
        <Link to="/escritorio">Abrir o escritório</Link>
        <a href="/#demonstracao">Pedir demonstração</a>
        <Link to="/privacidade">Privacidade</Link>
      </div>
    </footer>
  );
}
