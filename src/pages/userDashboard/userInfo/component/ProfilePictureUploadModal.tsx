import { useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { IoClose, IoImageOutline, IoTrashOutline } from 'react-icons/io5';
import { toast } from '../../../../components/toast';
import { getApiErrorMessage } from '../../../../lib/apiError';
import { useAuth } from '../../../../context/AuthContext';
import { userApi } from '../../../../apiCalls/userApi';
import { toPersianNumerals } from '../../../../helpers/NumberConversion';
import './ProfilePictureUploadModal.scss';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const OUTPUT_IMAGE_SIZE = 800;

type FilterId = 'original' | 'mono' | 'warm';

const FILTER_PRESETS: Array<{
  id: FilterId;
  label: string;
  description: string;
  cssFilter: string;
}> = [
    {
      id: 'original',
      label: 'اصلی',
      description: 'بدون فیلتر',
      cssFilter: 'none',
    },
    {
      id: 'mono',
      label: 'سیاه‌وسفید',
      description: 'کنتراست کلاسیک',
      cssFilter: 'grayscale(1) contrast(1.08)',
    },
    {
      id: 'warm',
      label: 'گرم',
      description: 'رنگ‌های گرم و لطیف',
      cssFilter: 'sepia(0.30) saturate(1.18) brightness(1.03)',
    },
  ];

const Spinner = () => <span className="profile-picture-modal__spinner" aria-hidden="true" />;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('تصویر انتخاب‌شده قابل خواندن نیست.'));
    image.src = src;
  });

const createCroppedImage = async (
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  filter: FilterId,
  sourceName: string,
): Promise<File> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_IMAGE_SIZE;
  canvas.height = OUTPUT_IMAGE_SIZE;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('پردازش تصویر در این مرورگر امکان‌پذیر نیست.');

  // Use an explicit opaque background before exporting as JPEG so transparent PNGs do not turn black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, OUTPUT_IMAGE_SIZE, OUTPUT_IMAGE_SIZE);
  const selectedPreset = FILTER_PRESETS.find((preset) => preset.id === filter) ?? FILTER_PRESETS[0]!;
  context.filter = selectedPreset.cssFilter;
  // Cropper rounds pixel bounds to integers; normalize any one-pixel rounding difference
  // around the center so the resulting image never gets stretched.
  const squareSize = Math.min(crop.width, crop.height);
  const squareX = crop.x + (crop.width - squareSize) / 2;
  const squareY = crop.y + (crop.height - squareSize) / 2;
  context.drawImage(
    image,
    squareX,
    squareY,
    squareSize,
    squareSize,
    0,
    0,
    OUTPUT_IMAGE_SIZE,
    OUTPUT_IMAGE_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('ساخت تصویر نهایی ناموفق بود.'))),
      'image/jpeg',
      0.92,
    );
  });

  const baseName = sourceName.replace(/\.[^.]+$/, '') || 'profile-picture';
  return new File([blob], `${baseName}-profile.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
};

interface ProfilePictureUploadModalProps {
  onClose: () => void;
}

const ProfilePictureUploadModal = ({ onClose }: ProfilePictureUploadModalProps) => {
  const { user, fetchUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('original');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPicture = user?.profile_picture
    ? `${import.meta.env['VITE_BASE_URL']}${user.profile_picture}`
    : null;
  const isBusy = isUploading || isDeleting;
  const activePreset = useMemo(
    () => FILTER_PRESETS.find((preset) => preset.id === selectedFilter) ?? FILTER_PRESETS[0]!,
    [selectedFilter],
  );

  useEffect(() => {
    if (!selectedFile) {
      setImageUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setImageUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBusy, onClose]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('فقط فایل تصویری مجاز است');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('حجم عکس نباید بیشتر از ۱۰ مگابایت باشد');
      return;
    }

    setSelectedFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSelectedFilter('original');
    setCroppedAreaPixels(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !imageUrl || !croppedAreaPixels || isBusy) return;

    setIsUploading(true);
    try {
      const croppedFile = await createCroppedImage(
        imageUrl,
        croppedAreaPixels,
        selectedFilter,
        selectedFile.name,
      );
      await userApi.uploadProfilePicture(croppedFile);
      await fetchUser();
      toast.success('عکس پروفایل با موفقیت آپلود شد');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'پردازش یا آپلود تصویر انجام نشد.'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (isBusy) return;
    setIsDeleting(true);
    try {
      await userApi.removeProfilePicture();
      await fetchUser();
      toast.success('عکس پروفایل با موفقیت حذف شد');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'حذف تصویر انجام نشد.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="profile-picture-modal-overlay"
      onClick={() => !isBusy && onClose()}
    >
      <section
        className="profile-picture-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-picture-modal-title"
        onClick={(event) => event.stopPropagation()}
        dir="rtl"
      >
        <header className="profile-picture-modal__header">
          <div>
            <span className="profile-picture-modal__eyebrow">شخصی‌سازی حساب</span>
            <h2 id="profile-picture-modal-title">عکس پروفایل</h2>
            <p>عکس را برش بزنید و قبل از آپلود ظاهر آن را انتخاب کنید.</p>
          </div>
          <button
            type="button"
            className="profile-picture-modal__close"
            onClick={onClose}
            disabled={isBusy}
            aria-label="بستن پنجره"
          >
            <IoClose />
          </button>
        </header>

        <input
          ref={fileInputRef}
          className="profile-picture-modal__file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isBusy}
        />

        {selectedFile && imageUrl ? (
          <div className="profile-picture-modal__editor">
            <div className="profile-picture-modal__cropper-frame">
              <div className={`profile-picture-modal__cropper profile-picture-modal__cropper--${selectedFilter}`}>
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={false}
                  zoomWithScroll={true}
                  restrictPosition
                  minZoom={1}
                  maxZoom={3}
                  classes={{ mediaClassName: 'profile-picture-modal__crop-image' }}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                />
              </div>
              <span className="profile-picture-modal__crop-badge">برش مربعی ۱:۱</span>
            </div>

            <div className="profile-picture-modal__controls">
              <p className="profile-picture-modal__zoom-hint">
                برای بزرگ‌نمایی، روی تصویر اسکرول کنید یا با دو انگشت زوم کنید.
              </p>
              <div className="profile-picture-modal__section-heading">
                <span>انتخاب فیلتر</span>
                <span className="profile-picture-modal__selected-filter">{activePreset.label}</span>
              </div>
              <div className="profile-picture-modal__filters">
                {FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`profile-picture-modal__filter ${selectedFilter === preset.id ? 'is-selected' : ''}`}
                    onClick={() => setSelectedFilter(preset.id)}
                    disabled={isBusy}
                    aria-pressed={selectedFilter === preset.id}
                  >
                    <span className={`profile-picture-modal__filter-preview profile-picture-modal__filter-preview--${preset.id}`}>
                      {imageUrl && <img src={imageUrl} alt="" />}
                    </span>
                    <span className="profile-picture-modal__filter-name">{preset.label}</span>
                    <span className="profile-picture-modal__filter-description">{preset.description}</span>
                  </button>
                ))}
              </div>

              <p className="profile-picture-modal__file-note">
                {selectedFile.name} · {toPersianNumerals((selectedFile.size / (1024 * 1024)).toFixed(1))} مگابایت
              </p>

              <div className="profile-picture-modal__actions">
                <button
                  type="button"
                  className="profile-picture-modal__button profile-picture-modal__button--primary"
                  onClick={handleUpload}
                  disabled={isBusy || !croppedAreaPixels}
                >
                  {isUploading ? <Spinner /> : null}
                  {isUploading ? 'در حال پردازش و آپلود...' : 'برش و آپلود عکس'}
                </button>
                <button
                  type="button"
                  className="profile-picture-modal__button profile-picture-modal__button--secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                >
                  انتخاب عکس دیگر
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-picture-modal__empty-state">
            <div className="profile-picture-modal__current-preview">
              {currentPicture ? (
                <img src={currentPicture} alt="عکس فعلی پروفایل" />
              ) : (
                <IoImageOutline />
              )}
            </div>
            <h3>{currentPicture ? 'عکس فعلی شما' : 'یک عکس برای پروفایل انتخاب کنید'}</h3>
            <button
              type="button"
              className="profile-picture-modal__button profile-picture-modal__button--primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              انتخاب تصویر
            </button>
            <span className="profile-picture-modal__limit-note">JPG، PNG، WEBP و سایر فرمت‌های تصویری · حداکثر ۱۰ مگابایت</span>
            {currentPicture && (
              <button
                type="button"
                className="profile-picture-modal__delete"
                onClick={handleDelete}
                disabled={isBusy}
              >
                {isDeleting ? <Spinner /> : <IoTrashOutline />}
                {isDeleting ? 'در حال حذف...' : 'حذف عکس فعلی'}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfilePictureUploadModal;
