import { useLoginContext } from '../context/login-state'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const Home = () => {
  const loginState = useLoginContext()
  const router = useRouter()
  const [transactions, setTransactions] = useState([])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const form = new FormData(event.target)
    const formData = Object.fromEntries(form.entries())

    console.log(formData)

    setTransactions(prev => [...prev, { text: 'New valid transaction', valid: false }])
  }

  /*useEffect(() => {
    if (!loginState.user)
      router.push('/login')
  }, [])*/

  return (
    <div className="container">
      <div className="component">
        <div className="title">HOME</div>
        <form onSubmit={handleSubmit} className="form-transaction">
          <input name="otcode" type="text" className="form-control" placeholder="one-time-code.." />
          <button className="btn btn-primary">Validate Transaction</button>
        </form>
        {transactions.length > 0 && (
          <>
            <h5>Transactions in this session:</h5>
            <ul>
              {transactions.map(t => (
                <li style={{ color: t.valid ? 'green' : 'red' }}>{t.text}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default Home
