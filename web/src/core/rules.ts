import type { Pos, Size } from "./core"
import { adjacent, allPositions, neighbors, swap } from "./core"
import type { Board } from "./board"
import { makeEmptyBoard, fillEmpty } from "./board"
import type { Match, MatchKind } from "./match"
import { findMatches } from "./match"
import type { CascadeResult } from "./cascade"
import { runCascade } from "./cascade"
import type { RNG } from "./rng"

export type ValidMove = {
    readonly tag: "valid"
    readonly cascade: CascadeResult
    readonly score: number
}

export type InvalidMove = {
    readonly tag: "invalid"
    readonly reason: string
}

export type MoveResult = ValidMove | InvalidMove

export const MATCH_SCORES: Readonly<Record<MatchKind, number>> = {
    line3: 30,
    line4: 80,
    line5: 150,
    cross: 200,
}

export type GameState = {
    readonly board: Board
    readonly size: Size
    readonly score: number
    readonly drowsiness: number
    readonly rng: RNG
}

export function makeGameState(
    board: Board,
    size: Size,
    score: number,
    drowsiness: number,
    rng: RNG,
): GameState {
    return { board, size, score, drowsiness, rng }
}

export function validateMove(
    board: Board,
    size: Size,
    p1: Pos,
    p2: Pos,
    rng: RNG,
): MoveResult {
    if (!adjacent(p1, p2)) {
        return { tag: "invalid", reason: "Only adjacent cells can be swapped." }
    }

    const swapped = swap(board, p1, p2)
    const matches = findMatches(swapped, size)
    if (matches.length === 0) {
        return { tag: "invalid", reason: "Swap does not produce a match." }
    }

    const cascade = runCascade(swapped, size, rng)
    const score = scoreCascade(cascade)
    return { tag: "valid", cascade, score }
}

export function scoreCascade(result: CascadeResult): number {
    let total = 0
    for (let phaseIdx = 0; phaseIdx < result.phases.length; phaseIdx++) {
        const multiplier = phaseIdx + 1
        let phaseScore = 0
        for (const m of result.phases[phaseIdx].matches) {
            phaseScore += MATCH_SCORES[m.kind]
        }
        total += phaseScore * multiplier
    }
    return total
}

export function matchTimeBonus(matches: readonly Match[]): number {
    return 0.1 * matches.length
}

export function tick(state: GameState, elapsedMs: number): GameState {
    const decayRate = 0.001
    const newDrowsiness = Math.max(0.0, state.drowsiness - decayRate * elapsedMs)
    return { ...state, drowsiness: newDrowsiness }
}

export function hasPossibleMoves(board: Board, size: Size): boolean {
    for (const pos of allPositions(size)) {
        for (const neighbor of neighbors(pos, size)) {
            if (pos[0] > neighbor[0] || (pos[0] === neighbor[0] && pos[1] >= neighbor[1])) {
                continue
            }
            const swapped = swap(board, pos, neighbor)
            if (findMatches(swapped, size).length > 0) {
                return true
            }
        }
    }
    return false
}

export function initializeBoard(size: Size, rng: RNG): CascadeResult {
    if (size < 3) {
        throw new Error("Board size must be at least 3 to guarantee a possible move.")
    }

    const board = makeEmptyBoard(size)
    const filled = fillEmpty(board, size, rng)
    const result = runCascade(filled, size, rng)

    if (hasPossibleMoves(result.board, size)) {
        return result
    }

    return initializeBoard(size, rng)
}
