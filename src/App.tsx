import { useState } from "react";
import "./App.css";
import _ from "lodash";
import { produce } from "immer";
import React from "react";

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
    star: boolean;
    empty: boolean;
    tickable: boolean;
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
    tickable: true,
    colors: [],
    inColumns: [],
  },
};

export const GameStateWithSetterContext = React.createContext({
  gameState: initialGameState,
  setGameState: (_callback: (state: GameState) => void) => {},
});

function getField(colIdx: number, rowIdx: number, gameState: GameState) {
  const encoded = gameLayout[colIdx][rowIdx];
  return {
    color: letterToColorName[encoded.toLowerCase() as any] as Color,
    hasStar: encoded.toLowerCase() !== encoded,
    value: gameState.grid[colIdx][rowIdx],
  };
}

function Cell({ colIdx, rowIdx }: { colIdx: number; rowIdx: number }) {
  const { gameState, setGameState } = React.useContext(GameStateWithSetterContext);

  const { color, hasStar, value } = getField(colIdx, rowIdx, gameState);
  const onClick = () => {
    setGameState((old: GameState): void => {
      old.grid[colIdx][rowIdx] = old.grid[colIdx][rowIdx] === 1 ? 0 : 1;
    });
  };

  return (
    <td
      onClick={onClick}
      className={`cell ${color}`}
      style={{
        opacity: getOpacityForCell(gameState, rowIdx, colIdx),
      }}
    >
      {value ? "✗" : hasStar ? "★" : ""}
    </td>
  );
}

function getOpacityForCell(gameState: GameState, rowIdx: number, colIdx: number) {
  if (gameState.highlight.tickable) {
    if (colIdx !== 7) {
      return 0.5;
    }
    return 1;
  }
  return 1;
}

function getOpacityForColor(gameState: GameState, color: Color) {
  const highlightColors = gameState.highlight.colors;
  return highlightColors.length === 0 || highlightColors.includes(color) ? 1 : 0.25;
}

function Grid() {
  // const { gameState, setGameState } = React.useContext(GameStateWithSetterContext);

  const rows = [];

  const headerRow = [];
  for (const colIdx of _.range(0, gameLayout.length)) {
    headerRow.push(<td>{columnNames[colIdx].toUpperCase()}</td>);
  }

  rows.push(<tr>{headerRow}</tr>);

  for (const rowIdx of _.range(0, gameLayout[0].length)) {
    const currentRow = [];
    for (const colIdx of _.range(0, gameLayout.length)) {
      currentRow.push(<Cell key={colIdx} colIdx={colIdx} rowIdx={rowIdx} />);
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
  const { gameState, setGameState } = React.useContext(GameStateWithSetterContext);
  const colors = Object.values(letterToColorName) as Color[];

  const handleColorClick = (color: Color) => {
    setGameState((oldState) => {
      if (oldState.highlight.colors.includes(color)) {
        oldState.highlight.colors = oldState.highlight.colors.filter((c) => color != c);
      } else {
        oldState.highlight.colors.push(color);
      }
    });
  };

  return (
    <div style={{ display: "flex" }}>
      {colors.map((color: Color) => (
        <div
          className={`cell ${color}`}
          style={{
            opacity: getOpacityForColor(gameState, color),
          }}
          onClick={() => handleColorClick(color)}
        />
      ))}
    </div>
  );
}

function App() {
  const [gameState, _setGameState] = useState(initialGameState);
  const setGameState = (callback: (state: GameState) => void) => {
    _setGameState((oldValue: GameState) => {
      return produce(oldValue, callback);
    });
  };

  return (
    <GameStateWithSetterContext.Provider value={{ gameState, setGameState }}>
      <div className="card">
        <Toolbar />
      </div>
      <div className="card">
        <Grid />
      </div>
    </GameStateWithSetterContext.Provider>
  );
}

export default App;
