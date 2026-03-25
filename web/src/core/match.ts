import type { Pos, Size } from "./core"
import { get, posKey } from "./core"
import type { Board, Element } from "./board"
import { EMPTY, symbolAt } from "./board"

export type MatchKind = "line3" | "line4" | "line5" | "cross"

export type Match = {
    readonly kind: MatchKind
    readonly element: Element
    readonly positions: ReadonlySet<string>
}

export function makeMatch(
    kind: MatchKind,
    element: Element,
    positions: ReadonlySet<string>,
): Match | null {
    if (positions.size < 3 || element.symbol === EMPTY) {
        return null
    }
    return { kind, element, positions }
}

export function classifyMatch(positions: ReadonlySet<string>): MatchKind {
    const count = positions.size
    if (count >= 5) return "line5"
    if (count === 4) return "line4"
    return "line3"
}

function runToMatch(
    board: Board,
    line: readonly Pos[],
    start: number,
    end: number,
): Match | null {
    const positions = new Set(
        line.slice(start, end).map(posKey)
    )
    const element = get(board, line[start])
    const kind = classifyMatch(positions)
    return makeMatch(kind, element, positions)
}

function scanLine(board: Board, line: readonly Pos[]): readonly Match[] {
    if (line.length < 3) return []

    const segments: [number, number][] = []
    let start = 0

    for (let i = 1; i < line.length; i++) {
        const currSym = symbolAt(board, line[i])
        const startSym = symbolAt(board, line[start])

        if (currSym !== startSym || currSym === EMPTY) {
            if (i - start >= 3 && startSym !== EMPTY) {
                segments.push([start, i])
            }
            start = i
        }
    }

    const startSym = symbolAt(board, line[start])
    if (line.length - start >= 3 && startSym !== EMPTY) {
        segments.push([start, line.length])
    }

    return segments
        .map(([s, e]) => runToMatch(board, line, s, e))
        .filter((m): m is Match => m !== null)
}

export function findRuns(board: Board, size: Size): readonly Match[] {
    const runs: Match[] = []

    for (let row = 0; row < size; row++) {
        const line: Pos[] = Array.from({ length: size }, (_, col): Pos => [row, col])
        runs.push(...scanLine(board, line))
    }

    for (let col = 0; col < size; col++) {
        const line: Pos[] = Array.from({ length: size }, (_, row): Pos => [row, col])
        runs.push(...scanLine(board, line))
    }

    return runs
}

export function mergeCrosses(runs: readonly Match[]): readonly Match[] {
    const n = runs.length
    if (n === 0) return []

    const parent = Array.from({ length: n }, (_, i) => i)

    function find(x: number): number {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]]
            x = parent[x]
        }
        return x
    }

    function union(x: number, y: number): void {
        const px = find(x)
        const py = find(y)
        if (px !== py) parent[px] = py
    }

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (runs[i].element.symbol !== runs[j].element.symbol) continue

            let overlaps = false
            for (const key of runs[i].positions) {
                if (runs[j].positions.has(key)) {
                    overlaps = true
                    break
                }
            }
            if (overlaps) union(i, j)
        }
    }

    const groups = new Map<number, number[]>()
    for (let i = 0; i < n; i++) {
        const root = find(i)
        const group = groups.get(root) ?? []
        group.push(i)
        groups.set(root, group)
    }

    const result: Match[] = []
    for (const members of groups.values()) {
        if (members.length === 1) {
            result.push(runs[members[0]])
        } else {
            const allPos = new Set<string>()
            for (const idx of members) {
                for (const key of runs[idx].positions) {
                    allPos.add(key)
                }
            }
            result.push({
                kind: "cross",
                element: runs[members[0]].element,
                positions: allPos,
            })
        }
    }

    return result
}

export function findMatches(board: Board, size: Size): readonly Match[] {
    const runs = findRuns(board, size)
    return mergeCrosses(runs)
}
