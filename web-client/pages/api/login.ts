import type { NextApiRequest, NextApiResponse } from 'next'
import { basePath } from '../../routes'
import { User } from '../../types'
import { sha256 } from '../../cripto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { username, password } = req.body

    try {
        const response = await fetch(`${basePath}/get-user/${username}`)
        const resJson = await response.json()
        const user: User = resJson
        const pwdHash = await sha256(password)
        if (user.PwdHash === pwdHash) {
            res.status(200).json(user)
        } else {
            res.status(404).json({ error: "Invalid Password" })
        }
    } catch (error) {
        res.status(500).json({ error: "Server error" })
    }
}