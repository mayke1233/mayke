import { pct } from "@/lib/format";

export function Semaphore({
  min,
  drop,
  floor,
}: {
  min: number;
  drop: number;
  floor: number;
}) {
  return (
    <div className="sem-grid">
      <article className="sem verde">
        <p>Verde · executa</p>
        <h3>Dentro da régua</h3>
        <p>
          A margem fica em {pct(min)} ou mais, e a ação não tira mais que {drop.toString().replace(".", ",")} pontos.
          O squad faz e registra.
        </p>
      </article>
      <article className="sem amarelo">
        <p>Amarelo · você aprova</p>
        <h3>Passou do limite</h3>
        <p>
          A queda de margem é maior que {drop.toString().replace(".", ",")} pontos, ou a ação é liquidação, reclamação,
          reposição de Full ou aumento grande de verba.
        </p>
      </article>
      <article className="sem vermelho">
        <p>Vermelho · não mexe</p>
        <h3>Fora do piso</h3>
        <p>
          A ação deixaria a margem abaixo de {pct(min)}, ou a liquidação abaixo de {pct(floor)}. O squad anota o motivo e
          para.
        </p>
      </article>
    </div>
  );
}
