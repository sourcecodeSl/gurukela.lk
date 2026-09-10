import Swal from 'sweetalert2'

/**
 * Themed SweetAlert2 confirmation used across the portal for destructive or
 * irreversible actions (revoke, delete, remove, …).
 *
 * The dialog reads the same CSS custom properties as the rest of the app
 * (see theme/ThemeContext.jsx), so it follows the active light/dark mode and
 * accent colour automatically. Styling lives in styles/global.css under the
 * `.gk-swal` classes; we disable SweetAlert's own button styling so ours wins.
 *
 * Resolves to `true` when the user confirms, `false` otherwise.
 */
export function confirmAction({
  title = 'Are you sure?',
  text = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
  icon = 'warning',
} = {}) {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: 'gk-swal',
      title: 'gk-swal-title',
      htmlContainer: 'gk-swal-text',
      actions: 'gk-swal-actions',
      confirmButton: `gk-swal-btn ${danger ? 'gk-swal-danger' : 'gk-swal-primary'}`,
      cancelButton: 'gk-swal-btn gk-swal-cancel',
    },
  }).then((r) => r.isConfirmed)
}
