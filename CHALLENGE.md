# Engineering Challenge: Build "Gotcha"

## What you will do

You will build a small React web app that tracks a game of **Gotcha**. This
document gives you the rules of the game and the logic the app must follow.
It does not tell you how the app must look, and it does not tell you how to
structure your code. Those decisions are yours.

We want to watch how you work. Please think aloud. Tell us what you are
deciding and why. Ask questions when a requirement is not clear. There is no
trick in this document, but some requirements interact in ways that reward
careful reading.

Your interviewer will tell you how much time you have. You are not expected
to finish everything. Section 7 gives a suggested order of work.

---

## 1. The game

Gotcha is a summer-camp game, similar to "Assassins".

- Every player is secretly assigned one other player as their **target**.
- A player eliminates their target by sneaking up behind them and saying
  "gotcha".
- When a player eliminates their target, they take over the target's target.
  They now hunt that person instead.
- The game continues until only one player is left. That player wins.

A camp counselor (the **admin**) runs the game from one phone. Players tell
the admin when a gotcha happens, and the admin logs it in the app. The app is
the single source of truth for who is hunting whom.

---

## 2. Core concept: the hunting loop

At all times during an active game, the alive players form **exactly one
closed loop**:

- Every alive player hunts exactly one alive player.
- Every alive player is hunted by exactly one alive player.
- If you follow the chain of targets from any alive player, you visit every
  alive player exactly once and then return to where you started.
- With two or more alive players, no player hunts themself.

Example with five players, after a random assignment:

```
Ada → Blinky → Clyde → Dot → Eve → Ada
```

Every operation in Section 4 must keep this loop closed. If it does not, the
game breaks: someone has no target, or two people hunt the same person.

---

## 3. Game phases

The app is always in one of three phases.

| Phase      | Meaning                                                |
| ---------- | ------------------------------------------------------ |
| `setup`    | The admin is entering the roster. No targets exist yet. |
| `active`   | The game is running. The loop exists.                   |
| `finished` | One player remains. A winner has been declared.         |

Transitions:

- `setup` → `active`: the admin starts the game.
- `active` → `finished`: an operation leaves exactly one alive player.
- `finished` → `active`: the admin undoes the game-ending gotcha.
- any phase → `setup`: the admin starts a new game (clears everything).

---

## 4. Logic requirements

### 4.1 Setup: entering the roster

- The admin enters player names as text, **one name per line**. Pasting a
  list from a spreadsheet must work.
- Leading and trailing whitespace on each line is removed. Blank lines are
  ignored.
- The app shows a live count of valid names.
- **Minimum 2 players. Maximum 200 players.** The game cannot start outside
  this range, and the app must tell the admin why.
- **Duplicate names** (compared case-insensitively) must be flagged to the
  admin so they can fix them. However, duplicates do not block the start.
  Two players are allowed to have the same display name. This means a
  player's name **cannot** be their identity. Every player needs a unique
  internal identifier.
- During setup the admin can also remove a single name. A player removed
  during setup is deleted entirely and leaves no trace.

### 4.2 Starting the game

- Starting the game randomly wires all players into one closed loop
  (Section 2). The order must be random. Every start of a new game should
  produce a different loop.
- The phase becomes `active`.

### 4.3 Reshuffle

- The admin can re-randomize the whole loop, but **only while the game is
  pristine**: no gotcha has been logged and every player is still alive.
- Once anything has happened, reshuffle is no longer available.

### 4.4 Logging a gotcha

This is the most-used feature. It must be fast and hard to get wrong.

The admin logs a gotcha in **either** of two ways:

1. **Pick the hunter.** The victim is derived automatically: it is the
   hunter's current target.
2. **Pick the victim.** The hunter is derived automatically: it is the one
   alive player whose current target is the victim.

In both cases:

- Only alive players are offered for selection.
- The list must be searchable by name (200 players do not fit on a phone
  screen).
- Before the gotcha is committed, the app must show the admin the resolved
  pair: "**Hunter** got **Victim**". The admin then confirms.

When a gotcha is confirmed, all of the following happen together:

1. The victim's status becomes **out**.
2. The victim records **who** eliminated them and **when** (a timestamp).
3. The hunter's **kill count** increases by one.
4. The hunter **inherits the victim's target**. The victim no longer has a
   target.
5. An entry is appended to the **feed**: hunter, victim, timestamp.
6. The loop is still closed (Section 2).
7. If exactly one player is now alive, the game ends (Section 4.7).

Example, continuing from Section 2. Blinky gets Clyde:

```
Before:  Ada → Blinky → Clyde → Dot → Eve → Ada
After:   Ada → Blinky → Dot → Eve → Ada         (Clyde is out, got by Blinky)
```

A gotcha must be **rejected** (no state changes) when:

- the game is not `active`;
- the hunter is not alive;
- the victim is not alive;
- the hunter's target is themself (only possible when they are the sole
  survivor).

### 4.5 Undo

Mistakes happen in the field. The admin can **undo the most recent gotcha**.

- Undo applies to the most recent feed entry only. Undo can be repeated to
  walk back several gotchas, one at a time, most recent first.
- Undo reverses everything in Section 4.4:
  - The victim is alive again. Their "eliminated by" and "eliminated at"
    values are cleared.
  - The hunter's kill count decreases by one.
  - The victim is re-inserted into the loop **directly ahead of the hunter**:
    the hunter's current target becomes the victim's target, and the hunter
    now hunts the victim again.
  - The feed entry is removed.
- If the game was `finished` and the undone gotcha was the game-ending one,
  the phase returns to `active` and the winner is cleared.
- **Undo must still work if other things happened after the gotcha**, such as
  a late arrival being added or a player dropping out. This is why the rule
  is "re-insert ahead of the hunter" rather than "restore the previous
  snapshot". Think about what this means for your data model.
- Undo applies to gotchas only. Dropouts (Section 4.6) cannot be undone.

### 4.6 Mid-game roster changes

Camp is messy. People arrive late and people go home early.

**Late arrival (add a player during an active game):**

- The admin enters a name. Whitespace is trimmed. An empty name is rejected.
- The total roster (alive **and** out) cannot exceed 200.
- The newcomer is spliced into the loop after a **randomly chosen** alive
  player, called the anchor:

  ```
  Before:  … → Anchor → X → …
  After:   … → Anchor → Newcomer → X → …
  ```

- The newcomer starts alive with zero kills.
- Adding a player during `setup` simply adds them to the roster. Adding a
  player when the game is `finished` is not allowed.

**Dropout (remove an alive player during an active game):**

- A dropout is **not** a gotcha. Nobody gets a kill. Nothing is added to the
  feed.
- The dropout's hunter inherits the dropout's target, so the loop stays
  closed:

  ```
  Before:  … → Hunter → Dropout → X → …
  After:   … → Hunter → X → …
  ```

- The dropout's status becomes **out**, with a timestamp, but with **no
  eliminator**. The app must be able to tell a dropout apart from an
  eliminated player.
- Only alive players can drop out.
- If the dropout leaves exactly one player alive, the game ends
  (Section 4.7).
- The admin must confirm a dropout before it is applied.

### 4.7 Winning

- When an operation leaves **exactly one** alive player during an `active`
  game, the phase becomes `finished` and that player is the **winner**.
- The winner screen must show: the winner's name, the winner's kill count,
  the **top three players by kill count**, and the total number of gotchas
  logged.
- From the winner screen, the admin can start a **new game**. This must ask
  for confirmation, then clear all state and return to `setup`.

### 4.8 Live views during an active game

The admin needs four views. Their layout is up to you. Their **content and
ordering** is not.

| View            | Content                                                                                                                                   | Order                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Targets**     | Every alive player and their current target. Searchable: a search hit on **either** the hunter's name or the target's name shows the row. Each row offers the dropout action. Reshuffle is offered here, only while pristine. | Alphabetical by hunter name.                                                   |
| **Eliminated**  | Every out player. Each row says either who got them or that they dropped out.                                                             | Most recently eliminated first.                                                |
| **Leaderboard** | **Every** player, alive and out, with their kill count.                                                                                   | Kill count descending. Ties: alive players before out players, then by name.  |
| **Feed**        | Every logged gotcha with a time (hours and minutes), the hunter, and the victim. The undo action lives here.                              | Most recent first.                                                             |

The app must also always show the current **alive count** and **out count**.

### 4.9 Persistence

- All state must survive a page reload and a closed browser tab. The admin's
  phone will lock, the browser will get killed, and the game must still be
  there.
- There is **no backend**. Store everything in the browser. One device runs
  one game.
- If you server-render, the first paint must not flash the wrong phase before
  the persisted state loads.

---

## 5. Invariants to keep in mind

These statements must be true after **every** operation. They make good
tests.

1. Alive players form exactly one closed loop (Section 2).
2. Out players have no target.
3. A player's kill count equals the number of feed entries where they are the
   hunter.
4. Every out player has a timestamp. An out player has an eliminator if and
   only if they were eliminated by a gotcha (not a dropout).
5. Every feed entry's victim is currently out, **unless** that entry has been
   undone, in which case it no longer exists.
6. `finished` implies exactly one alive player, and the winner is that
   player.
7. Undo of a gotcha followed by re-logging the same gotcha yields the same
   loop as before the undo.

---

## 6. Constraints and what we are not asking for

- Use **React**. Framework, build tooling, TypeScript, and state management
  are your choice. Be ready to explain the choice.
- **Aesthetics are out of scope.** Unstyled HTML is fine. We will not judge
  colors, fonts, or animation. We will judge whether the information the
  admin needs is present and correct.
- No backend, no auth, no multi-device sync.
- You may use any library you like, but you must be able to explain what it
  does for you.
- You may use AI tools if you want, but you must be able to explain and
  defend every line. The design decisions must be yours.

---

## 7. Suggested order of work

You will probably not finish everything. Prioritize like this, and tell us if
you want to deviate:

1. **Data model and core loop logic**: roster, start, gotcha, winner. Make
   the loop invariant hold. Consider testing this before you build any UI.
2. **Setup screen and Targets view**, with the gotcha-logging flow.
3. **Eliminated, Leaderboard, Feed** views.
4. **Undo.**
5. **Late arrival and dropout.** Then check that undo still works after
   them.
6. **Persistence.**
7. **Reshuffle** and the remaining validation rules.

---

## 8. Questions we may ask along the way

- Where does game logic live, and why there?
- How do you know the loop is closed? How would you prove it?
- What happens when two players are named "Sam"?
- What happens if the admin taps "confirm" twice quickly?
- What would you change if two admins on two phones had to run the same game?
- What is the most fragile part of your implementation, and how would you
  harden it?

Good luck. Think aloud.
