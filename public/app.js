const MAX_FILES = 8;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const FILE_TYPES = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/;
// Some browsers report no type for photos taken on an iPhone.
const HEIC_NAME = /\.hei[cf]$/i;

const menuButton = document.querySelector('.menu-button');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', open);
});

function element(tag, properties, children = []) {
  const node = Object.assign(document.createElement(tag), properties);
  node.append(...children);
  return node;
}

function setUpQuoteForm(form) {
  const fileInput = document.getElementById('files');
  const fileList = document.getElementById('file-list');
  const filesError = document.getElementById('files-error');
  const submitButton = form.querySelector('[type="submit"]');
  const submitError = document.getElementById('submit-error');
  const done = document.getElementById('quote-done');
  let files = [];

  function setError(input, invalid) {
    input.setAttribute('aria-invalid', String(invalid));
    document.getElementById(`${input.name}-error`).hidden = !invalid;
    return invalid;
  }

  function showFiles() {
    fileList.replaceChildren(...files.map((file) => {
      const remove = element('button', {type: 'button', textContent: 'Fjern'});
      remove.setAttribute('aria-label', `Fjern ${file.name}`);
      remove.addEventListener('click', () => {
        files = files.filter((kept) => kept !== file);
        showFiles();
      });
      return element('li', {}, [
        element('span', {className: 'file-name', textContent: file.name}),
        remove,
      ]);
    }));
  }

  fileInput.addEventListener('change', () => {
    const refused = [];
    for (const file of fileInput.files) {
      const allowed = FILE_TYPES.test(file.type) || HEIC_NAME.test(file.name);
      if (allowed && file.size <= MAX_FILE_BYTES && files.length < MAX_FILES) {
        files.push(file);
      } else {
        refused.push(file.name);
      }
    }
    fileInput.value = '';
    filesError.hidden = !refused.length;
    filesError.textContent =
      `Ikke tilføjet: ${refused.join(', ')}. Vi tager imod op til ` +
      `${MAX_FILES} billeder eller PDF-filer på højst 10 MB hver.`;
    showFiles();
  });

  // A field that was marked wrong is cleared as soon as it is corrected.
  form.addEventListener('input', (event) => {
    if (event.target.getAttribute('aria-invalid') === 'true') {
      setError(event.target, false);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const {name, phone, email, postcode, details} = form.elements;
    const checks = [
      [name, name.value.trim() !== ''],
      [phone, phone.value.replace(/\D/g, '').length >= 8],
      [email, email.value.trim() !== '' && email.validity.valid],
      [postcode, /^\d{4}$/.test(postcode.value.trim())],
      [details, details.value.trim() !== ''],
    ];
    const invalid = checks.filter(([input, ok]) => setError(input, !ok));
    if (invalid.length) {
      invalid[0][0].focus();
      return;
    }

    const body = new FormData(form);
    for (const file of files) {
      body.append('files', file);
    }
    submitError.hidden = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Sender …';
    const sent = await fetch(form.dataset.endpoint, {method: 'POST', body})
      .then((response) => response.ok, () => false);
    submitButton.disabled = false;
    submitButton.textContent = 'Send forespørgsel';

    if (!sent) {
      submitError.hidden = false;
      return;
    }
    const firstName = name.value.trim().split(/\s+/)[0];
    document.getElementById('done-text').textContent =
      `Tak, ${firstName}. Vi har modtaget din forespørgsel og kontakter ` +
      `dig på ${phone.value.trim()} hurtigst muligt.`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
}

function setUpReviews(reviews) {
  for (const button of document.querySelectorAll('[data-carousel]')) {
    button.addEventListener('click', () => {
      const step = reviews.firstElementChild.getBoundingClientRect().width + 20;
      reviews.scrollBy({left: Number(button.dataset.carousel) * step});
    });
  }
}

const quoteForm = document.getElementById('quote');
if (quoteForm) setUpQuoteForm(quoteForm);
const reviewList = document.getElementById('reviews');
if (reviewList) setUpReviews(reviewList);
