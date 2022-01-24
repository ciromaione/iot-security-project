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
	IsDeviceBinded bool    `json:"IsDeviceBinded"`
	DevicePK       string  `json:"DevicePK"`
	Codes          []*Code `json:"Codes"`
}

type Code struct {
	Hash           string `json:"Hash"`
	ExpirationTime int32  `json:"ExpirationTime"`
}

const pendingDevicesName string = "pendingDevices"

func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	pendingDevices := map[string]string{}

	pendingDevicesJSON, err := json.Marshal(pendingDevices)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(pendingDevicesName, pendingDevicesJSON)
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

func (s *SmartContract) BindDevice(ctx contractapi.TransactionContextInterface, deviceId string, pk string) (*string, error) {
	// check if device is in pending
	pendingDevicesJSON, err := ctx.GetStub().GetState(pendingDevicesName)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state: %v", err)
	}
	if pendingDevicesJSON == nil {
		return nil, fmt.Errorf("Device %s isn't in pending devices", deviceId)
	}
	var pendingDevices map[string]string
	err = json.Unmarshal(pendingDevicesJSON, &pendingDevices)
	if err != nil {
		return nil, err
	}
	username, ok := pendingDevices[deviceId]
	if !ok {
		return nil, fmt.Errorf("Device %s isn't in pending devices", deviceId)
	}

	// check if the user need to be binded
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
	if user.IsDeviceBinded {
		return nil, fmt.Errorf("User %s already binded to a device", username)
	}

	// update user state
	user.IsDeviceBinded = true
	user.DevicePK = pk
	userJSON, err = json.Marshal(user)
	if err != nil {
		return nil, err
	}
	err = ctx.GetStub().PutState(username, userJSON)
	if err != nil {
		return nil, err
	}

	// remove device from binding state
	delete(pendingDevices, deviceId)
	pendingDevicesJSON, err = json.Marshal(pendingDevices)
	if err != nil {
		return nil, err
	}
	err = ctx.GetStub().PutState(pendingDevicesName, pendingDevicesJSON)
	if err != nil {
		return nil, err
	}

	return &username, nil
}

func (s *SmartContract) AddNewCode(ctx contractapi.TransactionContextInterface, username string, hashCode string, sign string, expiratinoTime int32) error {
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
	if !user.IsDeviceBinded {
		return fmt.Errorf("Device is not binded to user %s", username)
	}

	// check the code sign
	// todo

	// add code to user state
	newCode := Code{
		Hash:           hashCode,
		ExpirationTime: expiratinoTime,
	}
	user.Codes = append(user.Codes, &newCode)
	userJSON, err = json.Marshal(user)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(username, userJSON)
}
