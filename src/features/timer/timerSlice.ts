import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { AppState } from "../../store";

export interface TimerState {
  seconds: number;
  status: "idle" | "running";
  phase: "work" | "break";
  longBreakCounter: number;
  totalTimeWorkedSeconds: number;
  availableBreakTimeSeconds: number;
  continousWork: boolean;
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
  continousWork: false,
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
          let newSeconds: number, newPhase : "work" | "break"
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
            state.events.push({
              start: then - state.settings.workSeconds * 1000,
              end: then,
              task: state.selectedTask || ""
            })
          } else {
            newPhase = "work"
            newSeconds = state.settings.workSeconds
          }
          state.phase = newPhase
          state.seconds = newSeconds
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
    returnToWork: (state) => {
      state.phase = "work"
      state.seconds = state.settings.workSeconds
    },
    startBreak: (state) => {
      state.phase = "break"
      state.seconds = state.availableBreakTimeSeconds
    },
    setContinuousWork: (state, action: PayloadAction<boolean>) => {
      state.continousWork = action.payload
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

export const { tick, start, hold, returnToWork, startBreak, setContinuousWork, addTask, setSelectedTask } = timerSlice.actions

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
export const selectEventTotals = (state: AppState): EventTotals => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const week = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const month = new Date(now.getFullYear(), now.getMonth())
  const events = state.events.filter(event => event.task)
  const totals: EventTotals = {}
  events.forEach(event => {
    const startDate = new Date(event.start)
    if (!totals[event.task]) {
      totals[event.task] = {
        today: 0,
        week: 0,
        month: 0
      }
    }
    if (startDate >= today) {
      totals[event.task].today += Math.floor((event.end - event.start) / 1000)
    }
    if (startDate >= week) {
      totals[event.task].week += Math.floor((event.end - event.start) / 1000)
    }
    if (startDate >= month) {
      totals[event.task].month += Math.floor((event.end - event.start) / 1000)
    }
  })
  return totals
}
export const selectIsBreakAvailable = (state: AppState) => state.availableBreakTimeSeconds > 0

export interface EventTotals { [key: string]: { today: number, week: number, month: number } }


export default timerSlice.reducer