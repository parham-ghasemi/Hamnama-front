import api from "../lib/axiosConfig";

export const userApi = {
  updateUsername: (username: string) =>
    api.patch('/users/me/username', { username }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/users/me/password', { current_password: currentPassword, new_password: newPassword }),

  // Step 1: Request OTP
  requestPhoneUpdate: (phone: string) =>
    api.patch('/users/me/phone', { phone }),

  // Step 2: Submit OTP to confirm
  confirmPhoneUpdate: (phone: string, code: string) =>
    api.patch('/users/me/phone', { phone, code }),
};