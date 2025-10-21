class TicTacToe {
  constructor(playerX, playerO) {
    this.playerX = playerX;
    this.playerO = playerO;
    this._x = 0;
    this._o = 0;
    this._turn = false; // false = X, true = O
  }

  get board() { return this._x | this._o; }
  get currentTurn() { return this._turn ? this.playerO : this.playerX; }

  static check(state) {
    for (const combo of [7,56,73,84,146,273,292,448])
      if ((state & combo) === combo) return true;
    return false;
  }

  static toBinary(x, y) {
    if (x < 0 || x > 2 || y < 0 || y > 2) throw new Error("invalid pos");
    return 1 << (x + 3 * y);
  }

  turn(playerIndex, pos) {
    if (this.board === 511) return -3; // full board
    if (this._turn ^ playerIndex) return -2; // not your turn
    if (this.board & (1 << pos)) return 0; // occupied

    this[this._turn ? "_o" : "_x"] |= (1 << pos);
    this._turn = !this._turn;
    return 1;
  }

  render() {
    const map = (v) => (v === 1 ? "X" : v === 2 ? "O" : " ");
    const x = parseInt(this._x.toString(2), 4);
    const o = parseInt(this._o.toString(2), 4) * 2;
    const cells = [...(x + o).toString(4).padStart(9, "0")]
      .reverse()
      .map(v => map(+v));
    return cells;
  }

  get winner() {
    if (TicTacToe.check(this._x)) return this.playerX;
    if (TicTacToe.check(this._o)) return this.playerO;
    return false;
  }
}

export default TicTacToe;
