# Proof of concept of an authentication protocol using arduino and distributed ledger technology

This project was been realized for the "IoT Security" course at Unisa.

The focus of this project was the attempt to create a simple authentication protocol, to validate single transactions within a larger context, that would allow the use of a physical device for the generation of one-time passwords and make them available in a distributed environment tanks to Distributed Ledger Technology (DLT).

An example scenario could be a digital Bank that wants to provide its users with an additional method to validate monetary transactions combined with classic authentication. Every time a user has to make a payment or send money, he can request a new code, access his banking system with classic authentication and use the code to authorize the transaction.

### How the protocol works

There are two phases:

1. The **binding phase**, that allows the user to bind the device (which has a unique id) with his already existing account/identity

2. The **otp request/validation phase**, every time a user want to validate a transaction, he request a new token which can be verified by a third party

###### Binding phase

<img src="https://lh3.googleusercontent.com/r1u1JmVPM6xz9Dju-QUx2gBJQafcgkeXcYeCV6ZfWGlCPre0VVY43SJDpjByljW4yDLcm5q-kjrzUpUxub_ug_D9HH4kTF6T2ckrr-28tsa60V-HXRWf9jBK1Mr6Nhau1rzjMWOCjbKq" title="" alt="" data-align="center">

###### OTP request/validation phase

![](https://lh6.googleusercontent.com/KWBCmIvzU5Zif-iWf4OrMeD1Z-MW9eoxgzSXLQhM7CwUbTtVZXPETp26pMhd1qdLJyKv4MiUjEfVYRNM_qA-_Q4BMW0GcHOPOGYX7FdqKLZalhDR50X4GAfpfpdekBjK361NSulRbHr0)

#### PoC Architecture

![](https://lh5.googleusercontent.com/O9I7gPjtr0UcKCgi8_iXsDCvqGHCoTgVyHI8Z_QYoojsbkwTnMbN9TZdv3CsAJ1LLAQqdW_YRBrPvz4QHdBOyEjQi77_kZ6vx8IMu9yVHxiR17Hd3oxSQ2o-RNnhLsulUZPZmPoyy1EB)

### Modules

1. **Arduino device**
   
   ![](https://lh3.googleusercontent.com/EmC6ZoPBo3G39rOlXcazDiSuq4VG9WXfNNifX4wMGpSn71Q0SSbsfUdJlFKxBLZ_5Pr2MDQdqLJKn46S_5SlT0EYmaxIiN3PazCGe1ywGSvvWw4EfTuIS8saG1c1DUEe8epj-7QeRrPQ)
   
   1. the bluetooth module is used to send serial data like the public key or the otp digest;
   
   2. the LCD display is used to show information to the user, like the nonce and the new random otp;
   
   3. the button is used to finalize the binding and after that to request a new otp.

2. **“authProtocol” smart contract**
   
   ![](https://lh5.googleusercontent.com/0wfSaM5u4tcrvxBj5FdYjkaq_yL2eId2ajsX6Kc7kNKtAJwSfkxnMHDQZRTx22snan70MPqiVcrJRM56rU7K3A9HQUv09SrU1V939ur4-gB6cxAb48PJlMdO_tADr2Kl_44BVbefQqWl)
   
   ![](https://lh4.googleusercontent.com/h2YIuzvMCR63VM7_X0jota5hctjhkoZKDFQFWOKZnl4Z1BcRrLTAhuDm6QxEayBAWH63JoQE63UljrtmnB0Tbch9QAjzVyDhNVa9ITfCMbakb6PVko2hO3jWX3znbgFjecv_JamX9nQq)
   
   - the **RequestBinding** function adds to the list of pending devices in the state the device id and the challenge;
   
   - the **FinalizeBinding** function checks if the device is in pending state and if the nonce verify the challenge, in that case a new Device is created and the device id is removed from the pending list;
   
   - the **GetDevice** function returns a device from the current state by the device id;
   
   - the **AddNewCode** function checks if the sign is valid for the hashCode string, if this is true add the hashCode in the code list of the device.

3. **Web Client for testing**
   
   ![](https://lh6.googleusercontent.com/dTw_hVbghHp4qx5tdGQChi-g7As9QqIh-0gouQRg-39z2NpISemM4Q19a0yfDOJ7JoeVQ-62LxmRxADUq_X4oUKBf1wIdu5gW1d2xRFpQL2bTG8zfQHjoDqPZaAFAbFuw-Dk7axK2gjV)
   
   For testing the protocol a simple web client has been realized:
   
   1. the first form accomplish the binding phase, it creates the challenge calculating the Hash of the concatenation of the device Id and the nonce;
   
   2. the second form gets the device codes from the blockchain and check if there is a code digest, not yet expired, which is equal to the Hash of the inserted code;
   
   3. all simulated transactions are showed as a dotted list.

### Cryptographic algorithms

- The algorithm chosen for Hashing was **SHA256**, which is a large used hash function and produces a 256 bit digest.

- The algorithm chosen for the digital signature was **ED25519**, a less popular choice, it is designed to be faster than existing digital signature schemes without sacrificing security. It uses elliptic curve over a finite field. The public and private key are 256 bit long and the produced signature has a length of 512 bit.

## Usage

To try this PoC you need to install an **Hyperledger Fabric** test network, following this  [guide](https://hyperledger-fabric.readthedocs.io/en/latest/test_network.html). After you have installed all dependencies and cloned the `fabric-samples` repo, you can start the test network and deploy the smart contract using the script `network.sh` in the fabric-samples:

```bash
cd [FABRIC-SAMPLES-ROOT-DIRECTIORY]/test-network
./network.sh down
./network.sh up
./network.sh createChannel -c mychannel -ca
./network.sh deployCC -ccn authProtocol -ccp [ROOT-DIR-OF-THIS-REPO]/smartcontract/authProtocol -ccl go
```

After that:

* load the sketch in your arduino device

* connect your device using bluethoot with your pc

* start the `rest-proxy` using  `npm start`

* start the `web-client`  using `npm run dev`

* start the `bluethoot-server` python script
