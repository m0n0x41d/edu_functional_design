import type { Size } from "./core"
import type { Board } from "./board"
import { EMPTY, applyGravity, fillEmpty } from "./board"
import type { Match } from "./match"
import { findMatches } from "./match"
import type { RNG } from "./rng"

export type CascadePhase = {
    readonly board_before: Board
    readonly matches: readonly Match[]
    readonly cleared: Board
    readonly fallen: Board
    readonly filled: Board
}

export type CascadeResult = {
    readonly phases: readonly CascadePhase[]
    readonly board: Board
}

export function clearMatches(board: Board, matches: readonly Match[]): Board {
    const toClear = new Set<string>()
    for (const m of matches) {
        for (const key of m.positions) {
            toClear.add(key)
        }
    }

    return board.map((row, r) =>
        row.map((elem, c) =>
            toClear.has(`${r},${c}`) ? { symbol: EMPTY } : elem
        )
    )
}

export function cascadeStep(board: Board, size: Size, rng: RNG): CascadePhase | null {
    const matches = findMatches(board, size)
    if (matches.length === 0) return null

    const cleared = clearMatches(board, matches)
    const fallen = applyGravity(cleared, size)
    const filled = fillEmpty(fallen, size, rng)

    return {
        board_before: board,
        matches,
        cleared,
        fallen,
        filled,
    }
}

export function runCascade(board: Board, size: Size, rng: RNG): CascadeResult {
    const phases: CascadePhase[] = []
    let current = board

    let phase = cascadeStep(current, size, rng)
    while (phase !== null) {
        phases.push(phase)
        current = phase.filled
        phase = cascadeStep(current, size, rng)
    }

    return { phases, board: current }
}
