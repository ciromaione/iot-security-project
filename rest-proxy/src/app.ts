import express from 'express'
import * as gateway from './contract-gateway'

const app = express()
const port = 3030

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/api/create-user', (req, res) => {
    const { username, pwdHash, deviceId } = req.body

    gateway.createUser(username, pwdHash, deviceId)
        .then(() => {
            res.status(200).send('User created!')
        })
        .catch(e => {
            console.log(e)
            res.status(500).json({ error: 'Server error', reason: e })
        })
})

app.get('/api/get-user/:username', (req, res) => {
    const username = req.params.username

    gateway.getUser(username)
        .then(user => {
            if (!user) {
                res.status(404).json({ error: 'User does not exists' })
            }
            res.json(user)
        })
        .catch(e => {
            console.log(e)
            res.status(500).json({ error: 'Server error', reason: e })
        })
})

app.post('/api/bind-device', (req, res) => {
    const { deviceId, pk } = req.body

    gateway.bindDevice(deviceId, pk)
        .then(username => {
            if (!username) {
                res.status(404).json({ error: 'Impossible binding' })
            }
            res.json({ username })
        })
        .catch(e => {
            console.log(e)
            res.status(500).json({ error: 'Server error', reason: e })
        })
})

app.post('/api/add-new-code', (req, res) => {
    const { username, hashCode, sign } = req.body

    gateway.addCode(username, hashCode, sign)
        .then(() => {
            res.status(200).send('Code added!')
        })
        .catch(e => {
            console.log(e)
            res.status(500).json({ error: 'Server error', reason: e })
        })
})

app.listen(port, () => {
    console.log(`Server started at port ${port}!`)
})
