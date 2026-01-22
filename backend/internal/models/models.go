package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Email        string    `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	Name         string    `json:"name" gorm:"not null"`
	Mode         string    `json:"mode" gorm:"default:'personal'"`
	AvatarURL    *string   `json:"avatar_url"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Category struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    *uuid.UUID `json:"user_id" gorm:"type:uuid;index"`
	Name      string     `json:"name" gorm:"not null"`
	Type      string     `json:"type" gorm:"not null"` // income, expense
	Icon      *string    `json:"icon"`
	Color     *string    `json:"color"`
	IsDefault bool       `json:"is_default" gorm:"default:false"`
	CreatedAt time.Time  `json:"created_at"`
}

type Transaction struct {
	ID                uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID            uuid.UUID  `json:"user_id" gorm:"type:uuid;index;not null"`
	CategoryID        *uuid.UUID `json:"category_id" gorm:"type:uuid;index"`
	Category          *Category  `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Type              string     `json:"type" gorm:"not null"` // income, expense
	Amount            float64    `json:"amount" gorm:"type:decimal(15,2);not null"`
	Description       *string    `json:"description"`
	Date              time.Time  `json:"date" gorm:"type:date;not null;index"`
	ReceiptURL        *string    `json:"receipt_url"`
	IsRecurring       bool       `json:"is_recurring" gorm:"default:false"`
	RecurringInterval *string    `json:"recurring_interval"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type Report struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID      uuid.UUID `json:"user_id" gorm:"type:uuid;index;not null"`
	Type        string    `json:"type" gorm:"not null"`
	PeriodStart time.Time `json:"period_start" gorm:"type:date;not null"`
	PeriodEnd   time.Time `json:"period_end" gorm:"type:date;not null"`
	FileURL     *string   `json:"file_url"`
	GeneratedAt time.Time `json:"generated_at"`
}

type RefreshToken struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;index;not null"`
	Token     string    `json:"token" gorm:"uniqueIndex;not null"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatHistory struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;index;not null"`
	Message   string    `json:"message" gorm:"not null"`
	Role      string    `json:"role" gorm:"not null"` // user, assistant
	CreatedAt time.Time `json:"created_at"`
}

type Budget struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	UserID     uuid.UUID  `json:"user_id" gorm:"type:uuid;index;not null"`
	CategoryID uuid.UUID  `json:"category_id" gorm:"type:uuid;index;not null"`
	Amount     float64    `json:"amount" gorm:"type:decimal(15,2);not null"`
	Period     string     `json:"period" gorm:"default:'monthly'"`
	StartDate  time.Time  `json:"start_date" gorm:"type:date;not null"`
	EndDate    *time.Time `json:"end_date" gorm:"type:date"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}
