import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./ConfirmModalContext.scss";

interface ConfirmationOptions {
  title: string;
  body?: ReactNode;
  primaryButtonText: string;
  secondaryButtonText: string;
  primaryButtonClasses?: string;
  onConfirm?: () => void;
}

interface ConfirmationModalContextType {
  openConfirmation: (options: ConfirmationOptions) => void;
  closeConfirmation: () => void;
}

const ConfirmationModalContext =
  createContext<ConfirmationModalContextType | null>(null);

export function ConfirmationModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [modal, setModal] = useState<ConfirmationOptions | null>(null);

  const closeConfirmation = () => {
    setModal(null);
  };

  return (
    <ConfirmationModalContext.Provider
      value={{
        openConfirmation: setModal,
        closeConfirmation,
      }}
    >
      {children}

      {modal &&
        createPortal(
          <div className="confirmation-modal" dir="rtl">
            <div
              className="confirmation-modal__overlay"
              onClick={closeConfirmation}
              aria-hidden="true"
            />

            <div
              className="confirmation-modal__content"
              role="dialog"
              aria-modal="true"
            >
              <div className="confirmation-modal__content__header">
                <h2 className="confirmation-modal__content__header__title">
                  {modal.title}
                </h2>
              </div>

              {modal.body && (
                <div className="confirmation-modal__content__body">
                  {modal.body}
                </div>
              )}

              <div className="confirmation-modal__content__actions">
                <button
                  className="confirmation-modal__content__actions__secondary-button"
                  onClick={closeConfirmation}
                >
                  {modal.secondaryButtonText}
                </button>

                <button
                  className={`confirmation-modal__content__actions__primary-button ${modal.primaryButtonClasses ?? ""}`.trim()}
                  onClick={() => {
                    modal.onConfirm?.();
                    closeConfirmation();
                  }}
                >
                  {modal.primaryButtonText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmationModalContext.Provider>
  );
}

export function useConfirmationModal() {
  const context = useContext(ConfirmationModalContext);

  if (!context) {
    throw new Error(
      "useConfirmationModal must be used inside ConfirmationModalProvider"
    );
  }

  return context;
}