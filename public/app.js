const MAX_FILES = 8;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const FILE_TYPES = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/;
// Some browsers report no type for photos taken on an iPhone.
const HEIC_NAME = /\.hei[cf]$/i;
const PREVIEWABLE = /^image\/(jpeg|png|webp)$/;
const SLIDE_MS = 5500;

const root = document.documentElement;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

function element(tag, properties, children = []) {
  const node = Object.assign(document.createElement(tag), properties);
  node.append(...children);
  return node;
}

function setUpHeader() {
  const button = document.querySelector('.menu-button');

  function setOpen(open) {
    root.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', open);
  }

  button.addEventListener('click', () => {
    setOpen(!root.classList.contains('menu-open'));
  });
  // A link to a section of the page that is already open does not reload it.
  document.getElementById('site-nav').addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('menu-open')) {
      setOpen(false);
      button.focus();
    }
  });

  new IntersectionObserver(([entry]) => {
    root.classList.toggle('is-scrolled', !entry.isIntersecting);
  }).observe(document.getElementById('top-sentinel'));
}

function setUpReveals() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    }
  }, {rootMargin: '0px 0px -8% 0px'});
  for (const node of document.querySelectorAll('[data-reveal]')) {
    observer.observe(node);
  }
}

// The bar at the bottom of a phone steps aside wherever the page shows the
// same buttons itself.
function setUpMobileBar() {
  const shown = new Set();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        shown.add(entry.target);
      } else {
        shown.delete(entry.target);
      }
    }
    root.classList.toggle('bar-hidden', shown.size > 0);
  });
  for (const node of document.querySelectorAll('[data-own-cta]')) {
    observer.observe(node);
  }
}

function setUpSlides(arch) {
  const slides = [...arch.querySelectorAll('.slide')];
  const dots = [...arch.querySelectorAll('.slide-dots button')];
  let current = 0;
  let timer;

  function show(index) {
    current = index % slides.length;
    slides.forEach((slide, position) => {
      slide.classList.toggle('is-current', position === current);
    });
    dots.forEach((dot, position) => {
      if (position === current) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  function pause() {
    clearInterval(timer);
  }

  function play() {
    pause();
    if (!calm) timer = setInterval(() => show(current + 1), SLIDE_MS);
  }

  dots.forEach((dot, position) => {
    dot.addEventListener('click', () => show(position));
  });
  arch.addEventListener('pointerenter', pause);
  arch.addEventListener('pointerleave', play);
  arch.addEventListener('focusin', pause);
  arch.addEventListener('focusout', play);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
    } else {
      play();
    }
  });
  play();
}

function setUpPanels(container) {
  const panels = [...container.querySelectorAll('.panel')];

  function open(panel) {
    for (const other of panels) {
      other.classList.toggle('is-open', other === panel);
      other.querySelector('.panel-open')
        .setAttribute('aria-expanded', other === panel);
    }
  }

  for (const panel of panels) {
    panel.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') open(panel);
    });
    panel.querySelector('.panel-open').addEventListener('click', () => {
      open(panel);
      // The button leaves with the click, so focus moves on to the link.
      panel.querySelector('a').focus({preventScroll: true});
    });
  }
}

function thumbnail(file) {
  if (!PREVIEWABLE.test(file.type)) {
    const label = file.type === 'application/pdf' ? 'PDF' : 'HEIC';
    return element('span', {className: 'file-thumb', textContent: label});
  }
  const image = element('img', {className: 'file-thumb', alt: ''});
  image.addEventListener('load', () => URL.revokeObjectURL(image.src));
  image.src = URL.createObjectURL(file);
  return image;
}

function setUpQuoteForm(form) {
  const dropzone = document.getElementById('dropzone');
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
      const remove = element('button', {type: 'button', textContent: '×'});
      remove.setAttribute('aria-label', `Fjern ${file.name}`);
      remove.addEventListener('click', () => {
        files = files.filter((kept) => kept !== file);
        showFiles();
      });
      return element('li', {}, [
        thumbnail(file),
        element('span', {className: 'file-name', textContent: file.name}),
        remove,
      ]);
    }));
  }

  function addFiles(added) {
    const refused = [];
    for (const file of added) {
      const allowed = FILE_TYPES.test(file.type) || HEIC_NAME.test(file.name);
      if (allowed && file.size <= MAX_FILE_BYTES && files.length < MAX_FILES) {
        files.push(file);
      } else {
        refused.push(file.name);
      }
    }
    filesError.hidden = !refused.length;
    filesError.textContent =
      `Ikke tilføjet: ${refused.join(', ')}. Vi tager imod op til ` +
      `${MAX_FILES} billeder eller PDF-filer på højst 10 MB hver.`;
    showFiles();
  }

  fileInput.addEventListener('change', () => {
    addFiles(fileInput.files);
    fileInput.value = '';
  });
  for (const type of ['dragenter', 'dragover']) {
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add('is-over');
    });
  }
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-over');
  });
  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-over');
    addFiles(event.dataTransfer.files);
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
  const buttons = document.querySelector('.carousel-buttons');
  buttons.hidden = reviews.scrollWidth <= reviews.clientWidth;
  buttons.addEventListener('click', (event) => {
    const button = event.target.closest('[data-carousel]');
    if (!button) return;
    const step = reviews.firstElementChild.getBoundingClientRect().width + 20;
    reviews.scrollBy({left: Number(button.dataset.carousel) * step});
  });
}

// Marks the section being read in an article's table of contents.
function setUpContents(toc) {
  const links = [...toc.querySelectorAll('a')];
  const targets = links.map((link) =>
    document.getElementById(link.getAttribute('href').slice(1)));
  let frame = 0;

  function mark() {
    frame = 0;
    const line = innerHeight * 0.3;
    const current = targets.findLastIndex(
      (target) => target.getBoundingClientRect().top < line);
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  addEventListener('scroll', () => {
    frame ||= requestAnimationFrame(mark);
  }, {passive: true});
  mark();
}

setUpHeader();
setUpReveals();
setUpMobileBar();
const contents = document.querySelector('.toc');
if (contents) setUpContents(contents);
const slideArch = document.getElementById('slides');
if (slideArch) setUpSlides(slideArch);
const panelRow = document.getElementById('panels');
if (panelRow) setUpPanels(panelRow);
const quoteForm = document.getElementById('quote');
if (quoteForm) setUpQuoteForm(quoteForm);
const reviewList = document.getElementById('reviews');
if (reviewList) setUpReviews(reviewList);
