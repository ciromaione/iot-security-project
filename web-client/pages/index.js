import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import { sha256 } from '../utils/hashing'

const basePath = 'localhost:3030/api/'

export default function Home() {
  const [transactions, setTransactions] = useState([{ key: 1, valid: true, text: 'prova' }])

  async function handleRequestBinding(event) {
    event.preventDefault();

    const form = new FormData(event.target)
    const { deviceId, nonce } = Object.fromEntries(form.entries())

    console.log(formData)

    try {
      const comValue = await sha256(deviceId + nonce)

      console.log('com value', comValue)

      const body = JSON.stringify({ deviceId, comValue })

      await fetch(`${basePath}/request-binding`, {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    } catch (error) {
      console.log(error)
      alert(error)
    }
  }

  async function handleValidateTransaction() {}

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
