import api from "../lib/axiosConfig";

export interface BillingOffer { id:string; months:number; base_price_toman:number; price_toman:number; discount_percent:number; duration_discount_percent:number }
export interface BillingPlan { id:"single"|"couple"|"group"; title:string; max_users:number; plan_discount_percent:number; durations:BillingOffer[] }
export interface BillingPublicConfig { is_paid:boolean; mode:"free"|"paid"; free_overlay:{title:string;message:string}; global_discount_percent:number; plans:BillingPlan[] }
export interface BillingQuote { plan_id:string; plan_title:string; duration_months:number; base_price_toman:number; discount_percent:number; final_price_toman:number; currency:"IRR" }
export interface CreatePaymentResponse { payment_id:string; payment_url:string; amount_toman:number }
export interface BillingPayment { id:string; plan_id:string; plan_title:string; duration_months:number; base_amount_toman:number; amount_toman:number; discount_percent:number; currency:string; status:string; authority?:string; ref_id?:number; discount_code?:string; created_at:string; paid_at?:string }
export interface PaymentsResponse { payments:BillingPayment[]; pagination:{page:number;limit:number;total:number;pages:number} }
export interface CurrentPlan { user_plan_id:string; owner_user_id:string; plan_id:string; title:string; max_users:number; duration_months:number; starts_at:string; expires_at:string; status:"active"|"frozen"; is_plan_admin:boolean; member_count:number }
export interface PlanMember { user_id:string; username:string; profile_picture?:string; joined_at:string; days_since_joined:number; is_plan_admin:boolean }
export interface JoinRequest { id:string; user_id:string; username:string; profile_picture?:string; created_at:string }
export interface PlanUsersResponse { plan:CurrentPlan;members:PlanMember[];pending_requests:JoinRequest[];invite_url:string }
export interface PrivatePlanRoom { id:string; code:number; name:string; image?:string; created_at:string; creator_username:string; member_count:number }
export interface PrivatePlanRoomsResponse { rooms:PrivatePlanRoom[] }
export interface InvitePreview { token:string;owner_username:string;plan_title:string;max_users:number;member_count:number;expires_at:string }

export const billingApi = {
  getPublicConfig: () => api.get<BillingPublicConfig>('/billing/config'),
  quote: (payload:{plan_id:string;duration_months:number;discount_code?:string}) => api.post<BillingQuote>('/billing/quote',payload),
  createPayment: (payload:{plan_id:string;duration_months:number;discount_code?:string}) => api.post<CreatePaymentResponse>('/billing/payments',payload),
  getPayments: (page=1,limit=20) => api.get<PaymentsResponse>('/billing/payments',{params:{page,limit}}),
  reconcilePayment: (id:string) => api.post<{status:'success'|'failed'|'processing'}>(`/billing/payments/${encodeURIComponent(id)}/reconcile`),
  getCurrentPlan: () => api.get<CurrentPlan>('/users/me/plan'),
  getPlanUsers: () => api.get<PlanUsersResponse>('/users/me/plan-users'),
  getPrivateRooms: () => api.get<PrivatePlanRoomsResponse>('/rooms/private'),
  refreshPlanInvite: () => api.post<{token:string;url:string;plan_title:string}>('/users/me/plan/invite/refresh'),
  previewInvite: (token:string) => api.get<InvitePreview>(`/plan-invites/${encodeURIComponent(token)}`),
  requestPlanJoin: (token:string) => api.post(`/plan-invites/${encodeURIComponent(token)}/requests`),
  acceptJoinRequest: (id:string) => api.post(`/users/me/plan/requests/${id}/accept`),
  rejectJoinRequest: (id:string) => api.post(`/users/me/plan/requests/${id}/reject`),
  kickMember: (userId:string) => api.delete(`/users/me/plan/members/${userId}`),
};
