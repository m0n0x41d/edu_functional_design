# Development Notes

## UI Step Stream for Future Interfaces

If the project later gets a graphical interface, animations, or multiple frontends, the game core should expose intermediate cascade steps instead of returning only the final `BoardState`.

A plain sequence of board snapshots is not enough for the renderer. The UI can see that the board changed, but it cannot reliably infer what the change means:

- Was it a player swap?
- Were matched cells removed?
- Did tiles fall because of gravity?
- Were empty cells refilled with new random tiles?
- Did the cascade finish?

Because of that, it is useful to introduce an explicit step type with a semantic `kind`.

Example shape:

```python
type StepKind = Literal["swap", "remove", "gravity", "fill", "cascade_end"]

class Step(TypedDict):
    kind: ReadOnly[StepKind]
    before: ReadOnly[BoardState]
    after: ReadOnly[BoardState]
    matches: ReadOnly[tuple[Match, ...] | None]
```

Why this helps:

- The UI can choose the correct animation based on `kind`.
- Sound effects and particle effects can be attached to a specific step type.
- Debugging becomes easier because the game flow is explicit.
- Tests can validate the sequence of logical transitions, not only the final state.
- Different interfaces can consume the same step stream in different ways.

Suggested architecture:

1. Keep the game logic pure and let it produce a sequence of `Step` values.
2. The interface layer can consume these steps directly, or push them into a queue/event bus.
3. A simple console UI may ignore most intermediate steps and render only the final state.
4. A graphical UI can animate each step one by one.

This keeps the core logic independent from rendering concerns and avoids forcing the UI to reconstruct meaning from diffs between board snapshots.
