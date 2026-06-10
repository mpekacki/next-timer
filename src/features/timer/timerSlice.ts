import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { AppState } from "../../store";
import { WritableDraft } from "immer/dist/types/types-external";

export interface TimerState {
  milliseconds: number;
  status: "idle" | "running";
  phase: "work" | "break";
  longBreakCounter: number;
  totalTimeWorkedMilliseconds: number;
  availableBreakTimeMilliseconds: number;
  continousWork: boolean;
  lastTimestamp: number | null;
  initialMilliseconds: number;
  tasks: {
    name: string;
  }[];
  selectedTask: string;
  events: {
    start: number;
    end: number;
    task: string;
  }[];
  customFromDate: string;
  customToDate: string;
  settings: {
    workMilliseconds: number;
    breakMilliseconds: number;
    longBreakMilliseconds: number;
    longBreakEvery: number;
  }
}

const initialState: TimerState = {
  milliseconds: 25 * 60 * 1000,
  status: "idle",
  phase: "work",
  longBreakCounter: 0,
  totalTimeWorkedMilliseconds: 0,
  availableBreakTimeMilliseconds: 0,
  continousWork: false,
  lastTimestamp: null,
  initialMilliseconds: 25 * 60 * 1000,
  tasks: [{ name: 'No task' }],
  selectedTask: 'No task',
  events: [],
  customFromDate: new Date(new Date().getTime() - 86400000).toISOString().slice(0, 10),
  customToDate: new Date(new Date().getTime() - 86400000).toISOString().slice(0, 10),
  settings: {
    workMilliseconds: 25 * 60 * 1000,
    breakMilliseconds: 5 * 60 * 1000,
    longBreakMilliseconds: 10 * 60 * 1000,
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
        totalDecrement = now - state.lastTimestamp
      } else {
        totalDecrement = 1000
      }
      let then = state.lastTimestamp || now - 1000
      state.lastTimestamp = now
      while (totalDecrement > 0) {
        const decrement = Math.min(state.milliseconds, totalDecrement)
        totalDecrement -= decrement
        state.milliseconds -= decrement
        then += decrement
        if (state.phase === "work") {
          state.totalTimeWorkedMilliseconds += decrement
        } else {
          state.availableBreakTimeMilliseconds -= decrement
        }
        if (state.milliseconds === 0) {
          let newMilliseconds: number, newPhase: "work" | "break"
          if (state.phase === "work") {
            state.longBreakCounter += 1
            const isLongBreak = state.longBreakCounter === state.settings.longBreakEvery
            if (isLongBreak) {
              state.longBreakCounter = 0
              state.availableBreakTimeMilliseconds += state.settings.longBreakMilliseconds
            } else {
              state.availableBreakTimeMilliseconds += state.settings.breakMilliseconds
            }
            if (!state.continousWork) {
              newPhase = "break"
              newMilliseconds = isLongBreak ? state.settings.longBreakMilliseconds : state.settings.breakMilliseconds
            } else {
              newPhase = "work"
              newMilliseconds = state.settings.workMilliseconds
            }
            addEvent(state, then, state.initialMilliseconds)
          } else {
            newPhase = "work"
            newMilliseconds = state.settings.workMilliseconds
          }
          state.phase = newPhase
          state.milliseconds = newMilliseconds
          state.initialMilliseconds = newMilliseconds
        }
      }
    },
    start: (state) => {
      state.status = "running",
        state.initialMilliseconds = state.milliseconds
    },
    hold: (state) => {
      state.status = "idle"
      addEventForNow(state)
      state.lastTimestamp = null
    },
    returnToWork: (state) => {
      state.phase = "work"
      state.milliseconds = state.settings.workMilliseconds
      state.initialMilliseconds = state.settings.workMilliseconds
    },
    startBreak: (state) => {
      addEventForNow(state)
      state.phase = "break"
      state.milliseconds = state.availableBreakTimeMilliseconds
    },
    reset: (state) => {
      state.status = "idle"
      state.phase = "work"
      state.longBreakCounter = 0
      state.totalTimeWorkedMilliseconds = 0
      state.availableBreakTimeMilliseconds = 0
      state.lastTimestamp = null
      state.initialMilliseconds = state.settings.workMilliseconds
      state.milliseconds = state.settings.workMilliseconds
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
      state.initialMilliseconds = state.milliseconds
      moveTaskToTop(state, action.payload)
    },
    setCustomFromDate: (state, action: PayloadAction<string>) => {
      state.customFromDate = action.payload
      if (state.customFromDate > state.customToDate) {
        state.customToDate = state.customFromDate
      }
    },
    setCustomToDate: (state, action: PayloadAction<string>) => {
      state.customToDate = action.payload
      if (state.customToDate < state.customFromDate) {
        state.customFromDate = state.customToDate
      }
    },
  }
})

function addEventForNow(state: WritableDraft<TimerState>, moveTask = true) {
  addEvent(state, state.lastTimestamp!, state.initialMilliseconds - state.milliseconds, moveTask)
}

function addEvent(state: WritableDraft<TimerState>, then: number, milliseconds: number, moveTask = true) {
  state.events.push({
    start: then - milliseconds,
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

export const { tick, start, hold, returnToWork, startBreak, reset, setContinuousWork, addTask, setSelectedTask, setCustomFromDate, setCustomToDate } = timerSlice.actions

// ceil so the countdown only drops a displayed second once it has fully elapsed,
// even when setInterval fires slightly late
const selectRemainingSeconds = (state: AppState) => Math.ceil(state.milliseconds / 1000)

export const selectTime = (state: AppState) => {
  const totalSeconds = selectRemainingSeconds(state)
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 }
}
export const selectIsIdle = (state: AppState) => state.status === "idle"
export const selectIsRunning = (state: AppState) => state.status === "running"
export const selectIsWork = (state: AppState) => state.phase === "work"
export const selectIsBreak = (state: AppState) => state.phase === "break"

function formatHoursMinutesSeconds(totalSeconds: number) {
  return `${String(Math.floor(totalSeconds / 60 / 60)).padStart(2, "0")}:${String(Math.floor(totalSeconds / 60) % 60).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`
}

// total time worked counts up (floor), available break time counts down (ceil),
// so sub-second jitter never makes either display a second that hasn't fully elapsed
export const selectTotalTimeWorked = (state: AppState) => formatHoursMinutesSeconds(Math.floor(state.totalTimeWorkedMilliseconds / 1000))
export const selectAvailableBreakTime = (state: AppState) => formatHoursMinutesSeconds(Math.ceil(state.availableBreakTimeMilliseconds / 1000))
export const selectContinousWork = (state: AppState) => state.continousWork
export const selectTasks = (state: AppState) => state.tasks
export const selectSelectedTask = (state: AppState) => state.selectedTask
export const selectEvents = (state: AppState) => state.events.map(event => ({
  ...event,
  start: new Date(event.start),
  end: new Date(event.end)
}))
export const selectCustomFromDate = (state: AppState) => state.customFromDate
export const selectCustomToDate = (state: AppState) => state.customToDate
export const selectIsBreakAvailable = (state: AppState) => state.availableBreakTimeMilliseconds > 0


export default timerSlice.reducer
