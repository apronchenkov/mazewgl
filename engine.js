"use strict";

const kEps = 1e-8;

function _createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  const message = gl.getShaderInfoLog(shader);
  if (message.length > 0) {
    console.log("gl.getShaderInfoLog:", message);
  }
  if (!success) {
    gl.deleteShader(shader);
    throw message;
  }
  return shader;
}

function createProgram(gl, vertexShaderSrc, fragmentShaderSrc) {
  const program = gl.createProgram();
  const vertexShader = _createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
  gl.attachShader(program, vertexShader);
  gl.deleteShader(vertexShader);
  const fragmentShader = _createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSrc,
  );
  gl.attachShader(program, fragmentShader);
  gl.deleteShader(fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  const message = gl.getProgramInfoLog(program);
  if (message.length > 0) {
    console.log("gl.getProgramInfoLog:", message);
  }
  if (!success) {
    gl.deleteProgram(program);
    throw message;
  }
  return program;
}

function m3_scaling(xScale, yScale) {
  return new Float32Array([xScale, 0, 0, 0, yScale, 0, 0, 0, 1]);
}

function m3_translation(xShift, yShift) {
  return new Float32Array([1, 0, 0, 0, 1, 0, xShift, yShift, 1]);
}

function m3_multiply(lhs, rhs) {
  return new Float32Array([
    lhs[0] * rhs[0] + lhs[1] * rhs[3] + lhs[2] * rhs[6],
    lhs[0] * rhs[1] + lhs[1] * rhs[4] + lhs[2] * rhs[7],
    lhs[0] * rhs[2] + lhs[1] * rhs[5] + lhs[2] * rhs[8],
    lhs[3] * rhs[0] + lhs[4] * rhs[3] + lhs[5] * rhs[6],
    lhs[3] * rhs[1] + lhs[4] * rhs[4] + lhs[5] * rhs[7],
    lhs[3] * rhs[2] + lhs[4] * rhs[5] + lhs[5] * rhs[8],
    lhs[6] * rhs[0] + lhs[7] * rhs[3] + lhs[8] * rhs[6],
    lhs[6] * rhs[1] + lhs[7] * rhs[4] + lhs[8] * rhs[7],
    lhs[6] * rhs[2] + lhs[7] * rhs[5] + lhs[8] * rhs[8],
  ]);
}

function m3_transposed(mat) {
  return new Float32Array([
    mat[0],
    mat[3],
    mat[6],
    mat[1],
    mat[4],
    mat[7],
    mat[2],
    mat[5],
    mat[8],
  ]);
}

function m3_to_webgl(mat) {
  return m3_transposed(mat);
}

var keycodePressed = new Set();

document.addEventListener("keydown", (event) => {
  updateGameState();
  keycodePressed.add(event.code);
});

document.addEventListener("keyup", (event) => {
  updateGameState();
  keycodePressed.delete(event.code);
});

var updateGameState = function () {};
var drawGameState = function () {};

/////////////////////////////////////////////

class LevelState {
  vertices;
  edges;
  edgeCovs;
  edgeXYs;
  edgeLs;
  vertexEdges;

  constructor(vertices, edges) {
    this.vertices = vertices;
    this.edges = edges;

    this.edgeCovs = edges.map((_) => [0.0, 0.0]);
    this.edgeXYs = edges.map(([i, j]) => [
      vertices[i][0] + vertices[j][0],
      vertices[i][1] + vertices[j][1],
    ]);
    this.edgeLs = edges.map(([i, j]) =>
      Math.hypot(
        vertices[i][0] - vertices[j][0],
        vertices[i][1] - vertices[j][1],
      ),
    );
    this.vertexEdges = edges.map((_) => []);
    for (const i of edges.keys()) {
      this.vertexEdges[edges[i][0]].push(i);
      this.vertexEdges[edges[i][1]].push(i);
    }
  }
}

function updateEdgeCovs(level, vertexIndex, edgeIndex, phi, radius) {
  if (edgeIndex < 0) {
    for (const i of level.vertexEdges[vertexIndex]) {
      updateEdgeCovs(level, vertexIndex, i, 0.0, radius);
    }
    return;
  }
  if (level.edges[edgeIndex][0] == vertexIndex) {
    level.edgeCovs[edgeIndex][0] = Math.max(
      level.edgeCovs[edgeIndex][0],
      phi + radius / level.edgeLs[edgeIndex],
    );
  } else if (level.edges[edgeIndex][1] == vertexIndex) {
    level.edgeCovs[edgeIndex][1] = Math.max(
      level.edgeCovs[edgeIndex][1],
      phi + radius / level.edgeLs[edgeIndex],
    );
  }
  if (level.edgeCovs[edgeIndex][0] + level.edgeCovs[edgeIndex][1] >= 1.0) {
    level.edgeCovs[edgeIndex][0] = 1.0;
    level.edgeCovs[edgeIndex][1] = 1.0;
  }
}

class PlayerState {
  timestampMs;
  vertexIndex;
  edgeIndex;
  phi;

  constructor(timestampMs, vertexIndex, edgeIndex = -1, phi = 0.0) {
    this.timestampMs = timestampMs;
    this.vertexIndex = vertexIndex;
    this.edgeIndex = edgeIndex;
    this.phi = phi;
  }
}

function nextPlayerState(timestampMs, dirX, dirY, playerSpeed, player, level) {
  if (player.edgeIndex < 0) {
    // Vertex case.
    let bestEdgeIndex = -1;
    let bestWeight = 0.0;
    for (const i of level.vertexEdges[player.vertexIndex]) {
      const edgeDirX =
        level.edgeXYs[i][0] - 2 * level.vertices[player.vertexIndex][0];
      const edgeDirY =
        level.edgeXYs[i][1] - 2 * level.vertices[player.vertexIndex][1];
      const weight = (dirX * edgeDirX + dirY * edgeDirY) / level.edgeLs[i];
      if (bestWeight + kEps < weight) {
        bestWeight = weight;
        bestEdgeIndex = i;
      } else if (bestWeight < weight + kEps) {
        bestWeight = weight;
        bestEdgeIndex = -1;
      }
    }
    if (bestEdgeIndex < 0) {
      return new PlayerState(timestampMs, player.vertexIndex);
    }
    return new PlayerState(
      player.timestampMs,
      player.vertexIndex,
      bestEdgeIndex,
    );
  }
  // Edge case.
  const edgeDirX =
    level.edgeXYs[player.edgeIndex][0] -
    2 * level.vertices[player.vertexIndex][0];
  const edgeDirY =
    level.edgeXYs[player.edgeIndex][1] -
    2 * level.vertices[player.vertexIndex][1];
  const edgeL = level.edgeLs[player.edgeIndex];
  const dir = dirX * edgeDirX + dirY * edgeDirY;
  if (dir > 0.0 && player.phi < 1.0) {
    const dT = (edgeL * (1.0 - player.phi)) / playerSpeed;
    if (player.timestampMs + dT <= timestampMs) {
      return new PlayerState(
        player.timestampMs + dT,
        player.vertexIndex,
        player.edgeIndex,
        1.0,
      );
    }
    return new PlayerState(
      timestampMs,
      player.vertexIndex,
      player.edgeIndex,
      player.phi + ((timestampMs - player.timestampMs) * playerSpeed) / edgeL,
    );
  }
  if (dir < 0.0 && player.phi > 0.0) {
    const dT = (edgeL * player.phi) / playerSpeed;
    if (player.timestampMs + dT <= timestampMs) {
      return new PlayerState(
        player.timestampMs + dT,
        player.vertexIndex,
        player.edgeIndex,
        0.0,
      );
    }
    return new PlayerState(
      timestampMs,
      player.vertexIndex,
      player.edgeIndex,
      player.phi - ((timestampMs - player.timestampMs) * playerSpeed) / edgeL,
    );
  }
  if (player.phi == 0.0) {
    return new PlayerState(player.timestampMs, player.vertexIndex);
  }
  if (player.phi == 1.0) {
    return new PlayerState(
      player.timestampMs,
      player.vertexIndex ^
        level.edges[player.edgeIndex][0] ^
        level.edges[player.edgeIndex][1],
    );
  }
  return new PlayerState(
    timestampMs,
    player.vertexIndex,
    player.edgeIndex,
    player.phi,
  );
}

function getPlayerXY(player, level) {
  let [x, y] = level.vertices[player.vertexIndex];
  if (player.edgeIndex >= 0) {
    x =
      level.edgeXYs[player.edgeIndex][0] * player.phi +
      x * (1 - 2 * player.phi);
    y =
      level.edgeXYs[player.edgeIndex][1] * player.phi +
      y * (1 - 2 * player.phi);
  }
  return [x, y];
}

function getLevelLength(level) {
  let result = 0.0;
  for (const i of level.edges.keys()) {
    result += level.edgeLs[i];
  }
  return result;
}

function getLevelCoverage(level) {
  let result = 0.0;
  for (const i of level.edges.keys()) {
    result +=
      Math.clamp(level.edgeCovs[i][0] + level.edgeCov[i][0], 0.0, 1.0) *
      level.edgeLs[i];
  }
  return result;
}
