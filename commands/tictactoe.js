import TicTacToe from "../utils/tictactoe.js";

export const games = {};

export default {
  name: "tictactoe",
  description: "Start a Tic Tac Toe game",
  async execute(sock, msg) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const mentioned =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    if (!mentioned)
      return sock.sendMessage(chatId, { text: "⚠️ Tag someone to play with!" });

    if (games[chatId])
      return sock.sendMessage(chatId, { text: "🎮 A game is already active here!" });

    const game = new TicTacToe(sender, mentioned);
    games[chatId] = { game };

    await sendBoard(sock, chatId, game, msg);
  },
};

export async function sendBoard(sock, chatId, game, msg) {
  const cells = game.render();
  const view = `
${cells.slice(0,3).join(" | ")}
---------
${cells.slice(3,6).join(" | ")}
---------
${cells.slice(6,9).join(" | ")}
`;

  const buttons = cells.map((v, i) => ({
    buttonId: `move_${i}`,
    buttonText: { displayText: v === "X" || v === "O" ? "⛔" : `${i + 1}` },
    type: 1,
  }));

  await sock.sendMessage(chatId, {
    text: `🎮 *Tic Tac Toe*\n${view}\n\nTurn: @${
      game.currentTurn.split("@")[0]
    }`,
    buttons,
    headerType: 1,
    mentions: [game.currentTurn],
  }, { quoted: msg });
}
