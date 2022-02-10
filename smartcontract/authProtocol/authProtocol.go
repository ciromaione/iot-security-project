package main

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type Device struct {
	Id    string  `json:"Id"`
	PubK  string  `json:"PubK"`
	Codes []*Code `json:"Codes"`
}

type Code struct {
	Hash           string `json:"Hash"`
	ExpirationTime int64  `json:"ExpirationTime"`
}

const pendingDevicesName string = "pendingDevices"

func (s *SmartContract) RequestBinding(ctx contractapi.TransactionContextInterface, deviceId string, com string) error {
	// check if devices is already bound
	deviceJSON, err := ctx.GetStub().GetState(deviceId)
	if err != nil {
		return fmt.Errorf("Failed from world state: %v", err)
	}
	if deviceJSON != nil {
		return fmt.Errorf("Device already bound")
	}

	// check if bind request has already been done on the device
	pendingDevicesJSON, err := ctx.GetStub().GetState(pendingDevicesName)
	if err != nil {
		return fmt.Errorf("Failed from world state: %v", err)
	}
	var pendingDevices map[string]string
	if pendingDevicesJSON == nil {
		pendingDevices = map[string]string{}
	} else {
		json.Unmarshal(pendingDevicesJSON, &pendingDevices)
	}
	if _, ok := pendingDevices[deviceId]; ok {
		return fmt.Errorf("Device %s already in pending", deviceId)
	}

	// add the device in pending
	pendingDevices[deviceId] = com
	pendingDevicesJSON, err = json.Marshal(pendingDevices)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(pendingDevicesName, pendingDevicesJSON)
}

func (s *SmartContract) FinalizeBinding(ctx contractapi.TransactionContextInterface, deviceId string, nonce string, pk string) error {
	// check if device is already registered
	deviceJSON, err := ctx.GetStub().GetState(deviceId)
	if err != nil {
		return fmt.Errorf("Failed to read from world state: %v", err)
	}
	if deviceJSON != nil {
		return fmt.Errorf("Device %s is already registered", deviceId)
	}

	// check if device is in pending
	pendingDevicesJSON, err := ctx.GetStub().GetState(pendingDevicesName)
	if err != nil {
		return fmt.Errorf("Failed to read from world state: %v", err)
	}
	if pendingDevicesJSON == nil {
		return fmt.Errorf("Device %s isn't in pending devices", deviceId)
	}
	var pendingDevices map[string]string
	err = json.Unmarshal(pendingDevicesJSON, &pendingDevices)
	if err != nil {
		return err
	}
	com, ok := pendingDevices[deviceId]
	if !ok {
		return fmt.Errorf("Device %s isn't in pending devices", deviceId)
	}

	// check the com value
	data := []byte(deviceId + nonce)
	hash := sha256.Sum256(data)
	hashString := hex.EncodeToString(hash[:])
	if hashString != com {
		return fmt.Errorf("The given nonce is incorrect for device %s", deviceId)
	}

	// add the device in the state
	device := Device{
		Id:    deviceId,
		PubK:  pk,
		Codes: []*Code{},
	}
	deviceJSON, err = json.Marshal(device)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(deviceId, deviceJSON)
	if err != nil {
		return fmt.Errorf("Failed update world state: %v", err)
	}
	return nil
}

func (s *SmartContract) GetDevice(ctx contractapi.TransactionContextInterface, deviceId string) (*Device, error) {
	deviceJSON, err := ctx.GetStub().GetState(deviceId)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state: %v", err)
	}
	if deviceJSON == nil {
		return nil, fmt.Errorf("Device %s does not exists", deviceId)
	}

	var device Device
	err = json.Unmarshal(deviceJSON, &device)
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (s *SmartContract) AddNewCode(ctx contractapi.TransactionContextInterface, deviceId string, hashCode string, sign string, expirationTime string) error {
	// check device existence
	deviceJSON, err := ctx.GetStub().GetState(deviceId)
	if err != nil {
		return fmt.Errorf("Failed to read from world state: %v", err)
	}
	if deviceJSON == nil {
		return fmt.Errorf("Device %s does not exists", deviceId)
	}
	var device Device
	if err = json.Unmarshal(deviceJSON, &device); err != nil {
		return err
	}

	// check the code sign
	publicKey, err := hex.DecodeString(device.PubK)
	if err != nil {
		return err
	}
	hcBytes, err := hex.DecodeString(hashCode)
	if err != nil {
		return err
	}
	signBytes, err := hex.DecodeString(sign)
	if err != nil {
		return err
	}
	if !ed25519.Verify(publicKey, hcBytes, signBytes) {
		return fmt.Errorf("The code doesn't have a valid sign")
	}

	et, err := strconv.ParseInt(expirationTime, 10, 64)
	if err != nil {
		return fmt.Errorf("Invalid expiration time %s", expirationTime)
	}

	// add code to device state
	newCode := Code{
		Hash:           hashCode,
		ExpirationTime: et,
	}
	device.Codes = append(device.Codes, &newCode)
	deviceJSON, err = json.Marshal(device)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(deviceId, deviceJSON)
}

func main() {
	authChaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating auth-protocol chaincode: %v", err)
	}

	if err := authChaincode.Start(); err != nil {
		log.Panicf("Error starting auth-protocol chaincode: %v", err)
	}
}
