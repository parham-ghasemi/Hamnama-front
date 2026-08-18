import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import './CreateRoomModal.scss';
import { createRoom } from '../../../../apiCalls/roomApi';

const CreateRoomModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [isPublic, setIsPublic] = useState(false);
  const [mediaControl, setMediaControl] = useState('admin');

  const navigate = useNavigate();
  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (newRoom) => {
      onClose();
      navigate(`/room/${newRoom.id}`);
    },
    onError: (error) => {
      console.error("Failed to create room:", error);
    },
  });

  const handleCreate = () => {
    createRoomMutation.mutate({
      is_public: isPublic,
      media_control_permission: mediaControl as "admin" | "everyone",
    });
  };

  const isPending = createRoomMutation.isPending;

  return (
    <div className={`create-room-modal-overlay ${isOpen ? 'is-active' : ''}`}>
      <div className="create-room-modal" onClick={(e) => e.stopPropagation()}>

        <div className="create-room-modal__header">
          <h3>تنظیمات اتاق جدید</h3> {/* New Room Settings */}
          <button onClick={onClose} disabled={isPending}>
            <IoClose />
          </button>
        </div>

        <div className="create-room-modal__body">

          <div className="form-group">
            <label>حریم خصوصی </label>
            <div className="toggle-group">
              <button
                className={!isPublic ? 'active' : ''}
                onClick={() => setIsPublic(false)}
              >
                خصوصی
              </button>
              <button
                className={isPublic ? 'active' : ''}
                onClick={() => setIsPublic(true)}
              >
                عمومی
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>دسترسی کنترل پخش </label>
            <div className="toggle-group">
              <button
                className={mediaControl === 'admin' ? 'active' : ''}
                onClick={() => setMediaControl('admin')}
              >
                فقط مدیر
              </button>
              <button
                className={mediaControl === 'everyone' ? 'active' : ''}
                onClick={() => setMediaControl('everyone')}
              >
                همه
              </button>
            </div>
          </div>

        </div>

        <div className="create-room-modal__footer">
          <button className="cancel-btn" onClick={onClose} disabled={isPending}>
            لغو
          </button>
          <button className="create-btn" onClick={handleCreate} disabled={isPending}>
            {isPending ? 'در حال ساخت...' : 'ساخت اتاق'} {/* Creating... / Create Room */}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateRoomModal;