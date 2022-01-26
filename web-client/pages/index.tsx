import type { NextPage } from 'next'
import { useLoginContext } from '../context/login-state'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const Home: NextPage = () => {
  const loginState = useLoginContext()
  const router = useRouter()

  useEffect(() => {
    if (!loginState.user)
      router.push('/login')
  }, [])

  return (
    <div className="container">
      <div className="component">
        <div className="title">HOME</div>
      </div>
    </div>
  )
}

export default Home
