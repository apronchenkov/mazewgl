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
