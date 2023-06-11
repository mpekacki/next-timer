import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  tick,
  start,
  hold,
  addTask,
  setSelectedTask,
  selectTime,
  selectIsIdle,
  selectIsRunning,
  selectIsWork,
  selectIsBreak,
  selectTotalTimeWorked,
  selectAvailableBreakTime,
  selectTasks,
  selectSelectedTask,
  selectEvents
} from './timerSlice'
import { useAppDispatch } from '../../hooks'

function Timer() {
  function Ticker() {
    const dispatch = useAppDispatch()

    useEffect(() => {
      const timer = setInterval(() => dispatch(tick(Date.now())), 1000)
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
  const tasks = useSelector(selectTasks)
  const selectedTask = useSelector(selectSelectedTask)
  const events = useSelector(selectEvents)

  const [task, setTask] = useState('')

  return (
    <div>
      <div>{phase}</div>
      {isRunning && <Ticker />}
      {isIdle && <button onClick={() => dispatch(start())}>Start</button>}
      {isRunning && <button onClick={() => dispatch(hold())}>Hold</button>}
      <div>{time}</div>
      <div>{totalTimeWorked}</div>
      <div>{availableBreakTime}</div>
      <input type="text" value={task} onChange={e => setTask(e.target.value)} />
      {task && <button onClick={() => dispatch(addTask(task))}>Add task</button>}
      <fieldset>
        <legend>Tasks</legend>
        <div>
          {tasks.map((task, index) => (
            <div key={index}>
              <input type="radio" name="task" value={task.name} checked={selectedTask === task.name} onChange={() => dispatch(setSelectedTask(task.name))} />
              <label>{task.name}</label>
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Events</legend>
        <div>
          {events.map((event, index) => (
            <div key={index}>{`${event.task} ${event.start.getUTCHours().toString().padStart(2, '0')}:${event.start.getUTCMinutes().toString().padStart(2, '0')} - ${event.end.getUTCHours().toString().padStart(2, '0')}:${event.end.getUTCMinutes().toString().padStart(2, '0')}`}</div>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

export default Timer