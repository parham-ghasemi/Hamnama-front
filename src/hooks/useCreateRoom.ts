import { useMutation } from '@tanstack/react-query';
import api from '../lib/axiosConfig';

export const useCreateRoom = () => {
  return useMutation({
    mutationFn: async (roomData: { is_public: boolean, media_control_permission: string }) => {
      // roomData: { is_public: boolean, media_control_permission: string }
      const { data } = await api.post('/rooms', roomData);
      return data;
    },
  });
};