import './MediaTypeModal.scss';
import clsx from "clsx";
import { getApiErrorMessage } from "../../../../lib/apiError";
import { useState } from "react";
import { BsLink45Deg } from "react-icons/bs";
import { IoClose, IoCloudUploadOutline } from "react-icons/io5";
import { TbArchiveFilled, TbPlayerPlay } from 'react-icons/tb';

const MediaTypeModal = ({
  openArchive,
  isOpen,
  closeModal,
  onChooseLink,
  onSubmitUpload,
}: {
  isOpen: boolean;
  openArchive: () => void;
  closeModal: () => void;
  onChooseLink: () => void;
  onSubmitUpload: (videoFile: File, subtitleFile: File | null, onProgress?: (percent: number) => void) => Promise<void>;
}) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetUpload = () => {
    setUploadOpen(false);
    setVideoFile(null);
    setSubtitleFile(null);
    setUploadError(null);
    setUploading(false);
    setUploadProgress(0);
  };

  const handleClose = () => {
    resetUpload();
    closeModal();
  };

  const handleChooseUpload = () => {
    setUploadOpen(true);
    setUploadError(null);
    setUploadProgress(0);
  };

  const validateVideoFile = async (file: File): Promise<string | null> => {
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
    const allowed = new Set([".mp4", ".webm", ".mov", ".m4v", ".mkv", ".avi", ".mpeg", ".mpg", ".ogv"]);
    if (!allowed.has(ext)) return "فایل ویدیو باید یکی از فرمت‌های MP4، MKV، WebM، MOV، M4V، AVI، MPEG، MPG یا OGV باشد.";
    if (file.size > 2 * 1024 * 1024 * 1024) return "حجم ویدیو نمی‌تواند بیشتر از ۲ گیگابایت باشد.";

    const bytes = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
    const ascii = (from: number, length: number) => String.fromCharCode(...bytes.slice(from, from + length));
    const hasFtyp = bytes.length >= 8 && ascii(4, 4) === "ftyp";
    const isEbml = bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    const isAvi = bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "AVI ";
    const isOgg = bytes.length >= 4 && ascii(0, 4) === "OggS";
    let isMpeg = false;
    for (let i = 0; i + 4 <= Math.min(bytes.length, 512); i += 1) {
      if (bytes[i] === 0 && bytes[i + 1] === 0 && bytes[i + 2] === 1 && [0xba, 0xbb, 0xb3].includes(bytes[i + 3])) {
        isMpeg = true;
        break;
      }
    }
    const valid = (ext === ".mkv" || ext === ".webm") ? isEbml
      : ext === ".avi" ? isAvi
        : ext === ".ogv" ? isOgg
          : (ext === ".mpeg" || ext === ".mpg") ? isMpeg
            : hasFtyp;
    return valid ? null : "محتوای فایل با فرمت ویدیو مطابقت ندارد.";
  };

  const validateSubtitleFile = async (file: File): Promise<string | null> => {
    if (!/\.srt$/i.test(file.name)) return "زیرنویس فقط باید با فرمت SRT باشد.";
    if (file.size > 5 * 1024 * 1024) return "حجم زیرنویس نمی‌تواند بیشتر از ۵ مگابایت باشد.";
    const text = await file.text();
    if (!/^\s*(?:\d+\s*\n)?\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}/m.test(text)) {
      return "محتوای فایل یک SRT معتبر نیست.";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!videoFile || uploading) return;
    setUploading(true);
    setUploadError(null);
    try {
      const videoError = await validateVideoFile(videoFile);
      if (videoError) throw new Error(videoError);
      if (subtitleFile) {
        const subtitleError = await validateSubtitleFile(subtitleFile);
        if (subtitleError) throw new Error(subtitleError);
      }
      setUploadProgress(0);
      await onSubmitUpload(videoFile, subtitleFile, setUploadProgress);
      resetUpload();
    } catch (error) {
      setUploadError(getApiErrorMessage(error, "آپلود فایل‌ها انجام نشد."));
      setUploading(false);
    }
  };

  return (
    <div className={clsx("media-type-modal", isOpen && "open")}>
      <header className="media-type-modal__head">
        <div className="media-type-modal__head-left">
          <TbPlayerPlay />
          <div>
            <strong>انتخاب منبع پخش</strong>
            <span>چگونه می‌خواهید محتوا را تماشا کنید؟</span>
          </div>
        </div>
        <button
          type="button"
          className="media-type-modal__close"
          onClick={handleClose}
          aria-label="بستن"
        >
          <IoClose />
        </button>
      </header>

      <div className="media-type-modal__body">
        <button
          type="button"
          className="media-type-modal__option media-type-modal__option--link"
          onClick={onChooseLink}
          disabled={uploading}
        >
          <div className="media-type-modal__option-icon">
            <BsLink45Deg />
          </div>
          <div className="media-type-modal__option-text">
            <strong>پخش با لینک</strong>
            <span>لینک مستقیم ویدیو را وارد کنید</span>
          </div>
          <span className="media-type-modal__option-arrow">←</span>
        </button>

        <button
          type="button"
          className="media-type-modal__option media-type-modal__option--archive"
          onClick={() => {
            resetUpload();
            closeModal();
            openArchive();
          }}
          disabled={uploading}
        >
          <div className="media-type-modal__option-icon">
            <TbArchiveFilled />
          </div>
          <div className="media-type-modal__option-text">
            <strong>آرشیو فیلم و سریال</strong>
            <span>از مجموعه کامل فیلم‌ها و سریال‌ها انتخاب کنید</span>
          </div>
          <span className="media-type-modal__option-arrow">←</span>
        </button>

        <button
          type="button"
          className={clsx(
            "media-type-modal__option",
            "media-type-modal__option--upload",
            uploadOpen && "is-open",
          )}
          onClick={handleChooseUpload}
          disabled={uploading}
        >
          <div className="media-type-modal__option-icon">
            <IoCloudUploadOutline />
          </div>
          <div className="media-type-modal__option-text">
            <strong>آپلود فایل خودتان</strong>
            <span>ویدیوی خودتان را به‌همراه زیرنویس SRT به اتاق اضافه کنید</span>
          </div>
          <span className="media-type-modal__option-arrow">←</span>
        </button>

        {uploadOpen && (
          <div className="media-type-modal__upload-panel">
            <label className="media-type-modal__file-field">
              <span>فایل ویدیو <b>*</b></span>
              <input
                type="file"
                accept=".mp4,.webm,.mov,.m4v,.mkv,.avi,.mpeg,.mpg,.ogv,video/mp4,video/webm,video/quicktime"
                onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                disabled={uploading}
              />
              <em>{videoFile?.name ?? "انتخاب فایل ویدیویی"}</em>
            </label>

            <label className="media-type-modal__file-field">
              <span>زیرنویس <small>(اختیاری، فقط SRT)</small></span>
              <input
                type="file"
                accept=".srt,application/x-subrip"
                onChange={(event) => setSubtitleFile(event.target.files?.[0] ?? null)}
                disabled={uploading}
              />
              <em>{subtitleFile?.name ?? "انتخاب فایل .srt"}</em>
            </label>

            {uploadError && <p className="media-type-modal__upload-error">{uploadError}</p>}

            {uploading && (
              <div className="media-type-modal__upload-progress" aria-live="polite">
                <div className="media-type-modal__upload-progress__head">
                  <span>پیشرفت آپلود</span>
                  <strong>{uploadProgress}%</strong>
                </div>
                <div className="media-type-modal__upload-progress__track">
                  <div className="media-type-modal__upload-progress__bar" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <button
              type="button"
              className="media-type-modal__upload-submit"
              onClick={handleSubmit}
              disabled={!videoFile || uploading}
            >
              {uploading ? "در حال آپلود…" : "آپلود و پخش در اتاق"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaTypeModal;
