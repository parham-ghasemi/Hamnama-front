import axios from 'axios';

const hasPersian = (value: string) => /[\u0600-\u06FF]/.test(value);

const normalizeKnownMessage = (value: string): string | null => {
  const message = value.trim().toLowerCase();
  if (!message) return null;

  const rules: Array<[RegExp, string]> = [
    [/invalid current password/, 'رمز عبور فعلی اشتباه است.'],
    [/username (already )?taken/, 'این نام کاربری قبلاً استفاده شده است.'],
    [/phone number (already )?taken/, 'این شماره موبایل قبلاً استفاده شده است.'],
    [/too many requests/, 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'],
    [/otp not found|otp.*expired/, 'کد تأیید پیدا نشد یا منقضی شده است.'],
    [/invalid otp/, 'کد تأیید اشتباه است.'],
    [/subject and message are required/, 'عنوان و متن تیکت الزامی است.'],
    [/ticket not found/, 'تیکت پیدا نشد.'],
    [/closed ticket/, 'این تیکت بسته است و امکان انجام این عملیات وجود ندارد.'],
    [/permission to access this ticket|forbidden/, 'شما اجازه انجام این عملیات را ندارید.'],
    [/plan is full/, 'ظرفیت این پلن تکمیل شده است.'],
    [/already has a plan|already.*plan/, 'این حساب در حال حاضر عضو یک پلن است.'],
    [/active plan required/, 'برای استفاده از این بخش، اشتراک فعال لازم است.'],
    [/only plan admin/, 'فقط مدیر پلن اجازه انجام این عملیات را دارد.'],
    [/join request already pending/, 'درخواست عضویت شما قبلاً ثبت شده است.'],
    [/discount code.*(invalid|expired|limit)|invalid discount code/, 'کد تخفیف معتبر نیست یا امکان استفاده از آن وجود ندارد.'],
    [/payment is already pending/, 'یک پرداخت در انتظار تکمیل دارید.'],
    [/paid plans are disabled/, 'در حال حاضر خرید پلن فعال نیست.'],
    [/payment.*verified|still waiting for gateway verification/, 'پرداخت شما هنوز تأیید نشده است.'],
    [/room not found/, 'اتاق پیدا نشد.'],
    [/room is closed/, 'این اتاق بسته شده است.'],
    [/already in the room/, 'شما قبلاً عضو این اتاق هستید.'],
    [/invalid request|invalid payload|invalid input/, 'اطلاعات ارسال‌شده معتبر نیست.'],
    [/image.*large|file.*too large/, 'حجم فایل بیش از حد مجاز است.'],
    [/subtitle.*valid srt/, 'زیرنویس باید یک فایل SRT معتبر باشد.'],
    [/subtitle.*http|https/, 'لینک زیرنویس معتبر نیست.'],
    [/user not found/, 'کاربر موردنظر پیدا نشد.'],
    [/not found/, 'مورد درخواست‌شده پیدا نشد.'],
    [/network error|failed to fetch/, 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.'],
  ];

  for (const [pattern, translated] of rules) {
    if (pattern.test(message)) return translated;
  }

  return null;
};

const statusMessage: Record<number, string> = {
  400: 'اطلاعات ارسال‌شده معتبر نیست.',
  401: 'نشست شما معتبر نیست. لطفاً دوباره وارد شوید.',
  403: 'شما اجازه انجام این عملیات را ندارید.',
  404: 'مورد درخواست‌شده پیدا نشد.',
  409: 'این عملیات با وضعیت فعلی حساب سازگار نیست.',
  413: 'حجم اطلاعات ارسالی بیش از حد مجاز است.',
  422: 'اطلاعات ارسال‌شده قابل پردازش نیست.',
  429: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.',
  500: 'خطای غیرمنتظره‌ای در سرور رخ داد. لطفاً دوباره تلاش کنید.',
  502: 'ارتباط با سرویس پرداخت یا سرور مقصد برقرار نشد.',
  503: 'سرویس موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید.',
  504: 'پاسخ سرویس بیش از حد طول کشید. کمی بعد دوباره تلاش کنید.',
};

export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (axios.isAxiosError(error)) return error.response?.status;
  return undefined;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'عملیات انجام نشد. لطفاً دوباره تلاش کنید.',
): string => {
  const status = getApiErrorStatus(error);

  let serverMessage = '';
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string') {
      serverMessage = data.trim();
    } else if (data && typeof data === 'object') {
      const candidate = (data as { message?: unknown }).message;
      if (typeof candidate === 'string') serverMessage = candidate.trim();
    }
  } else if (error instanceof Error) {
    serverMessage = error.message.trim();
  } else if (typeof error === 'string') {
    serverMessage = error.trim();
  }

  if (hasPersian(serverMessage)) return serverMessage;

  return (
    normalizeKnownMessage(serverMessage) ??
    (status ? statusMessage[status] : undefined) ??
    fallback
  );
};
