import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { AppState } from "../../store";

export interface TimerState {
  seconds: number;
  status: "idle" | "running";
  phase: "work" | "break";
  longBreakCounter: number;
  totalTimeWorkedSeconds: number;
  availableBreakTimeSeconds: number;
  lastTimestamp: number | null;
  tasks: {
    name: string;
  }[];
  selectedTask: string | null;
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
  lastTimestamp: null,
  tasks: [],
  selectedTask: null,
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
      while(totalDecrement > 0) {
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
          if (state.phase === "work") {
            state.phase = "break"
            state.longBreakCounter += 1
            if (state.longBreakCounter === state.settings.longBreakEvery) {
              state.seconds = state.settings.longBreakSeconds
              state.longBreakCounter = 0
              state.availableBreakTimeSeconds = state.settings.longBreakSeconds
            } else {
              state.seconds = state.settings.breakSeconds
              state.availableBreakTimeSeconds = state.settings.breakSeconds
            }
            state.events.push({
              start: then - state.settings.workSeconds * 1000,
              end: then,
              task: state.selectedTask || ""
            })
          } else {
            state.phase = "work"
            state.seconds = state.settings.workSeconds
          }
        }
      }
    },
    start: (state) => {
      state.status = "running"
    },
    hold: (state) => {
      state.status = "idle"
      state.lastTimestamp = null
    },
    addTask: (state, action: PayloadAction<string>) => {
      if (state.tasks.find(task => task.name === action.payload)) {
        return
      }
      state.tasks.push({
        name: action.payload
      })
    },
    setSelectedTask: (state, action: PayloadAction<string>) => {
      state.selectedTask = action.payload
    }
  }
})

export const { tick, start, hold, addTask, setSelectedTask } = timerSlice.actions

export const selectTime = (state: AppState) => `${String(Math.floor(state.seconds / 60)).padStart(2, "0")}:${String(state.seconds % 60).padStart(2, "0")}`
export const selectIsIdle = (state: AppState) => state.status === "idle"
export const selectIsRunning = (state: AppState) => state.status === "running"
export const selectIsWork = (state: AppState) => state.phase === "work"
export const selectIsBreak = (state: AppState) => state.phase === "break"
export const selectTotalTimeWorked = (state: AppState) => `${String(Math.floor(state.totalTimeWorkedSeconds / 60 / 60)).padStart(2, "0")}:${String(Math.floor(state.totalTimeWorkedSeconds / 60) % 60).padStart(2, "0")}:${String(state.totalTimeWorkedSeconds % 60).padStart(2, "0")}`
export const selectAvailableBreakTime = (state: AppState) => `${String(Math.floor(state.availableBreakTimeSeconds / 60 / 60)).padStart(2, "0")}:${String(Math.floor(state.availableBreakTimeSeconds / 60) % 60).padStart(2, "0")}:${String(state.availableBreakTimeSeconds % 60).padStart(2, "0")}`
export const selectTasks = (state: AppState) => state.tasks
export const selectSelectedTask = (state: AppState) => state.selectedTask
export const selectEvents = (state: AppState) => state.events.map(event => ({
  ...event,
  start: new Date(event.start),
  end: new Date(event.end)
}))

export default timerSlice.reducer