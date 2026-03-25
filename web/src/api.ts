import type {
    GameState as FrontendGameState,
    MoveResult as FrontendMoveResult,
    CascadePhase as FrontendCascadePhase,
    SerializedMatch,
} from "./types"
import type { Board } from "./core/board"
import type { Match } from "./core/match"
import type { CascadePhase } from "./core/cascade"
import { parsePos } from "./core/core"
import { createRNG } from "./core/rng"
import {
    makeGameState,
    validateMove,
    matchTimeBonus,
    hasPossibleMoves,
    initializeBoard,
    type GameState,
} from "./core/rules"

let state: GameState | null = null

function serializeBoard(board: Board): string[][] {
    return board.map(row => row.map(elem => elem.symbol)) as string[][]
}

function serializeMatch(match: Match): SerializedMatch {
    const positions = Array.from(match.positions)
        .map(parsePos)
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]) as [number, number][]
    return {
        kind: match.kind,
        symbol: match.element.symbol,
        positions,
    }
}

function serializePhase(phase: CascadePhase): FrontendCascadePhase {
    return {
        board_before: serializeBoard(phase.board_before),
        matches: phase.matches.map(serializeMatch),
        cleared: serializeBoard(phase.cleared),
        fallen: serializeBoard(phase.fallen),
        filled: serializeBoard(phase.filled),
    }
}

function serializeState(gs: GameState): FrontendGameState {
    return {
        board: serializeBoard(gs.board),
        size: gs.size,
        score: gs.score,
        drowsiness: gs.drowsiness,
    }
}

export function initGame(size: number): FrontendGameState {
    const rng = createRNG()
    const result = initializeBoard(size, rng)
    state = makeGameState(result.board, size, 0, 1.0, rng)
    return serializeState(state)
}

export function tryMove(
    r1: number, c1: number,
    r2: number, c2: number,
): FrontendMoveResult {
    if (state === null) throw new Error("Game not initialized")

    const result = validateMove(
        state.board, state.size,
        [r1, c1], [r2, c2],
        state.rng,
    )

    if (result.tag === "invalid") {
        return { tag: "invalid", reason: result.reason }
    }

    const allMatches = result.cascade.phases.flatMap(phase => phase.matches)
    const bonus = matchTimeBonus(allMatches)
    const newDrowsiness = Math.min(1.0, state.drowsiness + bonus)

    state = makeGameState(
        result.cascade.board,
        state.size,
        state.score + result.score,
        newDrowsiness,
        state.rng,
    )

    return {
        tag: "valid",
        score: result.score,
        phases: result.cascade.phases.map(serializePhase),
        state: serializeState(state),
        has_possible_moves: hasPossibleMoves(state.board, state.size),
    }
}

export function getState(): FrontendGameState {
    if (state === null) throw new Error("Game not initialized")
    return serializeState(state)
}
