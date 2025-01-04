class GameState {}

const kLevel01Projection = m3_multiply(
  m3_translation(-7.5, -7),
  m3_scaling(1 / 10, 1 / 10),
);

const kLevel01Vertices = [
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
];

const kLevel01Edges = [
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
];

function initLevels() {
  console.log("level-01");
  initGameLevel(
    /*projectionMatrix=*/ kLevel01Projection,
    /*levelVertices*/ kLevel01Vertices,
    /*levelEdges=*/ kLevel01Edges,
    /*player0VertexIndex*/ 0,
    /*player0Speed=*/ 0.01,
    /*player0Radius=*/ 0.4,
    /*player1VertexIndex=*/ 9,
    /*player1Speed=*/ 0.01,
    /*player1Radius=*/ 0.3,
    /*winCallback*/ function () {},
    /*loseCallback*/ function () {},
  );
}
