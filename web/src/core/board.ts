import type { Grid, Pos, Size } from "./core"
import { get, makeGrid, allPositions, posKey } from "./core"
import type { RNG } from "./rng"

export const EMPTY = "0"
export const SYMBOLS = ["A", "B", "C", "D", "E", "F"] as const

export type Element = {
    readonly symbol: string
}

export type Board = Grid<Element>

export function makeElement(symbol: string): Element | null {
    if (symbol !== EMPTY && !(SYMBOLS as readonly string[]).includes(symbol)) {
        return null
    }
    return { symbol }
}

export function makeEmptyBoard(size: Size): Board {
    return makeGrid(size, () => ({ symbol: EMPTY }))
}

export function isEmpty(elem: Element): boolean {
    return elem.symbol === EMPTY
}

export function symbolAt(board: Board, pos: Pos): string {
    return get(board, pos).symbol
}

export function emptyPositions(board: Board, size: Size): ReadonlySet<string> {
    const result = new Set<string>()
    for (const pos of allPositions(size)) {
        if (isEmpty(get(board, pos))) {
            result.add(posKey(pos))
        }
    }
    return result
}

function dropColumn(board: Board, col: number, size: Size): readonly Element[] {
    const nonEmpty: Element[] = []
    for (let row = 0; row < size; row++) {
        const elem = get(board, [row, col] as const)
        if (!isEmpty(elem)) {
            nonEmpty.push(elem)
        }
    }
    const pad = size - nonEmpty.length
    const empties: Element[] = Array.from({ length: pad }, () => ({ symbol: EMPTY }))
    return [...empties, ...nonEmpty]
}

export function applyGravity(board: Board, size: Size): Board {
    const columns = Array.from({ length: size }, (_, col) =>
        dropColumn(board, col, size)
    )
    return Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => columns[col][row])
    )
}

export function fillEmpty(board: Board, size: Size, rng: RNG): Board {
    return board.map(row =>
        row.map(elem =>
            isEmpty(elem) ? { symbol: rng.choice(SYMBOLS) } : elem
        )
    )
}
