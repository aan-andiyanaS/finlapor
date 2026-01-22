package config

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

func InitRedis(redisURL string) *redis.Client {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("⚠️ Failed to parse Redis URL, using defaults: %v", err)
		opt = &redis.Options{
			Addr: "localhost:6379",
		}
	}

	rdb := redis.NewClient(opt)

	// Test connection
	ctx := context.Background()
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Printf("⚠️ Failed to connect to Redis: %v", err)
	} else {
		log.Println("✅ Connected to Redis")
	}

	return rdb
}
