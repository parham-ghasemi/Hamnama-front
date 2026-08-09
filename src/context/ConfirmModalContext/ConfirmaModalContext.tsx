import { createContext, useCallback, useContext, useMemo, useState } from "react";
import clsx from "clsx";
import "./ConfirmModalContext.scss";

type ConfirmOptions = {
  onConfirm: () => void | Promise<void>;
  title: string;
  body?: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  primaryButtonClasses?: string;
};

type ConfirmContextValue = {
  openConfirmation: (options: ConfirmOptions) => void;
};

const ConfirmationModalContext = createContext<ConfirmContextValue>({
  openConfirmation: () => { },
});

export const ConfirmationModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const openConfirmation = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    setTimeout(() => setIsActive(true), 10);
  }, []);

  const close = useCallback(() => {
    setIsActive(false);
    setTimeout(() => setOptions(null), 300);
  }, []);

  const confirm = useCallback(async () => {
    if (!options) return;
    setIsBusy(true);
    try {
      await options.onConfirm();
    } finally {
      setIsBusy(false);
      close();
    }
  }, [options, close]);

  const value = useMemo(() => ({ openConfirmation }), [openConfirmation]);

  return (
    <ConfirmationModalContext.Provider value={value}>
      {children}

      {options && (
        <div
          className={clsx("confirm-modal-overlay", isActive && "is-active")}
          onClick={close}
          role="presentation"
        >
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="confirm-modal__sprockets" aria-hidden="true" />
            <h3 className="confirm-modal__title">{options.title}</h3>
            <p className="confirm-modal__body">{options.body}</p>
            <div className="confirm-modal__actions">
              <button
                type="button"
                className={clsx("confirm-modal__primary", options.primaryButtonClasses)}
                onClick={confirm}
                disabled={isBusy}
              >
                {isBusy && <span className="confirm-modal__spinner" aria-hidden="true" />}
                {options.primaryButtonText}
              </button>
              <button type="button" className="confirm-modal__secondary" onClick={close}>
                {options.secondaryButtonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationModalContext.Provider>
  );
};

export const useConfirmationModal = () => useContext(ConfirmationModalContext);
