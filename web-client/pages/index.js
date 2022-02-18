import Head from 'next/head'
import { useState } from 'react'
import styles from '../styles/Home.module.css'
import { sha256 } from '../utils/hashing'

const basePath = 'http://localhost:3030/api'

export default function Home() {
  const [transactions, setTransactions] = useState([])

  async function handleRequestBinding(event) {
    event.preventDefault()

    const form = new FormData(event.target)
    const { deviceId, nonce } = Object.fromEntries(form.entries())

    try {
      const comValue = await sha256(deviceId + nonce)

      console.log('com value', comValue)

      const body = JSON.stringify({ deviceId, comValue })

      await fetch(`${basePath}/request-binding`, {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST'
      })
      alert("OK")
    } catch (error) {
      console.log(error)
      alert(error)
    }
  }

  async function handleValidateTransaction(event) {
    event.preventDefault()

    const form = new FormData(event.target)
    const { otcode } = Object.fromEntries(form.entries())

    try {
      const res = await fetch(`${basePath}/get-device/00001`)
      const resJson = await res.json()

      const codeHash = await sha256(otcode)
      const devCode = resJson.Codes.find(code => code.Hash === codeHash)

      const time = Date.now()
      const timeString = new Date(time).toLocaleTimeString()
      const transactionEntry = { key: time }
      if (devCode) {
        if (time <= parseInt(devCode.ExpirationTime)) {
          transactionEntry.valid = true
          transactionEntry.text = `Valid transaction at ${timeString}`
        } else {
          transactionEntry.valid = false
          transactionEntry.text = `Invalid transaction with code ${otcode} at ${timeString}, Code Expired`
        }
      } else {
        transactionEntry.valid = false
        transactionEntry.text = `Invalid transaction with code ${otcode} at ${timeString}, Invalid Code`
      }

      setTransactions(prev => [transactionEntry, ...prev])
    } catch (error) {
      console.log(error)
      alert(error)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Arduino Auth PoC</title>
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>Welcome!</h1>
        <hr />
        <h1>Request binding for device</h1>
        <form onSubmit={handleRequestBinding} className={styles.bindingForm}>
          <input name="deviceId" type="text" className="form-control" placeholder="Insert Device Id" />
          <input name="nonce" type="text" className="form-control" placeholder="Insert Nonce" />
          <button className="btn btn-primary">Confirm</button>
        </form>
        <hr />
        <hr />
        <h1>Validate transaction</h1>
        <form onSubmit={handleValidateTransaction} className={styles.bindingForm}>
          <input name="otcode" type="text" className="form-control" placeholder="Insert One-Time Code" />
          <button className="btn btn-primary">Confirm</button>
        </form>
        {transactions.length > 0 && (
          <div className={styles.transactions}>
            <h4>Transactions in this session:</h4>
            <ul>
              {transactions.map(t => (
                <li key={t.key} style={{ color: t.valid ? 'green' : 'red' }}>{t.text}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  )
}
