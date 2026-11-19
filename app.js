const dialog = document.getElementById('quote-dialog');
const form = document.getElementById('quote');
const steps = [...form.querySelectorAll('.step')];
const rail = document.getElementById('rail');
const railStops = [...rail.querySelectorAll('li')];
const progressLabel = document.getElementById('progress-label');
const taskButtons = [...form.querySelectorAll('[data-pick]')];
const groupButtons = [...form.querySelectorAll('[data-group-button]')];
const taskGroups = [...form.querySelectorAll('[data-group]')];
const submitButton = form.querySelector('[type="submit"]');
const submitError = document.getElementById('submit-error');
const DONE_STEP = steps.length;
const QUESTION_STEPS = DONE_STEP - 1;

// The postcodes we drive to, and the district each one belongs to.
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

function isPostcode(code) {
  return /^\d{4}$/.test(code);
}

function showStep(number) {
  for (const step of steps) {
    step.hidden = Number(step.dataset.step) !== number;
  }
  const done = number === DONE_STEP;
  const reached = Math.min(number, QUESTION_STEPS) - 1;
  rail.style.setProperty('--p', done ? 1 : reached / (QUESTION_STEPS - 1));
  railStops.forEach((stop, i) => {
    stop.classList.toggle('is-current', !done && i === reached);
  });
  progressLabel.textContent =
    done ? 'Sendt' : `Trin ${number} af ${QUESTION_STEPS}`;
  steps[number - 1].querySelector('legend, h3').focus({preventScroll: true});
}

function showGroup(group) {
  for (const button of groupButtons) {
    button.setAttribute('aria-pressed', button.dataset.groupButton === group);
  }
  for (const tasks of taskGroups) {
    tasks.hidden = tasks.dataset.group !== group;
  }
}

// Keeps the summary beside the steps, and the postcode hint, up to date.
function summarise() {
  const {task, timing, postcode} = form.elements;
  const code = postcode.value.trim();
  const town = AREA[code];
  const hint = document.getElementById('postcode-hint');
  let area = 'Ikke udfyldt endnu';
  hint.textContent = '';
  if (town) {
    area = `${code} ${town}`;
    hint.textContent = `Vi kører til ${town}.`;
  } else if (isPostcode(code)) {
    area = code;
    hint.textContent =
      'Uden for vores faste område. Send alligevel, så vender vi tilbage.';
  }
  hint.classList.toggle('is-yes', Boolean(town));
  document.getElementById('sum-task').textContent =
    task.value || 'Ikke valgt endnu';
  document.getElementById('sum-timing').textContent =
    timing.value || 'Ikke valgt endnu';
  document.getElementById('sum-area').textContent = area;
}

function pickTask(task) {
  form.elements.task.value = task;
  for (const button of taskButtons) {
    const picked = button.dataset.pick === task;
    button.setAttribute('aria-pressed', picked);
    if (picked) showGroup(button.closest('[data-group]').dataset.group);
  }
  summarise();
  showStep(2);
}

function openQuote(task) {
  dialog.showModal();
  if (task) pickTask(task);
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
  if (validate([[postcode, isPostcode(postcode.value.trim())]])) {
    showStep(3);
  }
}

for (const opener of document.querySelectorAll('[data-open-quote]')) {
  opener.addEventListener('click', () => openQuote(opener.dataset.task));
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

for (const button of groupButtons) {
  button.addEventListener('click', () => {
    showGroup(button.dataset.groupButton);
  });
}

for (const back of form.querySelectorAll('[data-back]')) {
  back.addEventListener('click', () => {
    showStep(Number(back.closest('.step').dataset.step) - 1);
  });
}

form.querySelector('[data-next]').addEventListener('click', leaveDetails);
form.addEventListener('input', summarise);

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
    `Tak, ${firstName}. Kasper kontakter dig på ${phone.value.trim()} ` +
    'hurtigst muligt.';
  showStep(DONE_STEP);
});

// The closing section has the same two actions as the fixed bar.
new IntersectionObserver(([entry]) => {
  document
    .getElementById('mobile-bar')
    .classList.toggle('is-hidden', entry.isIntersecting);
}).observe(document.getElementById('tilbud'));

// The house and the cards below it offer the same tasks, so pointing at
// one lights up the other.
const stage = document.getElementById('stage');
const viewButtons = [...document.querySelectorAll('[data-view-button]')];
const choiceLists = [...document.querySelectorAll('[data-view-list]')];
const choices = [...document.querySelectorAll('.choice')];
const houseParts = [...stage.querySelectorAll('[data-task]')];

function highlight(task) {
  for (const element of [...houseParts, ...choices]) {
    element.classList.toggle('is-active', element.dataset.task === task);
  }
}

function setView(view) {
  stage.dataset.view = view;
  for (const button of viewButtons) {
    button.setAttribute('aria-pressed', button.dataset.viewButton === view);
  }
  for (const list of choiceLists) {
    list.hidden = list.dataset.viewList !== view;
  }
  showGroup(view);
}

for (const element of [...houseParts, ...choices]) {
  const {task} = element.dataset;
  element.addEventListener('pointerenter', () => highlight(task));
  element.addEventListener('pointerleave', () => highlight(null));
  element.addEventListener('focus', () => highlight(task));
  element.addEventListener('blur', () => highlight(null));
}

for (const part of houseParts) {
  part.addEventListener('click', () => openQuote(part.dataset.task));
}

// A tap never sends pointerleave, so clear the highlight afterwards.
dialog.addEventListener('close', () => highlight(null));

for (const entrance of stage.querySelectorAll('[data-enter]')) {
  entrance.addEventListener('click', () => setView('inde'));
}

for (const button of viewButtons) {
  button.addEventListener('click', () => setView(button.dataset.viewButton));
}

// Area: the postcode check and the map answer the same question.
const checkerInput = document.getElementById('checker-postcode');
const checkerResult = document.getElementById('checker-result');
const checkerQuote = document.getElementById('checker-quote');
const towns = [...document.querySelectorAll('.town')];

function checkPostcode() {
  const code = checkerInput.value.trim();
  const town = AREA[code];
  for (const dot of towns) {
    dot.classList.toggle('is-here', dot.dataset.town === town);
  }
  checkerResult.classList.toggle('is-yes', Boolean(town));
  checkerQuote.hidden = !town;
  if (town) {
    checkerResult.textContent = `Ja, vi kører til ${code} ${town}.`;
  } else if (isPostcode(code)) {
    checkerResult.textContent =
      `${code} ligger uden for vores faste område. ` +
      'Ring på 12 34 56 78, så finder vi ud af det.';
  } else {
    checkerResult.textContent = 'Skriv et postnummer på fire cifre.';
  }
}

document.getElementById('checker').addEventListener('submit', (event) => {
  event.preventDefault();
  checkPostcode();
});

for (const town of towns) {
  town.addEventListener('click', () => {
    checkerInput.value = town.dataset.postcode;
    checkPostcode();
  });
}

checkerQuote.addEventListener('click', () => {
  form.elements.postcode.value = checkerInput.value.trim();
  summarise();
  openQuote();
});

new IntersectionObserver(([entry], observer) => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('is-visible');
  observer.disconnect();
}).observe(document.getElementById('map'));
