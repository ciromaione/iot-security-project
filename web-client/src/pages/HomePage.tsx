import React from 'react'
import { User } from '../types'

interface HomePageProps {
    user: User
}

function HomePage({ user }: HomePageProps) {
    return <div>Login</div>
}

export default HomePage