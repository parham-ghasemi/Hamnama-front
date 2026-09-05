import { useState } from 'react';
import { IoClose, IoImageOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import './CreateRoomModal.scss';
import { createRoom, uploadRoomImage } from '../../../../apiCalls/roomApi';

const CreateRoomModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [isPublic, setIsPublic] = useState(false);
  const [mediaControl, setMediaControl] = useState<'admin' | 'everyone'>('admin');
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const navigate = useNavigate();
  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (newRoom) => {
      if (!image) {
        onClose();
        navigate(`/room/${newRoom.id}`);
        return;
      }
      uploadRoomImage(newRoom.id, image)
        .then(() => {
          onClose();
          navigate(`/room/${newRoom.id}`);
        })
        .catch((error) => {
          console.error('Room created but image upload failed:', error);
          onClose();
          navigate(`/room/${newRoom.id}`);
        });
    },
    onError: (error) => {
      console.error("Failed to create room:", error);
    },
  });

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (isPublic && !trimmedName) return;
    createRoomMutation.mutate({
      name: trimmedName,
      is_public: isPublic,
      media_control_permission: mediaControl,
    });
  };

  const handleImageChange = (file: File | null) => {
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const canCreate = !isPublic || name.trim().length > 0;

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
            <label>نام اتاق {isPublic ? '(الزامی)' : '(اختیاری)'}</label>
            <input
              className="create-room-modal__input"
              value={name}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              placeholder={isPublic ? 'مثلاً فیلم شب جمعه' : 'نام اختیاری برای اتاق'}
            />
          </div>

          <div className="form-group">
            <label>تصویر اتاق (اختیاری)</label>
            <label className="create-room-modal__image-picker">
              {imagePreview ? (
                <img src={imagePreview} alt="پیش نمایش تصویر اتاق" />
              ) : (
                <IoImageOutline aria-hidden="true" />
              )}
              <span>{image ? image.name : 'انتخاب تصویر'}</span>
              <input type="file" accept="image/*" onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)} />
            </label>
            {image && <button type="button" className="create-room-modal__clear-image" onClick={() => handleImageChange(null)}>حذف تصویر</button>}
          </div>

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
          <button className="create-btn" onClick={handleCreate} disabled={isPending || !canCreate}>
            {isPending ? 'در حال ساخت...' : 'ساخت اتاق'} {/* Creating... / Create Room */}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateRoomModal;