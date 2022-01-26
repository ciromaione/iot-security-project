import '../styles/globals.css'
import type { AppProps } from 'next/app'
import 'bootstrap/dist/css/bootstrap.css'
import { LoginContextProvider } from '../context/login-state'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LoginContextProvider>
      <Component {...pageProps} />
    </LoginContextProvider>
  )
}

export default MyApp
