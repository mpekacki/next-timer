import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  tick,
  start,
  hold,
  returnToWork,
  startBreak,
  reset,
  setContinuousWork,
  addTask,
  setSelectedTask,
  selectTime,
  selectIsIdle,
  selectIsRunning,
  selectIsWork,
  selectIsBreak,
  selectTotalTimeWorked,
  selectAvailableBreakTime,
  selectContinousWork,
  selectIsBreakAvailable,
  selectTasks,
  selectSelectedTask,
  selectEvents
} from './timerSlice'
import { useAppDispatch } from '../../hooks'

interface EventTotals { [key: string]: { today: number, week: number, month: number } }

function Timer() {
  const dispatch = useAppDispatch()

  const [task, setTask] = useState('')

  const time: { minutes: number, seconds: number } = useSelector(selectTime)
  const timeString = `${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`
  const isIdle = useSelector(selectIsIdle)
  const isRunning = useSelector(selectIsRunning)
  const isWork = useSelector(selectIsWork)
  const isBreak = useSelector(selectIsBreak)
  const phase = isWork ? 'Work' : isBreak ? 'Break' : ''
  const totalTimeWorked = `Total time worked: ${useSelector(selectTotalTimeWorked)}`
  const availableBreakTime = `Available break time: ${useSelector(selectAvailableBreakTime)}`
  const continuousWork = useSelector(selectContinousWork)
  const isBreakAvailable = useSelector(selectIsBreakAvailable)
  const tasks = useSelector(selectTasks).filter(savedTask => !task || savedTask.name === 'No task' || savedTask.name.toUpperCase().includes(task.toUpperCase()))
  const selectedTask = useSelector(selectSelectedTask)
  const events = useSelector(selectEvents)
  const eventsLength = events.length
  const [eventTotals, setEventTotals] = useState<EventTotals>({})

  const [yearNow, setYearNow] = useState(new Date().getUTCFullYear())
  const [monthNow, setMonthNow] = useState(new Date().getUTCMonth())
  const [dateNow, setDateNow] = useState(new Date().getUTCDate())
  const [dayNow, setDayNow] = useState(new Date().getUTCDay())

  function Ticker() {
    const dispatch = useAppDispatch()

    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date()
        if (isRunning) {
          dispatch(tick(now.getTime()))
        }
        if (now.getUTCFullYear() !== yearNow) {
          setYearNow(now.getUTCFullYear())
        }
        if (now.getUTCMonth() !== monthNow) {
          setMonthNow(now.getUTCMonth())
        }
        if (now.getUTCDate() !== dateNow) {
          setDateNow(now.getUTCDate())
        }
        if (now.getUTCDay() !== dayNow) {
          setDayNow(now.getUTCDay())
        }
      }, 1000)
      return () => clearInterval(timer)
    }, [dispatch, isRunning])

    return null
  }

  useEffect(() => {
    const newEventTotals: EventTotals = {}
    const today = new Date(yearNow, monthNow, dateNow)
    const week = new Date(yearNow, monthNow, dateNow - dayNow)
    const month = new Date(yearNow, monthNow)
    events.forEach(event => {
      const startDate = new Date(event.start)
      if (!newEventTotals[event.task]) {
        newEventTotals[event.task] = {
          today: 0,
          week: 0,
          month: 0
        }
      }
      const eventLength = Math.floor((event.end.getTime() - event.start.getTime()) / 1000)
      if (startDate >= today) {
        newEventTotals[event.task].today += eventLength
      }
      if (startDate >= week) {
        newEventTotals[event.task].week += eventLength
      }
      if (startDate >= month) {
        newEventTotals[event.task].month += eventLength
      }
    })
    setEventTotals(newEventTotals)
  }, [eventsLength, yearNow, monthNow, dateNow, dayNow])


  return (
    <div>
      <div>{phase}</div>
      <Ticker />
      {isIdle && <button onClick={() => dispatch(start())}>Start</button>}
      {isRunning && <button onClick={() => dispatch(hold())}>Hold</button>}
      {isBreak && <button onClick={() => dispatch(returnToWork())}>Return to work</button>}
      {isWork && isBreakAvailable && <button onClick={() => dispatch(startBreak())}>Break</button>}
      <button onClick={() => dispatch(reset())}>Reset</button>
      <div>{timeString}</div>
      <div>{totalTimeWorked}</div>
      <div>{availableBreakTime}</div>
      <div>
        <input type="checkbox" checked={continuousWork} onChange={() => dispatch(setContinuousWork(!continuousWork))} id="continuousWork" name="continuousWork" />
        <label htmlFor="continuousWork">Continuous work</label>
      </div>
      <input type="text" value={task} onChange={e => setTask(e.target.value)} placeholder="Task name" />
      {task && <button onClick={() => { dispatch(addTask(task)); setTask(''); }}>Add task</button>}
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
      {/* <fieldset>
        <legend>Events</legend>
        <div>
          {events.map((event, index) => (
            <div key={index}>{`${event.task} ${event.start.getUTCHours().toString().padStart(2, '0')}:${event.start.getUTCMinutes().toString().padStart(2, '0')} - ${event.end.getUTCHours().toString().padStart(2, '0')}:${event.end.getUTCMinutes().toString().padStart(2, '0')} ${event.start.getUTCDate().toString().padStart(2, '0')}/${(event.start.getUTCMonth() + 1).toString().padStart(2, '0')}/${event.start.getUTCFullYear()}`}</div>
          ))}
        </div>
      </fieldset> */}
      <fieldset>
        <legend>Event totals</legend>
        <div>
          {Object.keys(eventTotals).map((key, index) => (
            <div key={index}>{`${key}: today ${Math.floor(eventTotals[key].today / 60 / 60).toString().padStart(2, '0')}:${Math.floor(eventTotals[key].today / 60 % 60).toString().padStart(2, '0')}, week ${Math.floor(eventTotals[key].week / 60 / 60).toString().padStart(2, '0')}:${Math.floor(eventTotals[key].week / 60 % 60).toString().padStart(2, '0')}, month ${Math.floor(eventTotals[key].month / 60 / 60).toString().padStart(2, '0')}:${Math.floor(eventTotals[key].month / 60 % 60).toString().padStart(2, '0')}`}</div>
          ))}
        </div>
        <div>
          <label>Custom from</label>
          <input type="date" />
        </div>
        <div>
          <label>Custom to</label>
          <input type="date" />
        </div>
      </fieldset>
    </div>
  )
}

export default Timer