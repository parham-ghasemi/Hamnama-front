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

  // --- Profile Picture Endpoints --- //

  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    // Note: 'file' is the standard field name, but change it if your Go backend expects something else (e.g. 'image' or 'profile_picture')
    formData.append('file', file);

    return api.post('/users/me/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  removeProfilePicture: () =>
    api.delete('/users/me/profile-picture'),
};