# Mayke

Escritório virtual de agentes para a rotina de uma conta no Mercado Livre. Um squad de seis agentes fecha uma pauta: preço e Buy Box, promoção, imagem, ads, estoque no Full e atendimento. O que cabe na régua é executado. O que passa do limite fica na fila. O que furaria o piso de margem é registrado e não acontece.

A conta **Casa Norte Utilidades** é uma demonstração. O motor de decisão é real; as ações alteram só o estado local. Nada é enviado ao Mercado Livre.

## Rodar

Os comandos precisam ser executados dentro da pasta do projeto, não em `C:\Windows\System32`.

```bash
npm install
npm test
npm run dev -- -p 3001
```

Abra `http://localhost:3001`. Se essa porta também estiver ocupada, troque o número.

## Conectar o Mercado Livre

1. Crie um aplicativo no DevCenter do Mercado Livre.
2. No DevCenter, apague a redirect URI com `localhost`. Com o site aberto, rode `cloudflared tunnel --url http://localhost:3001` e cadastre `https://o-endereco-do-tunel/api/ml/callback`. O Mercado Livre responde 403 quando a URI usa `localhost`.
3. Informe o App ID e a Secret Key nessa tela. Eles ficam só nesta máquina.
4. Autorize com o usuário administrador da conta.
5. Em cada anúncio, salve custo e frete. Sem custo, o squad não altera preço.
6. **Rodar squad** publica no Mercado Livre o preço e a resposta que estiverem verdes ou que você aprovar.

Promoção, Mercado Ads, troca de imagem e envio ao Full entram na ata e não são enviados para a conta. A demonstração Casa Norte continua disponível enquanto nenhuma conta estiver conectada.

## O que o squad decide

- **Verde:** executa. Troca de promoção com subsídio melhor, saída de promoção que recupera o piso, pausa ou corte de ads, resposta de pergunta com padrão claro, troca de imagem.
- **Amarelo:** espera você. Queda de margem acima do limite, liquidação de estoque parado, reposição do Full, aumento grande de verba, reclamação.
- **Vermelho:** não mexe. Igualar o concorrente ou liquidar abaixo do piso.

A margem é o lucro sobre o preço pago pelo comprador, depois de tarifa, frete e subsídio. O subsídio entra como receita do seller e não muda o desconto que o comprador vê.

## Régua

Em `/regras` dá para mudar piso, meta, ACOS, cobertura do Full e liquidação. Salvar vale para a próxima reunião. **Restaurar demonstração** volta a Casa Norte ao início.
