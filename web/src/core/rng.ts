export type RNG = {
    choice<T>(items: readonly T[]): T
}

export function createRNG(seed?: number): RNG {
    let s = seed ?? (Math.random() * 2 ** 32 >>> 0)

    function next(): number {
        s |= 0
        s = s + 0x6D2B79F5 | 0
        let t = Math.imul(s ^ s >>> 15, 1 | s)
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }

    return {
        choice<T>(items: readonly T[]): T {
            return items[Math.floor(next() * items.length)]
        },
    }
}
