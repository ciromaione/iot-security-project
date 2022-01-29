package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type User struct {
	UserName      string  `json:"UserName"`
	PwdHash       string  `json:"PwdHash"`
	IsDeviceBound bool    `json:"IsDeviceBound"`
	DevicePK      string  `json:"DevicePK"`
	Codes         []*Code `json:"Codes"`
}

type Code struct {
	Hash           string `json:"Hash"`
	ExpirationTime int32  `json:"ExpirationTime"`
}

const pendingDevicesName string = "pendingDevices"

func (s *SmartContract) CreateNewUser(ctx contractapi.TransactionContextInterface, username string, pwdHash string, deviceId string) error {
	// check if the user already extists
	userJSON, err := ctx.GetStub().GetState(username)
	if err != nil {
		return err
	}
	if userJSON != nil {
		return fmt.Errorf("User %s already registered", username)
	}

	// add device in pending state
	pendingDevicesJSON, err := ctx.GetStub().GetState(pendingDevicesName)
	if err != nil {
		return err
	}
	var pendingDevices map[string]string
	if pendingDevicesJSON == nil {
		pendingDevices = map[string]string{}
	} else {
		json.Unmarshal(pendingDevicesJSON, &pendingDevices)
	}
	pendingDevices[deviceId] = username
	pendingDevicesJSON, err = json.Marshal(pendingDevices)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(pendingDevicesName, pendingDevicesJSON)

	// add user to world state
	user := User{
		UserName:      username,
		PwdHash:       pwdHash[:],
		IsDeviceBound: false,
		DevicePK:      "",
		Codes:         []*Code{},
	}

	userJSON, err = json.Marshal(user)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(username, userJSON)
	if err != nil {
		return fmt.Errorf("Failed update world state: %v", err)
	}

	return nil
}

func (s *SmartContract) GetUser(ctx contractapi.TransactionContextInterface, username string) (*User, error) {
	userJSON, err := ctx.GetStub().GetState(username)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state: %v", err)
	}
	if userJSON == nil {
		return nil, fmt.Errorf("User %s does not exists", username)
	}

	var user User
	err = json.Unmarshal(userJSON, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *SmartContract) BindDevice(ctx contractapi.TransactionContextInterface, deviceId string, pk string) (string, error) {
	// check if device is in pending
	pendingDevicesJSON, err := ctx.GetStub().GetState(pendingDevicesName)
	if err != nil {
		return "", fmt.Errorf("Failed to read from world state: %v", err)
	}
	if pendingDevicesJSON == nil {
		return "", fmt.Errorf("Device %s isn't in pending devices", deviceId)
	}
	var pendingDevices map[string]string
	err = json.Unmarshal(pendingDevicesJSON, &pendingDevices)
	if err != nil {
		return "", err
	}
	username, ok := pendingDevices[deviceId]
	if !ok {
		return "", fmt.Errorf("Device %s isn't in pending devices", deviceId)
	}

	// check if the user need to be bound
	userJSON, err := ctx.GetStub().GetState(username)
	if err != nil {
		return "", fmt.Errorf("Failed to read from world state: %v", err)
	}
	if userJSON == nil {
		return "", fmt.Errorf("User %s does not exists", username)
	}
	var user User
	err = json.Unmarshal(userJSON, &user)
	if err != nil {
		return "", err
	}
	if user.IsDeviceBound {
		return "", fmt.Errorf("User %s already bound to a device", username)
	}

	// update user state
	user.IsDeviceBound = true
	user.DevicePK = pk
	userJSON, err = json.Marshal(user)
	if err != nil {
		return "", err
	}
	err = ctx.GetStub().PutState(username, userJSON)
	if err != nil {
		return "", err
	}

	// remove device from binding state
	delete(pendingDevices, deviceId)
	pendingDevicesJSON, err = json.Marshal(pendingDevices)
	if err != nil {
		return "", err
	}
	err = ctx.GetStub().PutState(pendingDevicesName, pendingDevicesJSON)
	if err != nil {
		return "", err
	}

	return username, nil
}

func (s *SmartContract) AddNewCode(ctx contractapi.TransactionContextInterface, username string, hashCode string, sign string, expiratingTime int32) error {
	// check user existence
	userJSON, err := ctx.GetStub().GetState(username)
	if err != nil {
		return fmt.Errorf("Failed to read from world state: %v", err)
	}
	if userJSON == nil {
		return fmt.Errorf("User %s does not exists", username)
	}
	var user User
	if err = json.Unmarshal(userJSON, &user); err != nil {
		return err
	}
	if !user.IsDeviceBound {
		return fmt.Errorf("Device is not bound to user %s", username)
	}

	// check the code sign
	// todo

	// add code to user state
	newCode := Code{
		Hash:           hashCode,
		ExpirationTime: expiratingTime,
	}
	user.Codes = append(user.Codes, &newCode)
	userJSON, err = json.Marshal(user)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(username, userJSON)
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
