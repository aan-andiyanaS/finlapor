package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Test hash from database
	hash := "$2a$10$7AXSUNPulYqfqHHZPUFlIe00dJDFSXo3v1Hs/PlI.zYVTTonApglG"
	password := "demo123"

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		fmt.Println("FAILED:", err)
	} else {
		fmt.Println("SUCCESS: Password matches!")
	}
}
