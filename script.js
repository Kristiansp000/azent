document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({behavior: 'smooth', block: 'start'});
}));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('is-visible');
}), {threshold: 0.12});
document.querySelectorAll('.service-row, .about-grid, .services-head, .contact-grid').forEach(el => observer.observe(el));

const emailForm = document.querySelector('.form-wrap form');
const emailModal = document.querySelector('#email-modal');
const emailModalTitle = document.querySelector('#email-modal-title');
const emailModalText = document.querySelector('#email-modal-text');
const emailModalIcon = document.querySelector('.email-modal-icon');
const emailModalClose = document.querySelector('.email-modal-close');

if (emailForm && emailModal) {
  const setModal = (state, title, text) => {
    emailModal.hidden = false;
    emailModal.className = `email-modal ${state}`;
    emailModalTitle.textContent = title;
    emailModalText.textContent = text;
    emailModalIcon.setAttribute('aria-label', state === 'loading' ? 'Loading' : state === 'success' ? 'Success' : 'Error');
    emailModalClose.hidden = state === 'loading';
  };

  const closeModal = () => { emailModal.hidden = true; };
  emailModalClose.addEventListener('click', closeModal);
  emailModal.addEventListener('click', event => { if (event.target === emailModal) closeModal(); });

  emailForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!emailForm.reportValidity()) return;
    const submitButton = emailForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setModal('loading', 'Mengirim inquiry', 'Mohon tunggu, email sedang diproses.');

    try {
      const response = await fetch(emailForm.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(emailForm)),
        headers: { Accept: 'text/html', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }
      });
      const status = new URL(response.url).searchParams.get('status');
      if (!response.ok || status === 'failed' || status === 'unconfigured') {
        throw new Error(status || `HTTP ${response.status}`);
      }
      if (status === 'invalid') throw new Error('invalid');
      setModal('success', 'Inquiry terkirim', 'Terima kasih. Kami akan segera menghubungi Anda.');
      history.replaceState(null, '', response.url);
      emailForm.reset();
    } catch (error) {
      const message = error.message === 'invalid'
        ? 'Mohon periksa kembali nama, email, dan pesan Anda.'
        : 'Email belum terkirim. Silakan coba lagi beberapa saat lagi.';
      setModal('error', 'Pengiriman gagal', message);
    } finally {
      submitButton.disabled = false;
    }
  });
}
