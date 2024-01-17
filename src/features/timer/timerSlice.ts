import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { AppState } from "../../store";
import { WritableDraft } from "immer/dist/types/types-external";

export interface TimerState {
  seconds: number;
  status: "idle" | "running";
  phase: "work" | "break";
  longBreakCounter: number;
  totalTimeWorkedSeconds: number;
  availableBreakTimeSeconds: number;
  continousWork: boolean;
  lastTimestamp: number | null;
  initialSeconds: number;
  tasks: {
    name: string;
  }[];
  selectedTask: string;
  events: {
    start: number;
    end: number;
    task: string;
  }[];
  settings: {
    workSeconds: number;
    breakSeconds: number;
    longBreakSeconds: number;
    longBreakEvery: number;
  }
}

const initialState: TimerState = {
  seconds: 25 * 60,
  status: "idle",
  phase: "work",
  longBreakCounter: 0,
  totalTimeWorkedSeconds: 0,
  availableBreakTimeSeconds: 0,
  continousWork: false,
  lastTimestamp: null,
  initialSeconds: 25 * 60,
  tasks: [{ name: 'No task' }],
  selectedTask: 'No task',
  events: [],
  settings: {
    workSeconds: 25 * 60,
    breakSeconds: 5 * 60,
    longBreakSeconds: 10 * 60,
    longBreakEvery: 4
  }
}

export const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    tick: (state, action: PayloadAction<number>) => {
      const now = action.payload
      let totalDecrement
      if (state.lastTimestamp) {
        totalDecrement = Math.floor((now - state.lastTimestamp) / 1000)
      } else {
        totalDecrement = 1
      }
      let then = state.lastTimestamp || now - 1000
      state.lastTimestamp = now
      while (totalDecrement > 0) {
        const decrement = Math.min(state.seconds, totalDecrement)
        totalDecrement -= decrement
        state.seconds -= decrement
        then += decrement * 1000
        if (state.phase === "work") {
          state.totalTimeWorkedSeconds += decrement
        } else {
          state.availableBreakTimeSeconds -= decrement
        }
        if (state.seconds === 0) {
          let newSeconds: number, newPhase: "work" | "break"
          if (state.phase === "work") {
            state.longBreakCounter += 1
            const isLongBreak = state.longBreakCounter === state.settings.longBreakEvery
            if (isLongBreak) {
              state.longBreakCounter = 0
              state.availableBreakTimeSeconds += state.settings.longBreakSeconds
            } else {
              state.availableBreakTimeSeconds += state.settings.breakSeconds
            }
            if (!state.continousWork) {
              newPhase = "break"
              newSeconds = isLongBreak ? state.settings.longBreakSeconds : state.settings.breakSeconds
            } else {
              newPhase = "work"
              newSeconds = state.settings.workSeconds
            }
            addEvent(state, then, state.initialSeconds)
          } else {
            newPhase = "work"
            newSeconds = state.settings.workSeconds
          }
          state.phase = newPhase
          state.seconds = newSeconds
          state.initialSeconds = newSeconds
        }
      }
    },
    start: (state) => {
      state.status = "running",
        state.initialSeconds = state.seconds
    },
    hold: (state) => {
      state.status = "idle"
      addEventForNow(state)
      state.lastTimestamp = null
    },
    returnToWork: (state) => {
      state.phase = "work"
      state.seconds = state.settings.workSeconds
      state.initialSeconds = state.settings.workSeconds
    },
    startBreak: (state) => {
      addEventForNow(state)
      state.phase = "break"
      state.seconds = state.availableBreakTimeSeconds
    },
    reset: (state) => {
      state.status = "idle"
      state.phase = "work"
      state.longBreakCounter = 0
      state.totalTimeWorkedSeconds = 0
      state.availableBreakTimeSeconds = 0
      state.lastTimestamp = null
      state.initialSeconds = state.settings.workSeconds
      state.seconds = state.settings.workSeconds
    },
    setContinuousWork: (state, action: PayloadAction<boolean>) => {
      state.continousWork = action.payload
    },
    addTask: (state, action: PayloadAction<string>) => {
      if (state.tasks.find(task => task.name === action.payload)) {
        return
      }
      state.tasks.splice(1, 0, { name: action.payload })
    },
    setSelectedTask: (state, action: PayloadAction<string>) => {
      if (state.phase === "work" && state.status === "running") {
        addEventForNow(state, false);
      }
      state.selectedTask = action.payload
      state.initialSeconds = state.seconds
      moveTaskToTop(state, action.payload)
    }
  }
})

function addEventForNow(state: WritableDraft<TimerState>, moveTask = true) {
  addEvent(state, state.lastTimestamp!, state.initialSeconds - state.seconds, moveTask)
}

function addEvent(state: WritableDraft<TimerState>, then: number, seconds: number, moveTask = true) {
  state.events.push({
    start: then - seconds * 1000,
    end: then,
    task: state.selectedTask
  })
  if (moveTask) {
    moveTaskToTop(state, state.selectedTask)
  }
}

function moveTaskToTop(state: WritableDraft<TimerState>, taskName: string) {
  // move task to second position
  const index = state.tasks.findIndex(task => task.name === taskName);
  if (index > 1) {
    const task = state.tasks[index];
    state.tasks.splice(index, 1);
    state.tasks.splice(1, 0, task);
  }
}

export const { tick, start, hold, returnToWork, startBreak, reset, setContinuousWork, addTask, setSelectedTask } = timerSlice.actions

export const selectTime = (state: AppState) => ({ minutes: Math.floor(state.seconds / 60), seconds: state.seconds % 60 })
export const selectIsIdle = (state: AppState) => state.status === "idle"
export const selectIsRunning = (state: AppState) => state.status === "running"
export const selectIsWork = (state: AppState) => state.phase === "work"
export const selectIsBreak = (state: AppState) => state.phase === "break"
export const selectTotalTimeWorked = (state: AppState) => `${String(Math.floor(state.totalTimeWorkedSeconds / 60 / 60)).padStart(2, "0")}:${String(Math.floor(state.totalTimeWorkedSeconds / 60) % 60).padStart(2, "0")}:${String(state.totalTimeWorkedSeconds % 60).padStart(2, "0")}`
export const selectAvailableBreakTime = (state: AppState) => `${String(Math.floor(state.availableBreakTimeSeconds / 60 / 60)).padStart(2, "0")}:${String(Math.floor(state.availableBreakTimeSeconds / 60) % 60).padStart(2, "0")}:${String(state.availableBreakTimeSeconds % 60).padStart(2, "0")}`
export const selectContinousWork = (state: AppState) => state.continousWork
export const selectTasks = (state: AppState) => state.tasks
export const selectSelectedTask = (state: AppState) => state.selectedTask
export const selectEvents = (state: AppState) => state.events.map(event => ({
  ...event,
  start: new Date(event.start),
  end: new Date(event.end)
}))
export const selectIsBreakAvailable = (state: AppState) => state.availableBreakTimeSeconds > 0


export default timerSlice.reducer