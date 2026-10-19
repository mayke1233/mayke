import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

type Props = {
  mode?: "site" | "office";
};

export function TopBar({ mode = "site" }: Props) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Quórum, início">
          <span className="brand-mark" aria-hidden="true">
            Q
          </span>
          <span>
            <strong>Quórum</strong>
            <small>escritório virtual</small>
          </span>
        </Link>

        <button
          className="nav-burger"
          type="button"
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Fechar" : "Menu"}
        </button>

        <nav id="menu-principal" className={open ? "nav-links is-open" : "nav-links"}>
          {mode === "office" ? (
            <>
              <Link to="/#squad">Squad</Link>
              <Link to="/#alcada">Alçada</Link>
              <Link to="/escritorio" aria-current="page">
                Escritório
              </Link>
            </>
          ) : (
            <>
              <a href="#squad">Squad</a>
              <a href="#alcada">Alçada</a>
              <a href="#registro">Registro</a>
              <Link to="/escritorio">Escritório</Link>
            </>
          )}
          <Link className="btn btn-primary btn-small" to="/#demonstracao">
            Pedir demonstração
          </Link>
        </nav>
      </div>
    </header>
  );
}
