import random
from typing import Final, Literal, ReadOnly, TypedDict

EMPTY: Final[str] = "0"
SYMBOLS: Final[tuple[str, ...]] = ("A", "B", "C", "D", "E", "F")
RNG = random.Random()


class Element(TypedDict):
    symbol: ReadOnly[str]


def make_element(symbol: str) -> Element:
    if len(symbol) != 1:
        raise ValueError("Element symbol must be exactly one character long.")
    return {"symbol": symbol}


type BoardCells = tuple[tuple[Element, ...], ...]


class Board(TypedDict):
    size: ReadOnly[int]
    cells: ReadOnly[BoardCells]


class BoardState(TypedDict):
    board: ReadOnly[Board]
    score: ReadOnly[int]


type MatchDirection = Literal["horizontal", "vertical"]


class Match(TypedDict):
    direction: ReadOnly[MatchDirection]
    row: ReadOnly[int]
    col: ReadOnly[int]
    length: ReadOnly[int]


def make_match(
    direction: MatchDirection,
    row: int,
    col: int,
    length: int,
) -> Match:
    return {
        "direction": direction,
        "row": row,
        "col": col,
        "length": length,
    }


def make_board(size: int, cells: BoardCells) -> Board:
    return {
        "size": size,
        "cells": cells,
    }


def make_board_state(board: Board, score: int = 0) -> BoardState:
    return {
        "board": board,
        "score": score,
    }


def initialize_game(board_size: int = 8) -> BoardState:
    if board_size < 3:
        raise ValueError("Board size must be at least 3 to guarantee a possible move.")

    empty_state = make_board_state(
        make_board(board_size, make_empty_cells(board_size)),
        0,
    )
    initialized_state = process_cascade(fill_empty_spaces(empty_state))
    if has_possible_moves(initialized_state["board"]):
        return initialized_state

    return initialize_game(board_size)


def add_match_if_valid(
    matches: tuple[Match, ...],
    row: int,
    col: int,
    length: int,
    direction: MatchDirection,
) -> tuple[Match, ...]:
    if length < 3:
        return matches

    return matches + (make_match(direction, row, col, length),)


def find_matches(board: Board) -> tuple[Match, ...]:
    matches: tuple[Match, ...] = ()
    size = board["size"]

    for row in range(size):
        start_col = 0
        for col in range(1, size):
            if board["cells"][row][start_col]["symbol"] == EMPTY:
                start_col = col
                continue

            if board["cells"][row][col]["symbol"] == EMPTY:
                matches = add_match_if_valid(
                    matches,
                    row,
                    start_col,
                    col - start_col,
                    "horizontal",
                )
                start_col = col + 1
                continue

            if (
                board["cells"][row][col]["symbol"]
                != board["cells"][row][start_col]["symbol"]
            ):
                matches = add_match_if_valid(
                    matches,
                    row,
                    start_col,
                    col - start_col,
                    "horizontal",
                )
                start_col = col
            elif col == size - 1:
                matches = add_match_if_valid(
                    matches,
                    row,
                    start_col,
                    col - start_col + 1,
                    "horizontal",
                )

    for col in range(size):
        start_row = 0
        for row in range(1, size):
            if board["cells"][start_row][col]["symbol"] == EMPTY:
                start_row = row
                continue

            if board["cells"][row][col]["symbol"] == EMPTY:
                matches = add_match_if_valid(
                    matches,
                    start_row,
                    col,
                    row - start_row,
                    "vertical",
                )
                start_row = row + 1
                continue

            if (
                board["cells"][row][col]["symbol"]
                != board["cells"][start_row][col]["symbol"]
            ):
                matches = add_match_if_valid(
                    matches,
                    start_row,
                    col,
                    row - start_row,
                    "vertical",
                )
                start_row = row
            elif row == size - 1:
                matches = add_match_if_valid(
                    matches,
                    start_row,
                    col,
                    row - start_row + 1,
                    "vertical",
                )

    return matches


def make_empty_cells(size: int) -> BoardCells:
    return tuple(tuple(make_element(EMPTY) for _ in range(size)) for _ in range(size))


def mark_cells_for_removal(board: Board, matches: tuple[Match, ...]) -> BoardCells:
    new_cells = [list(row) for row in board["cells"]]

    for match in matches:
        for offset in range(match["length"]):
            row = (
                match["row"]
                if match["direction"] == "horizontal"
                else match["row"] + offset
            )
            col = (
                match["col"] + offset
                if match["direction"] == "horizontal"
                else match["col"]
            )
            new_cells[row][col] = make_element(EMPTY)

    return tuple(tuple(row) for row in new_cells)


def apply_gravity(cells: BoardCells, size: int) -> BoardCells:
    new_cells = [list(row) for row in make_empty_cells(size)]

    for col in range(size):
        new_row = size - 1
        for row in range(size - 1, -1, -1):
            if cells[row][col]["symbol"] != EMPTY:
                new_cells[new_row][col] = cells[row][col]
                new_row -= 1

    return tuple(tuple(row) for row in new_cells)


def calculate_score(removed_count: int) -> int:
    return removed_count * 10


def remove_matches(
    current_state: BoardState,
    matches: tuple[Match, ...],
) -> BoardState:
    if not matches:
        return current_state

    marked_cells = mark_cells_for_removal(current_state["board"], matches)
    gravity_applied_cells = apply_gravity(marked_cells, current_state["board"]["size"])
    removed_count = sum(match["length"] for match in matches)
    new_score = current_state["score"] + calculate_score(removed_count)

    return make_board_state(
        make_board(current_state["board"]["size"], gravity_applied_cells),
        new_score,
    )


def fill_empty_spaces(current_state: BoardState) -> BoardState:
    size = current_state["board"]["size"]
    new_cells = tuple(
        tuple(
            cell if cell["symbol"] != EMPTY else make_element(RNG.choice(SYMBOLS))
            for cell in row
        )
        for row in current_state["board"]["cells"]
    )

    return make_board_state(
        make_board(size, new_cells),
        current_state["score"],
    )


def process_cascade(current_state: BoardState) -> BoardState:
    matches = find_matches(current_state["board"])
    if not matches:
        return current_state

    next_state = remove_matches(current_state, matches)
    next_state = fill_empty_spaces(next_state)
    return process_cascade(next_state)


def draw(board: Board) -> None:
    size = board["size"]
    print("  " + " ".join(str(i) for i in range(size)))
    for row in range(size):
        print(
            f"{row} "
            + " ".join(board["cells"][row][col]["symbol"] for col in range(size))
        )
    print()


def clone_board(board: Board) -> Board:
    size = board["size"]
    cells = tuple(
        tuple(board["cells"][row][col] for col in range(size)) for row in range(size)
    )
    return make_board(size, cells)


def swap_cells(board: Board, row: int, col: int, row1: int, col1: int) -> Board:
    cells = [list(current_row) for current_row in board["cells"]]
    element = cells[row][col]
    cells[row][col] = cells[row1][col1]
    cells[row1][col1] = element
    return make_board(
        board["size"],
        tuple(tuple(current_row) for current_row in cells),
    )


def match_contains_cell(match: Match, row: int, col: int) -> bool:
    if match["direction"] == "horizontal":
        return (
            match["row"] == row and match["col"] <= col < match["col"] + match["length"]
        )

    return match["col"] == col and match["row"] <= row < match["row"] + match["length"]


def has_possible_moves(board: Board) -> bool:
    size = board["size"]
    if size < 3:
        return False

    for row in range(size):
        for col in range(size):
            for row1, col1 in ((row, col + 1), (row + 1, col)):
                if row1 >= size or col1 >= size:
                    continue

                swapped_board = swap_cells(board, row, col, row1, col1)
                matches = find_matches(swapped_board)
                if any(
                    match_contains_cell(match, row, col)
                    or match_contains_cell(match, row1, col1)
                    for match in matches
                ):
                    return True

    return False


def read_move(board_state: BoardState) -> BoardState:
    print(">")
    input_line = input()
    if input_line == "q":
        raise SystemExit(0)

    coords = input_line.split()
    if len(coords) != 4:
        print("Expected move format: row col row1 col1")
        return board_state

    try:
        row = int(coords[0])
        col = int(coords[1])
        row1 = int(coords[2])
        col1 = int(coords[3])
    except ValueError:
        print("Move coordinates must be integers.")
        return board_state

    size = board_state["board"]["size"]
    if not all(0 <= value < size for value in (row, col, row1, col1)):
        print("Move coordinates are out of bounds.")
        return board_state

    if abs(row - row1) + abs(col - col1) != 1:
        print("Only adjacent cells can be swapped.")
        return board_state

    new_board = swap_cells(board_state["board"], row, col, row1, col1)
    return process_cascade(make_board_state(new_board, board_state["score"]))


def main() -> None:
    board_state = initialize_game()
    while True:
        draw(board_state["board"])
        board_state = read_move(board_state)


if __name__ == "__main__":
    main()
