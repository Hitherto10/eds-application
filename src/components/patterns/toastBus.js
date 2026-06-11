/**
 * Toast bus — the imperative API for the ToastHost component.
 * Separated from the component so it can be imported anywhere without
 * tripping React Fast Refresh.
 *
 *   pushToast({ message: 'Invoice created' })
 *   pushToast({ message: 'Student archived', undo: async () => { … } })
 */
export const TOAST_EVENT = 'educonnect:toast';
let seq = 0;

export function pushToast({ message, undo, duration }) {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
        detail: {
            id: ++seq,
            message,
            undo,
            duration: duration ?? (undo ? 8000 : 4000),
        },
    }));
}
