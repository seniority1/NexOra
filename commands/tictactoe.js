import TicTacToe from "../utils/tictactoe.js";

const games = {};

export default {
  name: "tictactoe",
  description: "Play a Tic Tac Toe game with a friend",
  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

    const command = text.split(" ")[0].replace("!", "").trim();
    const param = text.split(" ")[1];

    // Start game: !tictactoe @user
    if (!param && !games[chatId]) {
      await sock.sendMessage(chatId, {
        text: "👋 Tag someone to play with!\nExample: *!tictactoe @user*",
      });
      return;
    }

    if (!games[chatId] && param) {
      const opponent = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!opponent)
        return sock.sendMessage(chatId, { text: "⚠️ Please tag your opponent." });

      games[chatId] = {
        game: new TicTacToe(sender, opponent),
        players: [sender, opponent],
      };

      await sock.sendMessage(chatId, {
        text: `🎮 *TicTacToe Started!*\n\n❌ <@${sender.split("@")[0]}> vs ⭕ <@${opponent.split("@")[0]}>\n\nUse *!move 1-9* to play!`,
        mentions: [sender, opponent],
      });

      return showBoard(sock, chatId, games[chatId].game);
    }
  },
};

// Helper function
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
