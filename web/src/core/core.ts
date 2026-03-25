export type Pos = readonly [number, number]
export type Size = number
export type Grid<T> = ReadonlyArray<ReadonlyArray<T>>

export function posKey(pos: Pos): string {
    return `${pos[0]},${pos[1]}`
}

export function parsePos(key: string): Pos {
    const [r, c] = key.split(",")
    return [Number(r), Number(c)]
}

export function pipe<T>(value: T, ...fns: Array<(v: any) => any>): any {
    let result: any = value
    for (const fn of fns) {
        result = fn(result)
    }
    return result
}

export function compose(...fns: Array<(v: any) => any>): (v: any) => any {
    return (value: any) => {
        let result = value
        for (const fn of fns) {
            result = fn(result)
        }
        return result
    }
}

export function makePos(row: number, col: number, size: Size): Pos | null {
    if (row >= 0 && row < size && col >= 0 && col < size) {
        return [row, col]
    }
    return null
}

export function makeGrid<T>(size: Size, fill: (row: number, col: number) => T): Grid<T> {
    return Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => fill(row, col))
    )
}

export function get<T>(grid: Grid<T>, pos: Pos): T {
    return grid[pos[0]][pos[1]]
}

export function setCell<T>(grid: Grid<T>, pos: Pos, value: T): Grid<T> {
    const [rowIdx, colIdx] = pos
    return grid.map((row, r) =>
        r === rowIdx
            ? [...row.slice(0, colIdx), value, ...row.slice(colIdx + 1)]
            : row
    )
}

export function swap<T>(grid: Grid<T>, p1: Pos, p2: Pos): Grid<T> {
    const v1 = get(grid, p1)
    const v2 = get(grid, p2)
    const afterFirst = setCell(grid, p1, v2)
    return setCell(afterFirst, p2, v1)
}

export function allPositions(size: Size): readonly Pos[] {
    const result: Pos[] = []
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            result.push([row, col])
        }
    }
    return result
}

export function rowPositions(row: number, size: Size): readonly Pos[] {
    return Array.from({ length: size }, (_, col): Pos => [row, col])
}

export function colPositions(col: number, size: Size): readonly Pos[] {
    return Array.from({ length: size }, (_, row): Pos => [row, col])
}

export function neighbors(pos: Pos, size: Size): readonly Pos[] {
    const [row, col] = pos
    const candidates: Pos[] = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
    ]
    return candidates.filter(([r, c]) => r >= 0 && r < size && c >= 0 && c < size)
}

export function adjacent(p1: Pos, p2: Pos): boolean {
    return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]) === 1
}
