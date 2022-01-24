package main

import (
	"authprotocol/chaincode"
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func main() {
	authChaincode, err := contractapi.NewChaincode(&chaincode.SmartContract{})
	if err != nil {
		log.Panicf("Error creating auth-protocol chaincode: %v", err)
	}

	if err := authChaincode.Start(); err != nil {
		log.Panicf("Error starting auth-protocol chaincode: %v", err)
	}
}
