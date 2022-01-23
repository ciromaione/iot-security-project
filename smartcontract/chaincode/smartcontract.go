package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type User struct {
	UserName       string  `json:"UserName"`
	PwdHash        string  `json:"PwdHash"`
	IsDeviceBinded bool    `json:IsDeviceBinded`
	DevicePK       string  `json:"DevicePK"`
	Codes          []*Code `json:"Codes"`
}

type Code struct {
	Hash           string `json:"Hash"`
	ExpirationTime int32  `json:"ExpirationTime"`
}

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	pendingDevices := map[string]string{}

	pendingDevicesJSON, err := json.Marshal(pendingDevices)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState("pendingDevices", pendingDevicesJSON)
	if err != nil {
		return fmt.Errorf("Failed to initialize pending devices array")
	}

	return nil
}

func (s *SmartContract) CreateNewUser(ctx contractapi.TransactionContextInterface, username string, pwdHash string, deviceId string) error {
	// check if the user already extists
	userJSON, err := ctx.GetStub().GetState(username)
	if err != nil {
		return err
	}
	if userJSON != nil {
		return fmt.Errorf("User %s already registered", username)
	}

	// add device in the pending pool
	pendingDevicesJSON, err := ctx.GetStub().GetState("pendingDevices")
	if err != nil {
		return err
	}
	var pendingDevices map[string]string
	if pendingDevicesJSON == nil {
		pendingDevices = map[string]string{}
	} else {
		json.Unmarshal(pendingDevicesJSON, &pendingDevices)
	}
	pendingDevices[username] = deviceId
	pendingDevicesJSON, err = json.Marshal(pendingDevices)
	if err != nil {
		return err
	}
	err = ctx.GetStub.PutState("pendingDevices", pendingDevicesJSON)

	// add user to world state
	user := User{
		UserName:       username,
		PwdHash:        pwdHash[:],
		IsDeviceBinded: false,
		DevicePK:       "",
		Codes:          []*Code{},
	}

	userJSON, err = json.Marshal(user)
	if err != nil {
		return err
	}

	err = ctx.GetStub.PutState(username, userJSON)
	if err != nil {
		return fmt.Errorf("Failed update world state: %v", err)
	}

	return nil
}

func (s *SmartContract) GetUser(ctx contractapi.TransactionContextInterface, username string) (*User, error) {
	userJSON, err := ctx.GetStub.GetState(username)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state: %v", err)
	}
	if userJSON == nil {
		return nil, fmt.Errorf("User %s does not exists")
	}

	var user User
	err = json.Unmarshal(userJSON, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *SmartContract) BindDevice(ctx contractapi.TransactionContextInterface) error {

	return nil
}

func (s *SmartContract) AddNewCode(ctx contractapi.TransactionContextInterface) error {

	return nil
}

func (s *SmartContract) VerifyCode(ctx contractapi.TransactionContextInterface) error {

	return nil
}
