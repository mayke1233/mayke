import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { TopBar } from "../components/TopBar";

export function Privacy() {
  return (
    <div className="site">
      <TopBar />
      <main className="section prose">
        <p className="eyebrow">Privacidade</p>
        <h1>O que esta demonstração guarda</h1>
        <p>
          Quórum, nesta versão, é um protótipo que roda no seu navegador. Não há conta, servidor
          nem envio de formulário para um terceiro.
        </p>
        <p>
          Se você preencher o pedido de demonstração, nome, e-mail, loja e faixa de faturamento
          ficam no armazenamento local deste navegador, na chave <code>quorum.leads</code>. Apagar
          os dados do site remove esse registro.
        </p>
        <p>
          A conta Casa Lume, os anúncios, as margens e a reunião do squad são fictícios. Servem
          para mostrar como a fila de alçada e o registro funcionam.
        </p>
        <p>
          <Link to="/">Voltar ao início</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
