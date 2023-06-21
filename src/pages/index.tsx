import type { NextPage } from 'next'
import Head from 'next/head'

import Timer from '../features/timer/Timer'
import { selectTime, selectIsRunning } from '../features/timer/timerSlice'
import styles from '../styles/Home.module.css'
import { useSelector } from 'react-redux'

const IndexPage: NextPage = () => {
  const time = useSelector(selectTime)
  const isRunning = useSelector(selectIsRunning)
  const title = (isRunning ? '⏵' : '⏸') + ' ' + time.minutes.toString().padStart(2, '0') + ':' + time.seconds.toString().padStart(2, '0')

  return (
    <div className={styles.container}>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className={styles.header}>
        <img src="/logo.svg" className={styles.logo} alt="logo" />
        <Timer />
      </header>
    </div>
  )
}

export default IndexPage
