import { useState } from "react";
import "./App.css";
import _ from "lodash";
import { produce } from "immer";

const columnNames = "abcdefghijklmno";

const gameLayout = `
goBbrry
gggroBy
gYrrobb
ygggoRb
yYgoorb
yygOrrb
yoGbbrr
Gorbbyy
brrgoYy
bBrgooy
bbyyoRg
Ooyyrbg
yooorbG
yggRrbo
yggbrOo
`
  .trim()
  .split("\n");

const letterToColorName: Record<string, string> = {
  y: "yellow",
  g: "green",
  o: "orange",
  b: "blue",
  r: "red",
};

type Color = "yellow" | "green" | "orange" | "blue" | "red";

type GameState = {
  grid: number[][];
  highlight: {
    // - normal
    // - if a specific color
    // - if it's a missing star
    // - if it's tickable
    // - if it belongs to a certain column
    // - if it's empty
    normal: boolean;
    colors: Array<Color>;
    star: false;
    empty: false;
    inColumns: Array<string>;
  };
};

const initialGameState: GameState = {
  grid: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  highlight: {
    // - normal
    // - if a specific color
    // - if it's a missing star
    // - if it's tickable
    // - if it belongs to a certain column
    // - if it's empty
    normal: true,
    star: false,
    empty: false,
    colors: [],
    inColumns: [],
  },
};

function getField(colIdx: number, rowIdx: number, gameState: GameState) {
  const encoded = gameLayout[colIdx][rowIdx];
  return {
    color: letterToColorName[encoded.toLowerCase() as any],
    hasStar: encoded.toLowerCase() !== encoded,
    value: gameState.grid[colIdx][rowIdx],
  };
}

function Cell({
  gameState,
  colIdx,
  rowIdx,
  setGameState,
}: {
  colIdx: number;
  rowIdx: number;
  gameState: GameState;
  setGameState: (cb: (s: GameState) => void) => void;
}) {
  const { color, hasStar, value } = getField(colIdx, rowIdx, gameState);
  const onClick = () => {
    setGameState((old: GameState): void => {
      old.grid[colIdx][rowIdx] = old.grid[colIdx][rowIdx] === 1 ? 0 : 1;
    });
  };
  return (
    <td onClick={onClick} className={`cell ${color}`}>
      {value ? "✗" : hasStar ? "★" : ""}
    </td>
  );
}

function Grid() {
  const [gameState, _setGameState] = useState(initialGameState);
  const setGameState = (callback: (state: GameState) => void) => {
    _setGameState((oldValue: GameState) => {
      return produce(oldValue, callback);
    });
  };

  const rows = [];

  const headerRow = [];
  for (const colIdx of _.range(0, gameLayout.length)) {
    headerRow.push(<td>{columnNames[colIdx].toUpperCase()}</td>);
  }

  rows.push(<tr>{headerRow}</tr>);

  for (const rowIdx of _.range(0, gameLayout[0].length)) {
    const currentRow = [];
    for (const colIdx of _.range(0, gameLayout.length)) {
      currentRow.push(
        <Cell
          key={colIdx}
          gameState={gameState}
          setGameState={setGameState}
          colIdx={colIdx}
          rowIdx={rowIdx}
        />,
      );
    }
    rows.push(<tr key={rowIdx}>{currentRow}</tr>);
  }

  return (
    <table
      style={{
        borderSpacing: 4,
      }}
    >
      <tbody>{rows}</tbody>
    </table>
  );
}

function Toolbar() {
  const colors = Object.values(letterToColorName);
  return (
    <div style={{ display: "flex" }}>
      {colors.map((color) => (
        <div className={`cell ${color}`} />
      ))}
    </div>
  );
}

function App() {
  return (
    <>
      <div className="card">
        <Toolbar />
      </div>
      <div className="card">
        <Grid />
      </div>
    </>
  );
}

export default App;
