import TicTacToe from "../utils/tictactoe.js";
import { games } from "./tictactoe.js"; // if shared globally, adjust accordingly

export default {
  name: "move",
  description: "Make a move in TicTacToe (1-9)",
  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const position = parseInt(args[0]) - 1;

    if (!games[chatId])
      return sock.sendMessage(chatId, { text: "⚠️ No game running! Use *!tictactoe @user* first." });

    const { game } = games[chatId];
    const playerIndex = sender === game.playerX ? 0 : sender === game.playerO ? 1 : -1;

    if (playerIndex === -1)
      return sock.sendMessage(chatId, { text: "You are not part of this game!" });

    const result = game.turn(playerIndex, position);

    if (result <= 0)
      return sock.sendMessage(chatId, { text: "❌ Invalid move!" });

    await showBoard(sock, chatId, game);

    if (game.winner) {
      await sock.sendMessage(chatId, {
        text: `🏆 *${game.winner.split("@")[0]}* wins the game!`,
        mentions: [game.winner],
      });
      delete games[chatId];
    } else if (game.board === 511) {
      await sock.sendMessage(chatId, { text: "😐 It’s a draw!" });
      delete games[chatId];
    }
  },
};

async function showBoard(sock, chatId, game) {
  const board = game.render();
  const formatted = `
${board.slice(0, 3).join(" | ")}
---------
${board.slice(3, 6).join(" | ")}
---------
${board.slice(6, 9).join(" | ")}
  `;
  await sock.sendMessage(chatId, {
    text: `🎯 *${game.currentTurn.split("@")[0]}'s Turn*\n\n${formatted}`,
    mentions: [game.currentTurn],
  });
}
