import Link from 'next/link'
import { basePath } from '../routes'
import { sha256 } from '../cripto'
import { useLoginContext } from '../context/login-state'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const Register = () => {
  const loginState = useLoginContext()
  const router = useRouter()

  useEffect(() => {
    if (loginState.user)
      router.push('/')
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = new FormData(event.target)
    const formData = Object.fromEntries(form.entries())

    console.log(formData)

    try {
      const pwdHash = await sha256(formData.password)

      console.log('pwdHash', pwdHash)

      const body = JSON.stringify({
        username: formData.username,
        pwdHash,
        deviceId: formData.deviceId
      })

      await fetch(`${basePath}/create-user`, {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    } catch (error) {
      alert(error)
    }
  }

  return (
    <div className="container">
      <div className="component">
        <div className="title">SIGN ON</div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input name="username" type="text" className="form-control" />
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input name="password" type="password" className="form-control" />
          <label htmlFor="deviceId" className="form-label">
            DeviceId
          </label>
          <input name="deviceId" type="text" className="form-control" />
          <div className="center-div">
            <button className="btn btn-primary" type="submit">
              Confirm
            </button>
          </div>
        </form>
        <Link href="/login">Login</Link>
      </div>
    </div>
  )
}

export default Register