export interface User {
    UserName: string
	PwdHash: string
	IsDeviceBinded: boolean
	DevicePK: string
	Codes: [Code]
}

export interface Code {
    Hash: string
	ExpirationTime: number
}