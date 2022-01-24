import express from 'express'
import getChaincodeGateway from './contract-gateway'

const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

getChaincodeGateway()
    .then(ccGateway => {
        app.post('/api/create-user', (req, res) => {
            const { username, pwdHash, deviceId } = req.body

            ccGateway.createUser(username, pwdHash, deviceId)
                .then(() => {
                    res.status(200).send('User created!')
                })
                .catch(e => {
                    res.status(500).json({ error: 'Server error', reason: e })
                })
        })
        
        app.get('/api/get-user/:username', (req, res) => {
            const username = req.params.username

            ccGateway.getUser(username)
                .then(user => {
                    if(!user) {
                        res.status(404).json({ error: 'User does not exists' })
                    }
                    res.json(user)
                })
                .catch(e => {
                    res.status(500).json({ error: 'Server error', reason: e })
                })
        })
        
        app.post('/api/bind-device', (req, res) => {
            const { deviceId, pk } = req.body

            ccGateway.bindDevice(deviceId, pk)
                .then(username => {
                    if(!username) {
                        res.status(404).json({ error: 'Impossible binding' })
                    }
                    res.json({ username })
                })
                .catch(e => {
                    res.status(500).json({ error: 'Server error', reason: e })
                })
        })
        
        app.post('/api/add-new-code', (req, res) => {
            const { username, hashCode, sign, expirationTime } = req.body

            ccGateway.addNewCode(username, hashCode, sign, expirationTime)
                .then(() => {
                    res.status(200).send('Code added!')
                })
                .catch(e => {
                    res.status(500).json({ error: 'Server error', reason: e })
                })
        })
        
        app.listen(port, () => {
            console.log(`Server started at port ${port}!`)
        })
    })
    .catch(e => console.log('Failed to load gateway', e))