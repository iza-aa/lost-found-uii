import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
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
  phone: string;
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
  attached_qr?: string; // QR code scanned from item
}

export interface CreateLostItemRequest {
  title: string;
  category_id: string;
  description?: string;
  location_last_seen: string;
  location_latitude?: number;
  location_longitude?: number;
  date_lost: string; // YYYY-MM-DD
  image_url?: string;
  urgency?: 'NORMAL' | 'HIGH' | 'CRITICAL';
  offer_reward?: boolean;
  cod?: boolean;
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
  finder_id?: string;  // Direct ID when finder object not populated
  owner?: ItemUserResponse;
  owner_id?: string;   // Direct ID when owner object not populated
  approved_claim?: ClaimResponse; // Claim yang sudah approved
  user_claim_status?: string; // Status claim user: PENDING, APPROVED, REJECTED
  attached_qr?: string; // QR code attached to item (from finder scan)
}

export interface ItemUserResponse {
  id: string;
  name: string;
  phone?: string;
  role: string;
}

// ========== CLAIM (for LOST items) ==========
// User 2 (finder) submits a claim with questions for User 1 (owner)

export interface ClaimQuestionRequest {
  question: string;
}

export interface ClaimRequest {
  questions: ClaimQuestionRequest[];
  show_phone: boolean;
  contacts: ContactRequest[];
  note?: string;
}

export interface ClaimAnswerRequest {
  question_id: string;
  answer: string;
}

export interface AnswerClaimRequest {
  answers: ClaimAnswerRequest[];
}

export interface ClaimQuestionResponse {
  id: string;
  question: string;
  answer?: string;
}

export interface ClaimResponse {
  id: string;
  item_id: string;
  finder_id: string;
  finder?: ItemUserResponse;
  questions?: ClaimQuestionResponse[];
  contacts?: ContactResponse[];
  show_phone: boolean;
  note?: string;
  status: string; // PENDING, PENDING_APPROVAL, APPROVED, REJECTED
  created_at: string;
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
  description?: string;
  latitude: number;
  longitude: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  ref_type: string;  // CLAIM_NEW, CLAIM_ANSWERED, CLAIM_APPROVED, etc.
  ref_id: string;
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
  
  // Base URL without /api/v1 for static files
  private readonly staticBaseUrl = environment.apiUrl.replace('/api/v1', '');
  private readonly TOKEN_KEY = 'lf_token';
  private readonly REFRESH_TOKEN_KEY = 'lf_refresh_token';
  private readonly USER_KEY = 'lf_api_user';
  
  private isBrowser: boolean;
  
  // Auth state
  private currentUserSubject = new BehaviorSubject<UserResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Get full URL for static files (images, uploads, etc.)
   * Converts relative paths like /uploads/xxx.png to full URLs
   */
  getStaticFileUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${this.staticBaseUrl}${path}`;
  }

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
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, request, {
      headers: this.getBasicHeaders()
    }).pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, request, {
      headers: this.getBasicHeaders()
    }).pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, { refresh_token: refreshToken }, {
      headers: this.getBasicHeaders()
    }).pipe(
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
    return this.http.get<any>(`${this.baseUrl}/items`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        // Handle various response formats
        if (Array.isArray(response)) {
          return response;
        }
        if (response && Array.isArray(response.data)) {
          return response.data;
        }
        if (response && Array.isArray(response.items)) {
          return response.items;
        }
        console.warn('getAllItems: Unexpected response format', response);
        return [];
      }),
      catchError(err => {
        console.error('getAllItems error:', err);
        return of([]); // Return empty array on error instead of throwing
      })
    );
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
   * Submit claim for an item (LOST items - User 2/finder submits questions)
   */
  submitClaim(itemId: string, request: ClaimRequest): Observable<ClaimResponse> {
    return this.http.post<ClaimResponse>(`${this.baseUrl}/items/${itemId}/claim`, request, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Get claims for an item (Owner only)
   */
  getClaims(itemId: string): Observable<ClaimResponse[]> {
    return this.http.get<any>(`${this.baseUrl}/items/${itemId}/claims`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        if (response?.data && Array.isArray(response.data)) return response.data;
        console.warn('getClaims: Unexpected response format', response);
        return [];
      }),
      catchError(err => {
        console.error('getClaims error:', err);
        return of([]);
      })
    );
  }

  /**
   * Get my claim for an item (Finder checks their own claim)
   */
  getMyClaim(itemId: string): Observable<ClaimResponse | null> {
    return this.http.get<ClaimResponse>(`${this.baseUrl}/items/${itemId}/my-claim`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Answer claim questions (Owner answers finder's questions)
   */
  answerClaim(claimId: string, request: AnswerClaimRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/claims/${claimId}/answer`, request, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Decide claim (Finder approves/rejects owner's answers)
   */
  decideClaim(claimId: string, request: DecideClaimRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/claims/${claimId}/decide`, request, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Verify QR code on a FOUND item - checks if the attached QR matches current user
   * Returns { match: boolean, message: string }
   */
  verifyQR(itemId: string): Observable<{ match: boolean; message: string }> {
    return this.http.post<{ match: boolean; message: string }>(
      `${this.baseUrl}/items/${itemId}/verify-qr`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Delete an item (Owner/Finder only)
   */
  deleteItem(itemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/items/${itemId}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Update an item (Owner/Finder only)
   */
  updateItem(itemId: string, data: Partial<{
    title: string;
    description: string;
    image_url: string;
    category_id: string;
    location_id: string;
    location_latitude: number;
    location_longitude: number;
    date_lost: string;
    urgency: string;
    offer_reward: boolean;
    cod: boolean;
  }>): Observable<any> {
    return this.http.put(`${this.baseUrl}/items/${itemId}`, data, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/users/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // ==================== ENUMERATION METHODS ====================

  /**
   * Get all categories
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<any>(`${this.baseUrl}/enumerations/item-categories`, {
      headers: this.getBasicHeaders()
    }).pipe(
        map(response => {
          if (Array.isArray(response)) return response;
          if (response?.data && Array.isArray(response.data)) return response.data;
          console.warn('getCategories: Unexpected response format', response);
          return [];
        }),
        catchError(err => {
          console.error('getCategories error:', err);
          return of([]);
        })
      );
  }

  /**
   * Get all locations
   */
  getLocations(): Observable<Location[]> {
    return this.http.get<any>(`${this.baseUrl}/enumerations/campus-locations`, {
      headers: this.getBasicHeaders()
    }).pipe(
        map(response => {
          if (Array.isArray(response)) return response;
          if (response?.data && Array.isArray(response.data)) return response.data;
          console.warn('getLocations: Unexpected response format', response);
          return [];
        }),
        catchError(err => {
          console.error('getLocations error:', err);
          return of([]);
        })
      );
  }

  // ==================== NOTIFICATION METHODS ====================

  /**
   * Get user notifications
   */
  getNotifications(): Observable<Notification[]> {
    return this.http.get<any>(`${this.baseUrl}/notifications`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        if (response?.data && Array.isArray(response.data)) return response.data;
        console.warn('getNotifications: Unexpected response format', response);
        return [];
      }),
      catchError(err => {
        console.error('getNotifications error:', err);
        return of([]);
      })
    );
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
   * Upload file - returns full URL with backend base
   */
  uploadFile(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(`${this.baseUrl}/upload`, formData, {
      headers: this.getAuthHeaders(true) // Don't set Content-Type for FormData
    }).pipe(
      map(res => {
        // Prepend static base URL if the returned URL is relative
        if (res.url && res.url.startsWith('/')) {
          return { url: `${this.staticBaseUrl}${res.url}` };
        }
        return res;
      }),
      catchError(this.handleError)
    );
  }

  // ==================== ASSET METHODS (QR Code Flow) ====================

  /**
   * Scan asset (public)
   */
  scanAsset(assetId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/scan/${assetId}`, {
      headers: this.getBasicHeaders()
    }).pipe(catchError(this.handleError));
  }

  // ==================== USER PROFILE METHODS ====================

  /**
   * Get items reported by current user
   */
  getMyItems(): Observable<ItemResponse[]> {
    return this.http.get<any>(`${this.baseUrl}/items/my`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (Array.isArray(response)) return response;
        if (response?.data && Array.isArray(response.data)) return response.data;
        console.warn('getMyItems: Unexpected response format', response);
        return [];
      }),
      catchError(err => {
        console.error('getMyItems error:', err);
        return of([]);
      })
    );
  }

  /**
   * Update user profile
   */
  updateProfile(data: { name?: string; phone?: string; avatar?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/profile`, data, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/change-password`, {
      current_password: currentPassword,
      new_password: newPassword
    }, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * Upload image - returns relative URL
   */
  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(`${this.baseUrl}/upload`, formData, {
      headers: this.getAuthHeaders(true)
    }).pipe(catchError(this.handleError));
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
   * Get basic headers (for public endpoints)
   */
  private getBasicHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('ngrok-skip-browser-warning', 'true')
      .set('Content-Type', 'application/json');
  }

  /**
   * Get auth headers
   */
  private getAuthHeaders(isFormData = false): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    
    // Skip ngrok browser warning page
    headers = headers.set('ngrok-skip-browser-warning', 'true');
    
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
    } else if (typeof error.error === 'string' && error.error.includes('<!DOCTYPE')) {
      // Response is HTML (ngrok warning page or error page)
      errorMessage = 'Server mengembalikan halaman error. Pastikan backend berjalan.';
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
