import express from 'express'
import cors from 'cors'
import * as gateway from './contract-gateway'

const app = express()
const port = 3030

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/api/request-binding', (req, res) => {
    const { deviceId, comValue } = req.body
    
    gateway.requestBinding(deviceId, comValue)
        .then(() => res.status(200).send('ok!'))
        .catch(e => {
            console.log(e)
            res.status(500).json({ error: 'Server error', reason: e })
        })
})

app.get('/api/get-device/:devId', (req, res) => {
    const devId = req.params.devId

    gateway.getDevice(devId)
        .then(device => {
            if (!device) {
                res.status(404).json({ error: 'Device does not exists' })
            }
            res.json(device)
        })
        .catch(e => {
            console.log(e)
            res.status(500).json({ error: 'Server error', reason: e })
        })
})

app.post('/api/finalize-binding', (req, res) => {
    const { deviceId, nonce, pk } = req.body

    gateway.finalizeBinding(deviceId, nonce, pk)
        .then(() => res.status(200).send('ok!'))
        .catch(e => {
            console.log(e)
            res.status(500).json({ error: 'Server error', reason: e })
        })
})

app.post('/api/add-new-code', (req, res) => {
    const { devId, hashCode, sign } = req.body

    gateway.addCode(devId, hashCode, sign)
        .then(() => res.status(200).send('ok!'))
        .catch(e => {
            console.log(e)
            res.status(500).json({ error: 'Server error', reason: e })
        })
})

app.listen(port, () => {
    console.log(`Server started at port ${port}!`)
})
