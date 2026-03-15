import pytest

import game


def board_from_rows(*rows: str) -> game.Board:
    size = len(rows)
    assert all(len(row) == size for row in rows)
    cells = tuple(tuple(game.make_element(symbol) for symbol in row) for row in rows)
    return game.make_board(size, cells)


def state_from_rows(*rows: str, score: int = 0) -> game.BoardState:
    return game.make_board_state(board_from_rows(*rows), score)


def rows_from_board(board: game.Board) -> tuple[str, ...]:
    return tuple("".join(cell["symbol"] for cell in row) for row in board["cells"])


def rows_from_state(board_state: game.BoardState) -> tuple[str, ...]:
    return rows_from_board(board_state["board"])


class DummyRNG:
    def __init__(self, values: list[str]) -> None:
        self._values = iter(values)

    def choice(self, _symbols: tuple[str, ...]) -> str:
        return next(self._values)


def test_make_element_rejects_multi_character_symbols() -> None:
    with pytest.raises(ValueError):
        game.make_element("AB")


def test_find_matches_returns_horizontal_and_vertical_runs() -> None:
    board = board_from_rows(
        "AAAX",
        "BCDX",
        "EFGX",
        "HIJX",
    )

    assert game.find_matches(board) == (
        game.make_match("horizontal", 0, 0, 3),
        game.make_match("vertical", 0, 3, 4),
    )


def test_find_matches_ignores_empty_cells() -> None:
    board = board_from_rows(
        "0AA",
        "BC0",
        "DEF",
    )

    assert game.find_matches(board) == ()


def test_remove_matches_applies_gravity_and_updates_score() -> None:
    state = state_from_rows(
        "XYZW",
        "PQRS",
        "AAAT",
        "UVWX",
    )
    matches = game.find_matches(state["board"])

    next_state = game.remove_matches(state, matches)

    assert rows_from_state(state) == (
        "XYZW",
        "PQRS",
        "AAAT",
        "UVWX",
    )
    assert rows_from_state(next_state) == (
        "000W",
        "XYZS",
        "PQRT",
        "UVWX",
    )
    assert next_state["score"] == 30


def test_fill_empty_spaces_replaces_only_empty_cells(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(game, "RNG", DummyRNG(["X", "Y", "Z"]))
    state = state_from_rows(
        "0A0",
        "BC0",
        "DEF",
        score=15,
    )

    next_state = game.fill_empty_spaces(state)

    assert rows_from_state(next_state) == (
        "XAY",
        "BCZ",
        "DEF",
    )
    assert next_state["score"] == 15


def test_process_cascade_recurses_until_board_is_stable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(game, "RNG", DummyRNG(["A", "A", "A", "D", "E", "F"]))
    state = state_from_rows(
        "ABC",
        "DEC",
        "FGC",
    )

    next_state = game.process_cascade(state)

    assert rows_from_state(next_state) == (
        "ABD",
        "DEE",
        "FGF",
    )
    assert next_state["score"] == 60


def test_read_move_swaps_adjacent_cells_when_input_is_valid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("builtins.input", lambda: "0 0 0 1")
    state = state_from_rows(
        "ABC",
        "DEF",
        "GHI",
    )

    next_state = game.read_move(state)

    assert rows_from_state(next_state) == (
        "BAC",
        "DEF",
        "GHI",
    )
    assert next_state["score"] == 0


def test_read_move_returns_same_state_for_non_adjacent_cells(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr("builtins.input", lambda: "0 0 2 2")
    state = state_from_rows(
        "ABC",
        "DEF",
        "GHI",
    )

    next_state = game.read_move(state)

    assert next_state == state
    assert "Only adjacent cells can be swapped." in capsys.readouterr().out


def test_read_move_exits_on_q(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("builtins.input", lambda: "q")
    state = state_from_rows(
        "ABC",
        "DEF",
        "GHI",
    )

    with pytest.raises(SystemExit):
        game.read_move(state)
