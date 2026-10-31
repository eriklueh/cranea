import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, NUDGE, progressLabel, reduce } from "../src/components/tutorial/machine.ts";

// Lectura, acción, acción con aviso propio.
const steps = [{ action: false }, { action: true }, { action: true, nudge: "Tocá el 3." }];
const run = (events, state = initialState()) =>
  events.reduce((acc, event) => {
    const { state: next, effect } = reduce(acc.state, event, steps);
    return { state: next, effects: [...acc.effects, effect] };
  }, { state, effects: [] });

test("un paso de lectura avanza con Siguiente y deshace cualquier jugada", () => {
  const { state, effects } = run([{ type: "verdict", verdict: "progress" }]);
  assert.equal(state.step, 0);
  assert.equal(state.nudge, NUDGE.info);
  assert.deepEqual(effects, ["revert"]);
  assert.equal(run([{ type: "next" }]).state.step, 1);
});

test("en un paso de acción, Siguiente no avanza: hay que hacer la jugada", () => {
  const { state } = run([{ type: "next" }, { type: "next" }]);
  assert.equal(state.step, 1);
  assert.equal(state.nudge, NUDGE.outside);
});

test("avance acepta la jugada; listo pasa al siguiente paso", () => {
  const { state, effects } = run([{ type: "next" }, { type: "verdict", verdict: "progress" }, { type: "verdict", verdict: "done" }]);
  assert.equal(state.step, 2);
  assert.equal(state.status, "active");
  assert.deepEqual(effects, [null, "accept", "accept"]);
});

test("una jugada equivocada se deshace con el aviso del paso, y el aviso se repite", () => {
  const { state, effects } = run([{ type: "next" }, { type: "verdict", verdict: "done" }, { type: "verdict", verdict: "wrong" }, { type: "verdict", verdict: "wrong" }]);
  assert.equal(state.step, 2);
  assert.equal(state.nudge, "Tocá el 3.");
  assert.equal(state.nudgeKey, 2);
  assert.deepEqual(effects.slice(2), ["revert", "revert"]);
  const plain = run([{ type: "next" }, { type: "verdict", verdict: "wrong" }]).state;
  assert.equal(plain.nudge, NUDGE.wrong);
});

test("ignorar no cambia nada; tocar afuera solo avisa", () => {
  const before = run([{ type: "next" }]).state;
  const { state, effects } = run([{ type: "verdict", verdict: "ignore" }], before);
  assert.deepEqual(state, before);
  assert.deepEqual(effects, [null]);
  assert.equal(run([{ type: "outside" }], before).state.nudge, NUDGE.outside);
  assert.equal(run([{ type: "outside" }]).state.nudge, NUDGE.info);
});

test("el último paso termina el tutorial; después no reacciona hasta reiniciar", () => {
  const done = run([{ type: "next" }, { type: "verdict", verdict: "done" }, { type: "verdict", verdict: "done" }]).state;
  assert.equal(done.status, "finished");
  assert.deepEqual(run([{ type: "verdict", verdict: "wrong" }, { type: "next" }], done).state, done);
  assert.deepEqual(run([{ type: "restart" }], done).state, initialState());
});

test("saltar corta en cualquier paso", () => {
  const { state } = run([{ type: "next" }, { type: "skip" }, { type: "verdict", verdict: "done" }]);
  assert.equal(state.status, "skipped");
  assert.equal(state.step, 1);
});

test("el avance se muestra como paso n de total", () => {
  assert.equal(progressLabel(0, 7), "Paso 1 de 7");
  assert.equal(progressLabel(9, 7), "Paso 7 de 7");
});
