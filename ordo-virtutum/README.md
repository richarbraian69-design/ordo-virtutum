# Ordo Virtutum

RPG católico em 3D que roda no navegador (Three.js). Sozinho ou em co-op para até 4 jogadores.

## O que tem nesta pasta

- `index.html` e a pasta `js/`: o jogo inteiro.
- `server.js` e `package.json`: o servidor do co-op. Ele entrega o jogo e junta até quatro jogadores numa sala.

## Colocar no ar (Render, plano grátis)

1. Suba esta pasta inteira para um repositório no GitHub.
2. No Render: **New** → **Web Service** → escolha o repositório.
3. Build Command: `npm install` · Start Command: `node server.js` · Instance Type: **Free**.
4. Abra o endereço `.onrender.com` que o Render mostrar.

O plano grátis dorme depois de 15 minutos sem ninguém jogando e leva cerca de 1 minuto para acordar.

## Jogar em grupo (até 4)

1. Um jogador abre o link e clica em **Criar sala**. Aparece um código de 4 letras.
2. Os outros (até três) abrem o mesmo link, clicam em **Entrar com código** e digitam as letras.
3. Quem criou a sala é o anfitrião: o mundo, as missões e o salvamento são dele.
   Cada convidado leva o próprio personagem e guarda o XP, as moedas e os itens.

No co-op, com dois jogadores, todos os vícios têm 2,5x de vida e de dano; com três ou quatro, 3,5x.

## Rodar no próprio computador

Com o Node.js instalado: `npm install` e depois `node server.js`. Abra `http://localhost:8080`.
