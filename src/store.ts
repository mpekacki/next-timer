import { Action, ThunkAction, configureStore } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import timerReducer from './features/timer/timerSlice'

// version 2: timer durations changed from seconds to milliseconds
const migrations = {
  2: (state: any) => {
    if (!state || state.milliseconds !== undefined) {
      return state
    }
    const { seconds, initialSeconds, totalTimeWorkedSeconds, availableBreakTimeSeconds, settings, ...rest } = state
    return {
      ...rest,
      milliseconds: seconds * 1000,
      initialMilliseconds: initialSeconds * 1000,
      totalTimeWorkedMilliseconds: totalTimeWorkedSeconds * 1000,
      availableBreakTimeMilliseconds: availableBreakTimeSeconds * 1000,
      settings: {
        workMilliseconds: settings.workSeconds * 1000,
        breakMilliseconds: settings.breakSeconds * 1000,
        longBreakMilliseconds: settings.longBreakSeconds * 1000,
        longBreakEvery: settings.longBreakEvery
      }
    }
  }
}

const persistConfig = {
  key: 'root',
  version: 2,
  storage,
  migrate: createMigrate(migrations as any)
}

const persistedReducer = persistReducer(persistConfig, timerReducer)

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      }
    }),
})

export type AppState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action<string>
>

export const persistor = persistStore(store)
export default store