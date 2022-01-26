import React, { Dispatch, SetStateAction } from 'react'
import { User } from '../../types'

interface LoginPageProps {
    setUser: Dispatch<SetStateAction<User | null>>
}

function LoginPage({ setUser }: LoginPageProps) {
    return (
        <div className="container">
            
        </div>
    )
}

export default LoginPage