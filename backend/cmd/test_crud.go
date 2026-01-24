package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/joho/godotenv"
	"github.com/yourusername/finlapor/backend/internal/config"
	"github.com/yourusername/finlapor/backend/internal/models"
)

func main() {
	godotenv.Load()
	cfg := config.New()
	db, _ := config.InitDB(cfg.DatabaseURL)

	// Get demo user
	var user models.User
	db.Where("email = ?", "demo@finlapor.airi.click").First(&user)
	if user.ID.String() == "00000000-0000-0000-0000-000000000000" {
		log.Fatal("Demo user not found")
	}

	// Login to get token
	fmt.Println("=== STEP 1: LOGIN ===")
	token := login()
	if token == "" {
		log.Fatal("Failed to login")
	}
	fmt.Printf("✅ Token obtained\n\n")

	// Test CREATE
	fmt.Println("=== STEP 2: CREATE Transaction ===")
	txID := testCreate(token)
	if txID == "" {
		log.Fatal("❌ CREATE failed")
	}
	fmt.Printf("✅ CREATE success - ID: %s\n\n", txID)

	// Test READ (List)
	fmt.Println("=== STEP 3: READ Transactions ===")
	if !testRead(token) {
		log.Fatal("❌ READ failed")
	}
	fmt.Printf("✅ READ success\n\n")

	// Test UPDATE
	fmt.Println("=== STEP 4: UPDATE Transaction ===")
	if !testUpdate(token, txID) {
		log.Fatal("❌ UPDATE failed")
	}
	fmt.Printf("✅ UPDATE success\n\n")

	// Test DELETE
	fmt.Println("=== STEP 5: DELETE Transaction ===")
	if !testDelete(token, txID) {
		log.Fatal("❌ DELETE failed")
	}
	fmt.Printf("✅ DELETE success\n\n")

	fmt.Println("🎉 ALL CRUD OPERATIONS SUCCESSFUL! 🎉")
}

func login() string {
	payload := map[string]string{"email": "demo@finlapor.airi.click", "password": "demo123"}
	body, _ := json.Marshal(payload)
	resp, _ := http.Post("http://localhost:8080/api/auth/login", "application/json", bytes.NewBuffer(body))
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if data, ok := result["data"].(map[string]interface{}); ok {
		if token, ok := data["access_token"].(string); ok {
			return token
		}
	}
	return ""
}

func testCreate(token string) string {
	payload := map[string]interface{}{
		"type":        "income",
		"category_id": "00000000-0000-0000-0000-000000000000", // Will use any category
		"amount":      500000,
		"description": "CRUD Test Transaction",
		"date":        time.Now().Format("2006-01-02"),
	}

	// Get category first
	req, _ := http.NewRequest("GET", "http://localhost:8080/api/categories", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := http.DefaultClient.Do(req)
	var catResult map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&catResult)
	resp.Body.Close()

	if data, ok := catResult["data"].([]interface{}); ok && len(data) > 0 {
		if cat, ok := data[0].(map[string]interface{}); ok {
			payload["category_id"] = cat["id"]
		}
	}

	body, _ := json.Marshal(payload)
	req, _ = http.NewRequest("POST", "http://localhost:8080/api/transactions", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, _ = http.DefaultClient.Do(req)
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	fmt.Printf("Response: %s\n", string(bodyBytes))

	var result map[string]interface{}
	json.Unmarshal(bodyBytes, &result)

	if data, ok := result["data"].(map[string]interface{}); ok {
		if id, ok := data["id"].(string); ok {
			return id
		}
	}
	return ""
}

func testRead(token string) bool {
	req, _ := http.NewRequest("GET", "http://localhost:8080/api/transactions", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	if data, ok := result["data"].([]interface{}); ok {
		fmt.Printf("Found %d transactions\n", len(data))
		return true
	}
	return false
}

func testUpdate(token, id string) bool {
	payload := map[string]interface{}{
		"description": "UPDATED - CRUD Test",
		"amount":      750000,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("PUT", "http://localhost:8080/api/transactions/"+id, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()

	return resp.StatusCode == 200
}

func testDelete(token, id string) bool {
	req, _ := http.NewRequest("DELETE", "http://localhost:8080/api/transactions/"+id, nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, _ := http.DefaultClient.Do(req)
	defer resp.Body.Close()

	return resp.StatusCode == 204
}
