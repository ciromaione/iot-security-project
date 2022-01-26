import Link from 'next/link'
import { useLoginContext } from '../context/login-state'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const Login = () => {
  const loginState = useLoginContext()
  const router = useRouter()

  useEffect(() => {
    if (loginState.user)
      router.push('/')
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const form = new FormData(event.target)
    const formData = Object.fromEntries(form.entries())

    console.log(formData)

    try {
      const user = await fetch('/api/login', {
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      console.log("User", user)
      if (user)
        loginState.setUser(user)
    } catch (error) {
      console.log(error)
      alert(error)
    }
  }

  return (
    <div className="container">
      <div className="component">
        <div className="title">LOGIN</div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input name="username" type="text" className="form-control" />
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input name="password" type="password" className="form-control" />
          <div className="center-div">
            <button className="btn btn-primary" type="submit">
              Conferma
            </button>
          </div>
        </form>
        <Link href="/register">Sign on</Link>
      </div>
    </div>
  )
}

export default Login