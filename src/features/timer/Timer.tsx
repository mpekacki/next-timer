import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  tick,
  start,
  hold,
  selectTime,
  selectIsIdle,
  selectIsRunning,
  selectIsWork,
  selectIsBreak,
  selectTotalTimeWorked,
  selectAvailableBreakTime
} from './timerSlice'
import { useAppDispatch } from '../../hooks'

function Timer() {
  function Ticker() {
    const dispatch = useAppDispatch()

    useEffect(() => {
      const timer = setInterval(() => dispatch(tick()), 1000)
      return () => clearInterval(timer)
    }, [dispatch])

    return null
  }

  const dispatch = useAppDispatch()

  const time = useSelector(selectTime)
  const isIdle = useSelector(selectIsIdle)
  const isRunning = useSelector(selectIsRunning)
  const isWork = useSelector(selectIsWork)
  const isBreak = useSelector(selectIsBreak)
  const phase = isWork ? 'Work' : isBreak ? 'Break' : ''
  const totalTimeWorked = `Total time worked: ${useSelector(selectTotalTimeWorked)}`
  const availableBreakTime = `Available break time: ${useSelector(selectAvailableBreakTime)}`
  
  return (
    <div>
      <div>{phase}</div>
      {isRunning && <Ticker />}
      {isIdle && <button onClick={() => dispatch(start())}>Start</button>}
      {isRunning && <button onClick={() => dispatch(hold())}>Hold</button>}
      <div>{time}</div>
      <div>{totalTimeWorked}</div>
      <div>{availableBreakTime}</div>
    </div>
  )
}

export default Timer