/*
 * Todo:
 * - allow scratching
 *   - joker
 *   - columns
 *   - colors
 * - helpful tooltips?
 * - lock fields after some seconds
 * - save gamestate in localstorage
 *   - "restore button"
 */

import { useState } from "react";
import "./App.css";
import _ from "lodash";
import { produce } from "immer";
import React from "react";

import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

const columnNames = "abcdefghijklmno";

const CROSS = "✗";
const STAR = "★";

const GAME_LAYOUT = `
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

const ROW_COUNT = GAME_LAYOUT[0].length;
const COL_COUNT = GAME_LAYOUT.length;

const BONUS_PER_COLUMN = [
  [5, 3],
  [3, 2],
  [3, 2],
  [3, 2],
  [2, 1],
  [2, 1],
  [2, 1],
  [1, 0],
  [2, 1],
  [2, 1],
  [2, 1],
  [3, 2],
  [3, 2],
  [3, 2],
  [5, 3],
];

const letterToColorName: Record<string, string> = {
  y: "yellow",
  g: "green",
  o: "orange",
  b: "blue",
  r: "red",
};

type Color = "yellow" | "green" | "orange" | "blue" | "red";

type GameState = {
  grid: (0 | 1)[][];
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
  jokerCount: number;
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
  jokerCount: 8,
};

export const GameStateWithSetterContext = React.createContext({
  gameState: initialGameState,
  setGameState: (_callback: (state: GameState) => void) => {},
});

function getField(colIdx: number, rowIdx: number, gameState: GameState) {
  const encoded = GAME_LAYOUT[colIdx][rowIdx];
  return {
    color: letterToColorName[encoded.toLowerCase() as any] as Color,
    hasStar: encoded.toLowerCase() !== encoded,
    value: gameState.grid[colIdx][rowIdx],
  };
}

function Cell({ colIdx, rowIdx }: { colIdx: number; rowIdx: number }) {
  const { gameState, setGameState } = React.useContext(GameStateWithSetterContext);

  const { color, hasStar, value } = getField(colIdx, rowIdx, gameState);
  const showStar = hasStar && !value;
  const onClick = () => {
    if (!isApproachable(gameState, rowIdx, colIdx, true)) {
      confirmAlert({
        title: "Das Feld ist noch nicht erreichbar.",
        closeOnClickOutside: false,
        buttons: [
          {
            label: "Ok",
            onClick: () => {},
          },
        ],
      });

      return;
    }
    const toggleCross = () =>
      setGameState((old: GameState): void => {
        old.grid[colIdx][rowIdx] = old.grid[colIdx][rowIdx] === 1 ? 0 : 1;
      });
    if (value) {
      confirmAlert({
        title: "Das Feld ist bereits abgekreuzt. Kreuz löschen?",
        closeOnClickOutside: false,

        buttons: [
          {
            label: "Ja, Kreuz löschen",
            onClick: toggleCross,
          },
          {
            label: "Nein, Kreuz behalten",
            onClick: () => {},
          },
        ],
      });
    } else {
      toggleCross();
    }
  };

  return (
    <td
      onClick={onClick}
      className={`cell ${color} ${showStar ? "star" : ""}`}
      style={{
        opacity: getOpacityForCell(gameState, rowIdx, colIdx),
      }}
    >
      {value ? CROSS : hasStar ? STAR : ""}
    </td>
  );
}

const NEIGHBOR_OFFSETS = [
  [-1, 0],
  [+1, 0],
  [0, -1],
  [0, +1],
];

function isApproachable(
  gameState: GameState,
  rowIdx: number,
  colIdx: number,
  direct: boolean,
  _visitedSet: Set<string> | null = null,
) {
  const visitedSet = _visitedSet || new Set();
  const keyStr = `${rowIdx}-${colIdx}`;

  if (visitedSet.has(keyStr)) {
    return false;
  }
  visitedSet.add(keyStr);

  const { color, value } = getField(colIdx, rowIdx, gameState);
  if (colIdx === 7) {
    return true;
  }
  if (value) {
    return true;
  }

  for (const offset of NEIGHBOR_OFFSETS) {
    const [dx, dy] = offset;

    if (
      !(colIdx + dx >= 0 && colIdx + dx < COL_COUNT && rowIdx + dy >= 0 && rowIdx + dy < ROW_COUNT)
    ) {
      continue;
    }

    const { color: neighborColor, value: neighborValue } = getField(
      colIdx + dx,
      rowIdx + dy,
      gameState,
    );

    if (neighborValue) {
      return true;
    }

    if (
      !direct &&
      color === neighborColor &&
      isApproachable(gameState, rowIdx + dy, colIdx + dx, direct, visitedSet)
    ) {
      return true;
    }
  }

  return false;
}

function getOpacityForCell(gameState: GameState, rowIdx: number, colIdx: number) {
  const { color } = getField(colIdx, rowIdx, gameState);
  const matchesHighlightColor =
    gameState.highlight.colors.length === 0 || gameState.highlight.colors.includes(color);
  if (gameState.highlight.tickable) {
    if (matchesHighlightColor && isApproachable(gameState, rowIdx, colIdx, true)) {
      return 1;
    }
    if (matchesHighlightColor && isApproachable(gameState, rowIdx, colIdx, false)) {
      return 0.5;
    }

    return 0.2;
  }

  return matchesHighlightColor ? 1 : 0.2;
}

function getOpacityForColor(gameState: GameState, color: Color) {
  const highlightColors = gameState.highlight.colors;
  return highlightColors.length === 0 || highlightColors.includes(color) ? 1 : 0.25;
}

function Grid() {
  const rows = [];

  const headerRow = [];
  for (const colIdx of _.range(0, GAME_LAYOUT.length)) {
    headerRow.push(<td>{columnNames[colIdx].toUpperCase()}</td>);
  }

  rows.push(<tr className="table-head">{headerRow}</tr>);

  for (const rowIdx of _.range(0, ROW_COUNT)) {
    const currentRow = [];
    for (const colIdx of _.range(0, COL_COUNT)) {
      currentRow.push(<Cell key={colIdx} colIdx={colIdx} rowIdx={rowIdx} />);
    }
    rows.push(<tr key={rowIdx}>{currentRow}</tr>);
  }

  const bonusRow1 = [];
  const bonusRow2 = [];
  for (const [bonus1, bonus2] of BONUS_PER_COLUMN) {
    bonusRow1.push(<td>{bonus1}</td>);
    bonusRow2.push(<td>{bonus2}</td>);
  }
  rows.push(
    <tr className="table-head" key={ROW_COUNT}>
      {bonusRow1}
    </tr>,
  );
  rows.push(
    <tr className="table-head" key={ROW_COUNT + 1}>
      {bonusRow2}
    </tr>,
  );

  return (
    <table
      className="grid-table"
      style={{
        borderSpacing: 4,
      }}
    >
      <tbody>{rows}</tbody>
    </table>
  );
}

type BonusPointInfo = {
  missingByColor: Record<Color, number>;
  totalBonusPoints: number;
};

function getBonusPointInfo(gameState: GameState) {
  const info: BonusPointInfo = {
    missingByColor: {
      yellow: 0,
      green: 0,
      orange: 0,
      blue: 0,
      red: 0,
    },
    totalBonusPoints: 0,
  };

  for (const colIdx of _.range(0, COL_COUNT)) {
    for (const rowIdx of _.range(0, ROW_COUNT)) {
      const { value, color } = getField(colIdx, rowIdx, gameState);
      if (value === 0) {
        info.missingByColor[color]++;
      }
    }
  }

  info.totalBonusPoints =
    Object.values(info.missingByColor).filter((count) => count === 0).length * 5;

  return info;
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

  let missingStarCount = 0;
  let columnPoints = 0;
  for (const colIdx of _.range(0, COL_COUNT)) {
    let hasAllInColumn = true;
    for (const rowIdx of _.range(0, ROW_COUNT)) {
      const { hasStar, value } = getField(colIdx, rowIdx, gameState);
      missingStarCount += hasStar && !value ? 1 : 0;
      hasAllInColumn = hasAllInColumn && value === 1;
    }
    if (hasAllInColumn) {
      // todo: might only be the second bonus
      columnPoints += BONUS_PER_COLUMN[colIdx][0];
    }
  }
  const bonusPointInfo = getBonusPointInfo(gameState);
  const bonusPoints = bonusPointInfo.totalBonusPoints;
  const jokerPoints = gameState.jokerCount;
  const starPoints = -2 * missingStarCount;
  const totalPoints = bonusPoints + columnPoints + jokerPoints + starPoints;

  return (
    <div style={{ display: "flex" }}>
      {colors.map((color: Color) => (
        <div
          className={`cell ${color}`}
          style={{
            opacity: getOpacityForColor(gameState, color),
          }}
          onClick={() => handleColorClick(color)}
        >
          {bonusPointInfo.missingByColor[color]}
        </div>
      ))}
      <div
        className={`cell white`}
        style={{
          opacity: gameState.highlight.tickable ? 1 : 0.25,
        }}
        onClick={() =>
          setGameState((oldState) => {
            oldState.highlight.tickable = !oldState.highlight.tickable;
          })
        }
      >
        {CROSS}
      </div>
      <table>
        <tr>
          <td className="point-cell">Bonus</td>
          <td className="point-cell">A-O</td>
          <td className="point-cell">
            ! <span className="small">(+1)</span>
          </td>
          <td className="point-cell">
            {STAR} <span className="small">(-2)</span>
          </td>
          <td className="point-cell">Total</td>
        </tr>
        <tr>
          <td className="point-cell">{bonusPoints}</td>
          <td className="point-cell">{columnPoints}</td>
          <td className="point-cell">{jokerPoints}</td>
          <td className="point-cell">{starPoints}</td>
          <td className="point-cell">{totalPoints}</td>
        </tr>
      </table>
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
        <div className="h-border" />
        <Grid />
      </div>
    </GameStateWithSetterContext.Provider>
  );
}

export default App;
