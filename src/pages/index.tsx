import type { NextPage } from 'next'
import Head from 'next/head'

import Timer from '../features/timer/Timer'
import { selectTime, selectIsRunning, selectSelectedTask } from '../features/timer/timerSlice'
import styles from '../styles/Home.module.css'
import { useSelector } from 'react-redux'

const IndexPage: NextPage = () => {
  const time = useSelector(selectTime)
  const isRunning = useSelector(selectIsRunning)
  const selectedTask = useSelector(selectSelectedTask)
  const title = time.minutes.toString().padStart(2, '0') + ':' + time.seconds.toString().padStart(2, '0') + ' ' + selectedTask
  const favicon = isRunning ? '/favicon.ico' : '/favicon-pause.ico'

  return (
    <div className={styles.container}>
      <Head>
        <title>{title}</title>
        <link rel="icon" href={favicon} />
      </Head>
      <header className={styles.header}>
        <img src="/logo.svg" className={styles.logo} alt="logo" />
        <Timer />
      </header>
    </div>
  )
}

export default IndexPage
