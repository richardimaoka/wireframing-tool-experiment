import type { ContainerNode } from "./layout";
import type { Path } from "./path";
import { layoutReducerNew, type Action } from "./reducer";

// selectedPath travels with the tree in each snapshot so that undo/redo
// restores the selection the user had at that point, instead of leaving it
// pointing at a path that may not exist in the restored tree.
export type EditorState = {
  tree: ContainerNode;
  selectedPath: Path;
};

export type SelectAction = {
  type: "select";
  path: Path;
};

export type UndoAction = { type: "undo" };
export type RedoAction = { type: "redo" };

export type HistoryAction = Action | SelectAction | UndoAction | RedoAction;

export type HistoryState = {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
};

// Caps memory growth from unbounded undo history in long editing sessions.
const MAX_HISTORY = 50;

export function initHistoryState(initial: EditorState): HistoryState {
  return { past: [], present: initial, future: [] };
}

export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case "select":
      // Moving the selection isn't an undoable edit, so it doesn't touch
      // past/future - it also shouldn't clear the redo stack.
      return {
        ...state,
        present: { ...state.present, selectedPath: action.path },
      };

    case "undo": {
      if (state.past.length === 0) {
        return state;
      }
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case "redo": {
      if (state.future.length === 0) {
        return state;
      }
      const next = state.future[0];
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: next,
        future: state.future.slice(1),
      };
    }

    default: {
      // Any other action is a tree edit: run it through the existing model
      // reducer, snapshot the pre-edit state onto the undo stack, and clear
      // the redo stack since it no longer applies once a new edit happens.
      const tree = layoutReducerNew(state.present.tree, action);
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: { ...state.present, tree },
        future: [],
      };
    }
  }
}
