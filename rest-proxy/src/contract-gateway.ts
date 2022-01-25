import * as grpc from '@grpc/grpc-js'
import { connect, Contract, Gateway, Identity, Signer, signers } from '@hyperledger/fabric-gateway'
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util'
import { User } from './types';

const channelName = 'mychannel'
const chaincodeName = 'authProtocol2'
const mspId = 'Org1MSP'

const cryptoPath = '/home/ciro/go/src/github.com/ciromaione/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com'
const keyDirectoryPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore')
const certPath = path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'User1@org1.example.com-cert.pem')
const tlsCertPath = path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')
const peerEndpoint = 'localhost:7051'

const utf8Decoder = new TextDecoder()

let contract: Contract | null = null

async function getContract(): Promise<Contract | null> {
    if(contract === null) await createContract()
    return contract
}

async function createContract(): Promise<void> {
    const client = await newGrpcConnection()

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 } // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 } // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 } // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 } // 1 minute
        },
    })

    const network = gateway.getNetwork(channelName)
    contract = network.getContract(chaincodeName)
}

async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath)
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert)
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': 'peer0.org1.example.com'
    })
}

async function newIdentity(): Promise<Identity> {
    const credentials = await fs.readFile(certPath)
    return { mspId, credentials }
}

async function newSigner(): Promise<Signer> {
    const files = await fs.readdir(keyDirectoryPath)
    const keyPath = path.resolve(keyDirectoryPath, files[0])
    const privateKeyPem = await fs.readFile(keyPath)
    const privateKey = crypto.createPrivateKey(privateKeyPem)
    return signers.newPrivateKeySigner(privateKey)
}

async function getUser(username: string): Promise<User> {
    const contract = await getContract()
    console.log('Evaluate Transaction: GetUser')
    const resultBytes = await contract?.evaluateTransaction('GetUser', username)
    const resultJson = utf8Decoder.decode(resultBytes)
    const result = JSON.parse(resultJson)
    console.log('*** Result:', result)
    return result
}

async function createUser(username: string, pwdHash: string, deviceId: string): Promise<void> {
    const contract = await getContract()
    console.log('Submit Transaction: CreateNewUser')
    await contract?.submitTransaction('CreateNewUser', username, pwdHash, deviceId)
    console.log('*** Transaction committed successfully')
}

async function bindDevice(deviceId: string, pk: string): Promise<string> {
    const contract = await getContract()
    console.log('Submit Transaction: BindDevice')
    const resultBytes = await contract?.submitTransaction('BindDevice', deviceId, pk)
    const result = utf8Decoder.decode(resultBytes)
    console.log('*** Result:', result)
    return result
}

async function addCode(username: string, hashCode: string, sign: string, expirationTime: string): Promise<void> {
    const contract = await getContract()
    console.log('Submit Transaction: AddNewCode')
    await contract?.submitTransaction('AddNewCode', username, hashCode, sign, expirationTime)
    console.log('*** Transaction committed successfully')
}

export { getUser, createUser, bindDevice, addCode }