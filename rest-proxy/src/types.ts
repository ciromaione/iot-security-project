export interface Device {
    Id: string
	PubK: string
	Codes: [Code]
}

export interface Code {
    Hash: string
	ExpirationTime: number
}