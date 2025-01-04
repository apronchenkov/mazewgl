"use strict";

class GameLevel {
  name;
  projectionMatrix;
  levelVertices;
  levelEdges;
  player0VertexIndex;
  player0Speed;
  player0Radius;
  player1VertexIndex;
  player1Speed;
  player1Radius;

  constructor(
    name,
    projectionMatrix,
    levelVertices,
    levelEdges,
    player0VertexIndex,
    player0Speed,
    player0Radius,
    player1VertexIndex,
    player1Speed,
    player1Radius,
  ) {
    this.name = name;
    this.projectionMatrix = projectionMatrix;
    this.levelVertices = levelVertices;
    this.levelEdges = levelEdges;
    this.player0VertexIndex = player0VertexIndex;
    this.player0Speed = player0Speed;
    this.player0Radius = player0Radius;
    this.player1VertexIndex = player1VertexIndex;
    this.player1Speed = player1Speed;
    this.player1Radius = player1Radius;
  }
}

const kGameLevels = [
  new GameLevel(
    /*name=*/ "level-00",
    /*projectionMatrix=*/ m3_multiply(
      m3_translation(-7, -7),
      m3_scaling(1 / 10, 1 / 10),
    ),
    /*levelVertices=*/ Array(256)
      .keys()
      .map((i) => [
        7 + 7 * Math.cos(((2 * Math.PI) / 256) * i),
        7 + 7 * Math.sin(((2 * Math.PI) / 256) * i),
      ])
      .toArray(),
    /*levelEdges=*/ Array(256)
      .keys()
      .map((i) => [i, (i + 1) % 256])
      .toArray(),
    /*player0VertexIndex*/ 7,
    /*player0Speed=*/ 0.01,
    /*player0Radius=*/ 0.4,
    /*player1VertexIndex=*/ 39,
    /*player1Speed=*/ 0.01,
    /*player1Radius=*/ 0.3,
  ),
  new GameLevel(
    /*name=*/ "level-01",
    /*projectionMatrix=*/ m3_multiply(
      m3_translation(-7.5, -7),
      m3_scaling(1 / 10, 1 / 10),
    ),
    /*levelVertices=*/ [
      [0, 3],
      [4, 3],
      [9, 3],
      [9, 9],
      [8, 14],
      [0, 14],
      [4, 9],
      [4, 0],
      [15, 0],
      [15, 9],
    ],
    /*levelEdges=*/ [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [6, 1],
      [1, 7],
      [7, 8],
      [8, 9],
      [9, 3],
      [3, 6],
    ],
    /*player0VertexIndex*/ 0,
    /*player0Speed=*/ 0.01,
    /*player0Radius=*/ 0.4,
    /*player1VertexIndex=*/ 9,
    /*player1Speed=*/ 0.01,
    /*player1Radius=*/ 0.3,
  ),
  new GameLevel(
    /*name=*/ "level-02-prime",
    /*projectionMatrix=*/ m3_multiply(
      m3_translation(-5.0, -5.0),
      m3_scaling(1 / 7, 1 / 7),
    ),
    /*levelVertices=*/ [
      [2, 2],
      [5, 0],
      [8, 2],
      [10, 5],
      [8, 8],
      [5, 10],
      [2, 8],
      [0, 5],
      [5, 5],
    ],
    /*levelEdges=*/ [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
      [0, 2],
      [2, 4],
      [4, 6],
      [6, 0],
      [0, 8],
      [2, 8],
      [4, 8],
      [6, 8],
    ],
    /*player0VertexIndex*/ 8,
    /*player0Speed=*/ 0.01,
    /*player0Radius=*/ 0.4,
    /*player1VertexIndex=*/ 1,
    /*player1Speed=*/ 0.01,
    /*player1Radius=*/ 0.3,
  ),
  new GameLevel(
    /*name=*/ "das Ende.",
    /*projectionMatrix=*/ m3_multiply(
      m3_translation(-11.0, -2),
      m3_scaling(1 / 10, 1 / 10),
    ),
    /*levelVertices=*/ [
      [0, 0], // 0
      [2, 0],
      [2, 2],
      [0, 2],
      [2, 5],
      [3, 0], // 5
      [5, 0],
      [5, 2],
      [3, 2],
      [5, 3],
      [3, 3], // 10
      [6, 0],
      [8, 0],
      [8, 2],
      [6, 2],
      [6, 3], // 15
      [8, 3],
      [10, 0],
      [13, 0],
      [10, 3],
      [12, 3], // 20
      [10, 5],
      [13, 5],
      [14, 0],
      [14, 3],
      [16, 3], // 25
      [16, 0],
      [17, 0],
      [19, 0],
      [19, 2],
      [17, 2], // 30
      [19, 5],
      [20, 0],
      [22, 0],
      [20, 1],
      [22, 1], // 35
      [22, 2],
      [21, 3],
      [20, 3],
      [23, 0],
    ],
    /*levelEdges=*/ [
      [0, 1], // d
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [5, 6], // a
      [6, 7],
      [7, 8],
      [8, 5],
      [7, 9],
      [9, 10],
      [11, 12], // s
      [12, 13],
      [13, 14],
      [14, 15],
      [15, 16],
      [17, 18], // E
      [17, 19],
      [19, 20],
      [19, 21],
      [21, 22],
      [23, 24], // n
      [24, 25],
      [25, 26],
      [27, 28], // d
      [28, 29],
      [29, 30],
      [30, 27],
      [29, 31],
      [32, 33], // e
      [32, 34],
      [34, 35],
      [35, 36],
      [36, 37],
      [37, 38],
      [38, 34],
    ],
    /*player0VertexIndex*/ 18,
    /*player0Speed=*/ 0.01,
    /*player0Radius=*/ 0.4,
    /*player1VertexIndex=*/ 39,
    /*player1Speed=*/ 0.01,
    /*player1Radius=*/ 0.3,
  ),
];

function initLevels() {
  function resetLevel(levelIndex) {
    if (levelIndex < kGameLevels.length) {
      const gameLevel = kGameLevels[levelIndex];
      console.log(gameLevel.name);
      initGameLevel(
        gameLevel.projectionMatrix,
        gameLevel.levelVertices,
        gameLevel.levelEdges,
        gameLevel.player0VertexIndex,
        gameLevel.player0Speed,
        gameLevel.player0Radius,
        gameLevel.player1VertexIndex,
        gameLevel.player1Speed,
        gameLevel.player1Radius,
        /*winCallback*/ function () {
          resetLevel(levelIndex + 1);
        },
        /*loseCallback*/ function () {
          resetLevel(levelIndex);
        },
      );
    }
  }
  resetLevel(0);
}
