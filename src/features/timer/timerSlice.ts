import { createSlice } from "@reduxjs/toolkit";
import type { AppState } from "../../store";

export interface TimerState {
  seconds: number;
  status: "idle" | "running";
  phase: "work" | "break";
  longBreakCounter: number;
  totalTimeWorkedSecodns: number;
  availableBreakTimeSeconds: number;
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
  totalTimeWorkedSecodns: 0,
  availableBreakTimeSeconds: 0,
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
    tick: (state) => {
      state.seconds -= 1
      if (state.phase === "work") {
        state.totalTimeWorkedSecodns += 1
      } else {
        state.availableBreakTimeSeconds -= 1
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
        } else {
          state.phase = "work"
          state.seconds = state.settings.workSeconds
        }
      }
    },
    start: (state) => {
      state.status = "running"
    },
    hold: (state) => {
      state.status = "idle"
    }
  }
})

export const { tick, start, hold } = timerSlice.actions

export const selectTime = (state: AppState) => `${String(Math.floor(state.timer.seconds / 60)).padStart(2, "0")}:${String(state.timer.seconds % 60).padStart(2, "0")}`
export const selectIsIdle = (state: AppState) => state.timer.status === "idle"
export const selectIsRunning = (state: AppState) => state.timer.status === "running"
export const selectIsWork = (state: AppState) => state.timer.phase === "work"
export const selectIsBreak = (state: AppState) => state.timer.phase === "break"
export const selectTotalTimeWorked = (state: AppState) => `${String(Math.floor(state.timer.totalTimeWorkedSecodns / 60 / 60)).padStart(2, "0")}:${String(Math.floor(state.timer.totalTimeWorkedSecodns / 60) % 60).padStart(2, "0")}:${String(state.timer.totalTimeWorkedSecodns % 60).padStart(2, "0")}`
export const selectAvailableBreakTime = (state: AppState) => `${String(Math.floor(state.timer.availableBreakTimeSeconds / 60 / 60)).padStart(2, "0")}:${String(Math.floor(state.timer.availableBreakTimeSeconds / 60) % 60).padStart(2, "0")}:${String(state.timer.availableBreakTimeSeconds % 60).padStart(2, "0")}`

export default timerSlice.reducer