const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    mode: 'personal' | 'business';
    avatar_url?: string;
}

export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string;
    date: string;
    receipt_url?: string;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    type: 'income' | 'expense' | 'both';
}

export interface Report {
    id: string;
    type: string;
    period_start: string;
    period_end: string;
    file_url: string;
    generated_at: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

// Helper function
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'An error occurred');
    }

    return data;
}

// Auth API
export const authApi = {
    async register(email: string, password: string, name: string, mode: 'personal' | 'business' = 'personal'): Promise<AuthResponse> {
        const data = await fetchApi<{ success: true; data: AuthResponse }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, mode }),
        });

        // Store tokens
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        return data.data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const data = await fetchApi<{ success: true; data: AuthResponse }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        // Store tokens
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        return data.data;
    },

    async refresh(): Promise<{ access_token: string }> {
        const refreshToken = localStorage.getItem('refresh_token');
        const data = await fetchApi<{ success: true; data: { access_token: string } }>('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        localStorage.setItem('access_token', data.data.access_token);
        return data.data;
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    getUser(): User | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    },
};

// User API
export const userApi = {
    async getProfile(): Promise<User> {
        const data = await fetchApi<{ success: true; data: User }>('/api/users/me');
        return data.data;
    },

    async updateProfile(updates: Partial<User>): Promise<User> {
        const data = await fetchApi<{ success: true; data: User }>('/api/users/me', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        return data.data;
    },
};

// Transactions API
export const transactionsApi = {
    async list(params?: { type?: string; category?: string; start_date?: string; end_date?: string }): Promise<Transaction[]> {
        const queryParams = new URLSearchParams();
        if (params?.type) queryParams.append('type', params.type);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.start_date) queryParams.append('start_date', params.start_date);
        if (params?.end_date) queryParams.append('end_date', params.end_date);

        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const data = await fetchApi<{ success: true; data: Transaction[] }>(`/api/transactions${query}`);
        return data.data;
    },

    async create(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
        const data = await fetchApi<{ success: true; data: Transaction }>('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction),
        });
        return data.data;
    },

    async get(id: string): Promise<Transaction> {
        const data = await fetchApi<{ success: true; data: Transaction }>(`/api/transactions/${id}`);
        return data.data;
    },

    async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
        const data = await fetchApi<{ success: true; data: Transaction }>(`/api/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        return data.data;
    },

    async delete(id: string): Promise<void> {
        await fetchApi(`/api/transactions/${id}`, { method: 'DELETE' });
    },

    async getSummary(): Promise<{ total_income: number; total_expense: number; balance: number }> {
        const data = await fetchApi<{ success: true; data: { total_income: number; total_expense: number; balance: number } }>('/api/transactions/summary');
        return data.data;
    },
};

// Categories API
export const categoriesApi = {
    async list(): Promise<Category[]> {
        const data = await fetchApi<{ success: true; data: Category[] }>('/api/categories');
        return data.data;
    },

    async create(category: Omit<Category, 'id'>): Promise<Category> {
        const data = await fetchApi<{ success: true; data: Category }>('/api/categories', {
            method: 'POST',
            body: JSON.stringify(category),
        });
        return data.data;
    },
};

// Reports API
export const reportsApi = {
    async list(): Promise<Report[]> {
        const data = await fetchApi<{ success: true; data: Report[] }>('/api/reports');
        return data.data;
    },

    async generate(type: string, startDate: string, endDate: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Report> {
        const data = await fetchApi<{ success: true; data: Report }>('/api/reports', {
            method: 'POST',
            body: JSON.stringify({
                type,
                period_start: startDate,
                period_end: endDate,
                format,
            }),
        });
        return data.data;
    },

    async get(id: string): Promise<Report> {
        const data = await fetchApi<{ success: true; data: Report }>(`/api/reports/${id}`);
        return data.data;
    },
};

// AI API
export const aiApi = {
    async scanReceipt(imageUrl: string): Promise<{
        vendor: string;
        date: string;
        total: number;
        items: { name: string; price: number }[];
        confidence: number;
    }> {
        const data = await fetchApi<{ success: true; data: any }>('/api/ocr/scan', {
            method: 'POST',
            body: JSON.stringify({ image_url: imageUrl }),
        });
        return data.data;
    },

    async chat(message: string, history?: { role: string; content: string }[]): Promise<{ response: string }> {
        const data = await fetchApi<{ success: true; data: { response: string } }>('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message, history }),
        });
        return data.data;
    },

    async categorize(description: string): Promise<{ category: string; confidence: number }> {
        const data = await fetchApi<{ success: true; data: { category: string; confidence: number } }>('/api/ai/categorize', {
            method: 'POST',
            body: JSON.stringify({ description }),
        });
        return data.data;
    },
};

// Dashboard API
export const dashboardApi = {
    async getSummary(): Promise<{
        total_balance: number;
        total_income: number;
        total_expense: number;
        savings_rate: number;
        recent_transactions: Transaction[];
        category_breakdown: { name: string; amount: number; percentage: number }[];
    }> {
        const data = await fetchApi<{ success: true; data: any }>('/api/dashboard/summary');
        return data.data;
    },
};

// File Upload API
export const uploadApi = {
    async getPresignedUrl(filename: string, contentType: string): Promise<{ upload_url: string; file_url: string }> {
        const data = await fetchApi<{ success: true; data: { upload_url: string; file_url: string } }>('/api/upload/presign', {
            method: 'POST',
            body: JSON.stringify({ filename, content_type: contentType }),
        });
        return data.data;
    },

    async uploadFile(file: File): Promise<string> {
        const { upload_url, file_url } = await this.getPresignedUrl(file.name, file.type);

        await fetch(upload_url, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        return file_url;
    },
};
