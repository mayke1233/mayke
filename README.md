# Mayke

Escritório virtual de agentes para a rotina de uma conta no Mercado Livre. Um squad de seis agentes fecha uma pauta: preço e Buy Box, promoção, imagem, ads, estoque no Full e atendimento. O que cabe na régua é executado. O que passa do limite fica na fila. O que furaria o piso de margem é registrado e não acontece.

A conta **Casa Norte Utilidades** é uma demonstração. O motor de decisão é real; as ações alteram só o estado local. Nada é enviado ao Mercado Livre.

## Rodar

```bash
npm install
npm test
npm run dev
```

Abra o site em `/` e o escritório em `/painel`. O botão **Rodar squad** gera a reunião do momento.

## O que o squad decide

- **Verde:** executa. Troca de promoção com subsídio melhor, saída de promoção que recupera o piso, pausa ou corte de ads, resposta de pergunta com padrão claro, troca de imagem.
- **Amarelo:** espera você. Queda de margem acima do limite, liquidação de estoque parado, reposição do Full, aumento grande de verba, reclamação.
- **Vermelho:** não mexe. Igualar o concorrente ou liquidar abaixo do piso.

A margem é o lucro sobre o preço pago pelo comprador, depois de tarifa, frete e subsídio. O subsídio entra como receita do seller e não muda o desconto que o comprador vê.

## Régua

Em `/regras` dá para mudar piso, meta, ACOS, cobertura do Full e liquidação. Salvar vale para a próxima reunião. **Restaurar demonstração** volta a Casa Norte ao início.
