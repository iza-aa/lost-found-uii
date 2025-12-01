import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ==================== INTERFACES ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  identity_number: string;
  role: 'PUBLIK' | 'MAHASISWA' | 'STAFF_DOSEN' | 'ADMIN' | 'SECURITY';
  faculty?: string;
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  identity_number: string;
  role: string;
  faculty?: string;
}

// ==================== ITEM INTERFACES ====================

export interface VerificationRequest {
  question: string;
  answer: string;
}

export interface ContactRequest {
  platform: 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM' | 'LINE' | 'TWITTER' | 'EMAIL' | 'OTHER';
  value: string;
}

export interface CreateFoundItemRequest {
  title: string;
  description?: string;
  category_id: string;
  location_id: string;
  image_url?: string;
  verifications: VerificationRequest[];
  date_found: string; // YYYY-MM-DD
  return_method: 'BRING_BY_FINDER' | 'HANDED_TO_SECURITY';
  cod?: boolean;
  show_phone?: boolean;
  contacts?: ContactRequest[];
}

export interface CreateLostItemRequest {
  title: string;
  category_id: string;
  description?: string;
  location_last_seen: string;
  date_lost: string; // YYYY-MM-DD
  image_url?: string;
  urgency?: 'NORMAL' | 'HIGH' | 'CRITICAL';
  offer_reward?: boolean;
  show_phone?: boolean;
  contacts?: ContactRequest[];
}

export interface VerificationResponse {
  question: string;
}

export interface ContactResponse {
  platform: string;
  value: string;
}

export interface ItemResponse {
  id: string;
  title: string;
  type?: string; // LOST or FOUND
  category_id: string;
  category_name?: string;
  location_id?: string;
  location_name?: string;
  location_latitude?: number;
  location_longitude?: number;
  description?: string;
  image_url: string;
  verifications?: VerificationResponse[];
  status: string;
  created_at: string;
  date_lost?: string;
  date_found?: string;
  urgency?: string;
  offer_reward?: boolean;
  show_phone?: boolean;
  cod?: boolean;
  return_method?: string;
  contacts?: ContactResponse[];
  finder?: ItemUserResponse;
  owner?: ItemUserResponse;
  approved_claim?: ClaimResponse; // Claim yang sudah approved
  user_claim_status?: string; // Status claim user: PENDING, APPROVED, REJECTED
}

export interface ItemUserResponse {
  id: string;
  name: string;
  phone?: string;
  role: string;
}

export interface ClaimRequest {
  answer_input: string;
  image_url?: string;
}

export interface ClaimResponse {
  id: string;
  item_id: string;
  owner_id: string;
  answer_input: string;
  image_url?: string;
  status: string;
  created_at: string;
  claimer?: ItemUserResponse;
}

export interface DecideClaimRequest {
  status: 'APPROVED' | 'REJECTED';
}

export interface Category {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'lf_token';
  private readonly REFRESH_TOKEN_KEY = 'lf_refresh_token';
  private readonly USER_KEY = 'lf_api_user';
  
  private isBrowser: boolean;
  
  // Auth state
  private currentUserSubject = new BehaviorSubject<UserResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadUserFromStorage();
  }

  // ==================== AUTH METHODS ====================

  /**
   * Login user
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserResponse | null {
    return this.currentUserSubject.value;
  }

  // ==================== ITEM METHODS ====================

  /**
   * Get all items (found items feed)
   */
  getAllItems(): Observable<ItemResponse[]> {
    return this.http.get<ItemResponse[]>(`${this.baseUrl}/items`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Get item by ID
   */
  getItemById(itemId: string): Observable<ItemResponse> {
    return this.http.get<ItemResponse>(`${this.baseUrl}/items/${itemId}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Report found item
   */
  reportFoundItem(request: CreateFoundItemRequest): Observable<ItemResponse> {
    return this.http.post<ItemResponse>(`${this.baseUrl}/items/found`, request, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Report lost item (ad-hoc)
   */
  reportLostItem(request: CreateLostItemRequest): Observable<ItemResponse> {
    return this.http.post<ItemResponse>(`${this.baseUrl}/items/lost`, request, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Submit claim for an item
   */
  submitClaim(itemId: string, request: ClaimRequest): Observable<ClaimResponse> {
    return this.http.post<ClaimResponse>(`${this.baseUrl}/items/${itemId}/claim`, request, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Get claims for an item
   */
  getClaims(itemId: string): Observable<ClaimResponse[]> {
    return this.http.get<ClaimResponse[]>(`${this.baseUrl}/items/${itemId}/claims`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Decide claim (approve/reject)
   */
  decideClaim(claimId: string, request: DecideClaimRequest): Observable<ClaimResponse> {
    return this.http.put<ClaimResponse>(`${this.baseUrl}/claims/${claimId}/decide`, request, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // ==================== ENUMERATION METHODS ====================

  /**
   * Get all categories
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/enumerations/item-categories`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all locations
   */
  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.baseUrl}/enumerations/campus-locations`)
      .pipe(catchError(this.handleError));
  }

  // ==================== NOTIFICATION METHODS ====================

  /**
   * Get user notifications
   */
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/notifications/${notificationId}/read`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // ==================== UPLOAD METHODS ====================

  /**
   * Upload file
   */
  uploadFile(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(`${this.baseUrl}/upload`, formData, {
      headers: this.getAuthHeaders(true) // Don't set Content-Type for FormData
    }).pipe(catchError(this.handleError));
  }

  // ==================== ASSET METHODS (QR Code Flow) ====================

  /**
   * Scan asset (public)
   */
  scanAsset(assetId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/scan/${assetId}`)
      .pipe(catchError(this.handleError));
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get stored token
   */
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  private getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get auth headers
   */
  private getAuthHeaders(isFormData = false): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (!isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    return headers;
  }

  /**
   * Handle auth response (store tokens)
   */
  private handleAuthResponse(response: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh_token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    }
    this.currentUserSubject.next(response.user);
  }

  /**
   * Load user from storage
   */
  private loadUserFromStorage(): void {
    if (!this.isBrowser) return;
    
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch {
        this.logout();
      }
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Terjadi kesalahan, silakan coba lagi.';
    
    // Check for client-side error (ErrorEvent may not exist in SSR)
    if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      // Network error or server not reachable
      errorMessage = 'Tidak dapat terhubung ke server.';
    } else {
      // Server-side error
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Sesi telah berakhir, silakan login kembali.';
      } else if (error.status === 403) {
        errorMessage = 'Anda tidak memiliki akses.';
      } else if (error.status === 404) {
        errorMessage = 'Data tidak ditemukan.';
      } else if (error.status === 500) {
        errorMessage = 'Terjadi kesalahan pada server.';
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
