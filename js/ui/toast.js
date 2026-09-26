let hideTimer = null;

export function showToast(message, duration = 3200) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('is-visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    hideTimer = setTimeout(() => { toast.hidden = true; }, 250);
  }, duration);
}
