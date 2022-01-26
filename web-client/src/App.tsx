import React, { useState } from 'react'
import { User } from './types';
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'

function App() {
  const [user, setUser] = useState<User | null>(null)

  if(user == null) return <LoginPage setUser={setUser} />
  return <HomePage user={user} />
}

export default App;
