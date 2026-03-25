import type { Pos } from "./types"
import { initGame, tryMove } from "./api"
import {
    createUI,
    getBoardElement,
    renderBoard,
    selectCell,
    deselectAll,
    updateScore,
    updateDrowsiness,
    showMessage,
    showGameOver,
} from "./renderer"
import { animateCascade } from "./animator"

type ControllerState = "idle" | "selected" | "animating" | "game_over"

const BOARD_SIZE = 8
let state: ControllerState = "idle"
let selectedPos: Pos | null = null

function adjacent(a: Pos, b: Pos): boolean {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1
}

async function handleCellClick(row: number, col: number): Promise<void> {
    const clicked: Pos = [row, col]

    if (state === "animating" || state === "game_over") return

    if (state === "idle") {
        selectedPos = clicked
        state = "selected"
        selectCell(clicked)
        return
    }

    if (selectedPos![0] === clicked[0] && selectedPos![1] === clicked[1]) {
        deselectAll()
        selectedPos = null
        state = "idle"
        return
    }

    if (!adjacent(selectedPos!, clicked)) {
        deselectAll()
        selectedPos = clicked
        selectCell(clicked)
        return
    }

    state = "animating"
    deselectAll()

    const result = tryMove(
        selectedPos![0], selectedPos![1],
        clicked[0], clicked[1],
    )
    selectedPos = null

    if (result.tag === "invalid") {
        showMessage(result.reason)
        state = "idle"
        return
    }

    await animateCascade(result.phases)

    renderBoard(result.state.board)
    updateScore(result.state.score)
    updateDrowsiness(result.state.drowsiness)

    if (!result.has_possible_moves) {
        state = "game_over"
        showGameOver(result.state.score, startGame)
        return
    }

    state = "idle"
}

export function startGame(): void {
    const container = document.getElementById("app")!
    const gameState = initGame(BOARD_SIZE)

    createUI(container, BOARD_SIZE)
    renderBoard(gameState.board)
    updateScore(gameState.score)
    updateDrowsiness(gameState.drowsiness)

    getBoardElement().addEventListener("click", (e: Event) => {
        const target = (e.target as HTMLElement).closest(".cell") as HTMLElement | null
        if (!target) return
        const row = Number(target.dataset.row)
        const col = Number(target.dataset.col)
        handleCellClick(row, col)
    })

    state = "idle"
    selectedPos = null
}
