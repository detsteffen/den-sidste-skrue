const dialog = document.getElementById('quote-dialog');
const form = document.getElementById('quote');
const steps = [...form.querySelectorAll('.step')];
const stepScrews = [...form.querySelectorAll('.progress .screw')];
const progressLabel = document.getElementById('progress-label');
const taskButtons = [...form.querySelectorAll('[data-pick]')];
const submitButton = form.querySelector('[type="submit"]');
const submitError = document.getElementById('submit-error');
const DONE_STEP = steps.length;

function showStep(number) {
  for (const step of steps) {
    step.hidden = Number(step.dataset.step) !== number;
  }
  stepScrews.forEach((screw, i) => {
    screw.classList.toggle('is-done', i < number - 1);
  });
  progressLabel.textContent =
    number === DONE_STEP ? 'Sendt' : `Trin ${number} af ${DONE_STEP - 1}`;
  steps[number - 1].querySelector('legend, h3').focus({preventScroll: true});
}

function pickTask(task) {
  form.elements.task.value = task;
  for (const button of taskButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.pick === task));
  }
  showStep(2);
}

function setError(input, invalid) {
  input.setAttribute('aria-invalid', String(invalid));
  document.getElementById(`${input.name}-error`).hidden = !invalid;
  return invalid;
}

// Returns true when every field is valid; focuses the first invalid one.
function validate(checks) {
  const invalid = checks.filter(([input, ok]) => setError(input, !ok));
  if (invalid.length) invalid[0][0].focus();
  return !invalid.length;
}

function digits(value) {
  return value.replace(/\D/g, '');
}

function leaveDetails() {
  const {postcode} = form.elements;
  if (validate([[postcode, /^\d{4}$/.test(postcode.value.trim())]])) {
    showStep(3);
  }
}

for (const opener of document.querySelectorAll('[data-open-quote]')) {
  opener.addEventListener('click', () => {
    dialog.showModal();
    if (opener.dataset.task) pickTask(opener.dataset.task);
  });
}

for (const closer of dialog.querySelectorAll('[data-close]')) {
  closer.addEventListener('click', () => dialog.close());
}

// A click on the backdrop lands on the dialog element itself.
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

for (const button of taskButtons) {
  button.addEventListener('click', () => pickTask(button.dataset.pick));
}

for (const back of form.querySelectorAll('[data-back]')) {
  back.addEventListener('click', () => {
    showStep(Number(back.closest('.step').dataset.step) - 1);
  });
}

form.querySelector('[data-next]').addEventListener('click', leaveDetails);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  // Enter in a details field submits the form before the contact step.
  if (steps[2].hidden) {
    leaveDetails();
    return;
  }
  const {name, phone, email} = form.elements;
  const valid = validate([
    [name, name.value.trim() !== ''],
    [phone, digits(phone.value).length >= 8],
    [email, email.validity.valid],
  ]);
  if (!valid) return;

  submitError.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = 'Sender …';
  const sent = await fetch('/api/lead', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(Object.fromEntries(new FormData(form))),
  }).then((response) => response.ok, () => false);
  submitButton.disabled = false;
  submitButton.textContent = 'Send forespørgsel';

  if (!sent) {
    submitError.hidden = false;
    return;
  }
  const firstName = name.value.trim().split(/\s+/)[0];
  document.getElementById('done-text').textContent =
    `Tak, ${firstName}. Kasper ringer til dig på ${phone.value.trim()} ` +
    'inden for én hverdag.';
  showStep(DONE_STEP);
});

// The closing section has the same two actions as the fixed bar.
new IntersectionObserver(([entry]) => {
  document
    .getElementById('mobile-bar')
    .classList.toggle('is-hidden', entry.isIntersecting);
}).observe(document.getElementById('tilbud'));

// Chips and house parts name the same tasks, so each lights up the other.
const taskStarters = [...document.querySelectorAll('.hero [data-task]')];

function highlight(task) {
  for (const starter of taskStarters) {
    starter.classList.toggle('is-active', starter.dataset.task === task);
  }
}

for (const starter of taskStarters) {
  const {task} = starter.dataset;
  starter.addEventListener('pointerenter', () => highlight(task));
  starter.addEventListener('pointerleave', () => highlight(null));
  starter.addEventListener('focus', () => highlight(task));
  starter.addEventListener('blur', () => highlight(null));
}

// A tap never sends pointerleave, so clear the highlight afterwards.
dialog.addEventListener('close', () => highlight(null));

const AREA = {
  8000: 'Aarhus C',
  8200: 'Aarhus N',
  8210: 'Aarhus V',
  8220: 'Brabrand',
  8230: 'Åbyhøj',
  8240: 'Risskov',
  8245: 'Risskov',
  8250: 'Egå',
  8260: 'Viby',
  8270: 'Højbjerg',
  8310: 'Tranbjerg',
  8320: 'Mårslet',
  8330: 'Beder',
  8340: 'Malling',
  8355: 'Solbjerg',
  8361: 'Hasselager',
  8380: 'Trige',
  8381: 'Tilst',
  8462: 'Harlev',
  8471: 'Sabro',
  8520: 'Lystrup',
  8530: 'Hjortshøj',
  8541: 'Skødstrup',
};
const checkerInput = document.getElementById('checker-postcode');
const checkerResult = document.getElementById('checker-result');
const checkerQuote = document.getElementById('checker-quote');
const towns = [...document.querySelectorAll('.town')];

document.getElementById('checker').addEventListener('submit', (event) => {
  event.preventDefault();
  const code = checkerInput.value.trim();
  const town = AREA[code];
  for (const dot of towns) {
    dot.classList.toggle('is-here', dot.dataset.town === town);
  }
  checkerResult.classList.toggle('is-yes', Boolean(town));
  checkerQuote.hidden = !town;
  if (town) {
    checkerResult.textContent = `Ja, vi kører til ${code} ${town}.`;
  } else if (/^\d{4}$/.test(code)) {
    checkerResult.textContent =
      `${code} ligger uden for vores faste område. ` +
      'Ring på 12 34 56 78, så finder vi ud af det.';
  } else {
    checkerResult.textContent = 'Skriv et postnummer på fire cifre.';
  }
});

checkerQuote.addEventListener('click', () => {
  form.elements.postcode.value = checkerInput.value.trim();
  dialog.showModal();
});

new IntersectionObserver(([entry], observer) => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('is-visible');
  observer.disconnect();
}).observe(document.getElementById('map'));
