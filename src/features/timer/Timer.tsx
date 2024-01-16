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

interface EventTotals { [key: string]: { today: number, week: number, month: number, custom: number } }

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
  const yesterday = new Date(new Date().getTime() - 86400000).toISOString().slice(0, 10)
  const [customFromDate, setCustomFromDate] = useState(yesterday)
  const [customToDate, setCustomToDate] = useState(yesterday)
  const [noOfVisibleTasks, setNoOfVisibleTasks] = useState(10)
  const MIN_NO_OF_VISIBLE_TASKS = 10
  const showMoreTasksVisible = tasks.length > noOfVisibleTasks
  const showLessTasksVisible = noOfVisibleTasks > MIN_NO_OF_VISIBLE_TASKS
  const showAddTaskButton = task && !tasks.find(savedTask => savedTask.name === task)
  const showClearTaskInputButton = !!task
  const [sortColumn, setSortColumn] = useState<'task' | 'today' | 'week' | 'month' | 'custom'>('task')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

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
    const customFrom = new Date(customFromDate)
    customFrom.setUTCHours(0, 0, 0, 0)
    const customTo = new Date(customToDate)
    customTo.setUTCHours(23, 59, 59, 999)
    events.forEach(event => {
      const startDate = new Date(event.start)
      const endDate = new Date(event.end)
      if (!newEventTotals[event.task]) {
        newEventTotals[event.task] = {
          today: 0,
          week: 0,
          month: 0,
          custom: 0
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
      if (startDate >= customFrom && endDate <= customTo) {
        newEventTotals[event.task].custom += eventLength
      }
      // if all zeros, remove task from eventTotals
      if (newEventTotals[event.task].today === 0 && newEventTotals[event.task].week === 0 && newEventTotals[event.task].month === 0 && newEventTotals[event.task].custom === 0) {
        delete newEventTotals[event.task]
      }
    })
    setEventTotals(newEventTotals)
  }, [eventsLength, yearNow, monthNow, dateNow, dayNow, customFromDate, customToDate])

  function getSortSpan(columnName: 'task' | 'today' | 'week' | 'month' | 'custom') {
    const isColumnSorted = sortColumn === columnName;
    const isAscending = sortDirection === 'asc';
  
    const handleClick = () => {
      if (isColumnSorted) {
        setSortDirection(isAscending ? 'desc' : 'asc');
      } else {
        setSortColumn(columnName);
        setSortDirection('asc');
      }
    };
  
    const arrowIcon = isAscending ? '▲' : '▼';
  
    return (
      <span onClick={handleClick}>
        {isColumnSorted ? arrowIcon : '▲▼'}
      </span>
    );
  }

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
      {showAddTaskButton && <button onClick={() => { dispatch(addTask(task)); setTask(''); }}>Add task</button>}
      {showClearTaskInputButton && <button onClick={() => setTask('')}>Clear</button>}
      <fieldset>
        <legend>Tasks</legend>
        <div>
          {tasks.slice(0, noOfVisibleTasks).map((task, index) => (
            <div key={index}>
              <input type="radio" name={task.name} id={task.name} value={task.name} checked={selectedTask === task.name} onChange={() => dispatch(setSelectedTask(task.name))} />
              <label htmlFor={task.name}>{task.name}</label>
            </div>
          ))}
        </div>
        {showMoreTasksVisible && <button onClick={() => setNoOfVisibleTasks(noOfVisibleTasks + 5)}>Show more</button>}
        {showLessTasksVisible && <button onClick={() => setNoOfVisibleTasks(noOfVisibleTasks - 5)}>Show less</button>}
      </fieldset>
      <fieldset>
        <legend>Event totals</legend>
        <table>
          <thead>
            <tr>
              <th>Task {getSortSpan('task')}</th>
              <th>Today {getSortSpan('today')}</th>
              <th>Week {getSortSpan('week')}</th>
              <th>Month {getSortSpan('month')}</th>
              <th>Custom {getSortSpan('custom')}</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(eventTotals).sort((a, b) => {
              if (sortColumn === 'task') {
                if (sortDirection === 'asc') {
                  return a.localeCompare(b)
                } else {
                  return b.localeCompare(a)
                }
              } else {
                if (sortDirection === 'asc') {
                  return eventTotals[a][sortColumn] - eventTotals[b][sortColumn]
                } else {
                  return eventTotals[b][sortColumn] - eventTotals[a][sortColumn]
                }
              }
            }).map((key, index) => (
              <tr key={index}>
                <td>{key}</td>
                <td>{`${Math.floor(eventTotals[key].today / 60 / 60).toString().padStart(2, '0')}:${Math.floor(eventTotals[key].today / 60 % 60).toString().padStart(2, '0')}`}</td>
                <td>{`${Math.floor(eventTotals[key].week / 60 / 60).toString().padStart(2, '0')}:${Math.floor(eventTotals[key].week / 60 % 60).toString().padStart(2, '0')}`}</td>
                <td>{`${Math.floor(eventTotals[key].month / 60 / 60).toString().padStart(2, '0')}:${Math.floor(eventTotals[key].month / 60 % 60).toString().padStart(2, '0')}`}</td>
                <td>{`${Math.floor(eventTotals[key].custom / 60 / 60).toString().padStart(2, '0')}:${Math.floor(eventTotals[key].custom / 60 % 60).toString().padStart(2, '0')}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <label>Custom from</label>
          <input type="date" value={customFromDate} onChange={e => setCustomFromDate(e.target.value)} />
        </div>
        <div>
          <label>Custom to</label>
          <input type="date" value={customToDate} onChange={e => setCustomToDate(e.target.value)} />
        </div>
      </fieldset>
    </div>
  )
}

export default Timer