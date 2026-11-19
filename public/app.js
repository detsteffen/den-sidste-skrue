const dialog = document.getElementById('quote-dialog');
const form = document.getElementById('quote');
const steps = [...form.querySelectorAll('.step')];
const rail = document.getElementById('rail');
const railStops = [...rail.querySelectorAll('li')];
const progressLabel = document.getElementById('progress-label');
const taskButtons = [...form.querySelectorAll('[data-pick]')];
const groupButtons = [...form.querySelectorAll('[data-group-button]')];
const taskGroups = [...form.querySelectorAll('[data-group]')];
const questionBox = document.getElementById('task-questions');
const fileInput = document.getElementById('files');
const fileList = document.getElementById('file-list');
const filesError = document.getElementById('files-error');
const submitButton = form.querySelector('[type="submit"]');
const submitError = document.getElementById('submit-error');
// What the form asks about each task, written by the page from the
// service files.
const QUESTIONS = JSON.parse(
  document.getElementById('quote-questions').textContent);
const DONE_STEP = steps.length;
const QUESTION_STEPS = DONE_STEP - 1;
const MAX_FILES = 8;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const FILE_TYPES = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/;
// Some browsers report no type for photos taken on an iPhone.
const HEIC_NAME = /\.hei[cf]$/i;
const SENT_FIELDS = [
  'task', 'details', 'timing', 'address', 'postcode', 'name', 'phone',
  'email', 'website',
];

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

let currentStep = 1;
let files = [];

function isPostcode(code) {
  return /^\d{4}$/.test(code);
}

function showStep(number) {
  currentStep = number;
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

function element(tag, properties, children = []) {
  const node = Object.assign(document.createElement(tag), properties);
  node.append(...children);
  return node;
}

// Builds one question about the picked task: a row of choices when the
// question has options, otherwise a number with its unit.
function questionField(question, index) {
  const name = `question-${index}`;
  const label = element(
    'span', {className: 'field-label', id: name, textContent: question.label});
  if (!question.options) {
    const input = element('input', {name, inputMode: 'numeric'});
    input.setAttribute('aria-labelledby', name);
    const unit = element('span', {className: 'unit', textContent: question.unit});
    return element('div', {className: 'field'}, [
      label, element('div', {className: 'unit-input'}, [input, unit]),
    ]);
  }
  const options = question.options.map((option) => element(
    'label', {className: 'option'}, [
      element('input', {type: 'radio', name, value: option}),
      element('span', {textContent: option}),
    ]));
  const field = element('div', {className: 'field'}, [
    label, element('div', {className: 'options'}, options),
  ]);
  field.setAttribute('role', 'radiogroup');
  field.setAttribute('aria-labelledby', name);
  return field;
}

// Returns the answered questions about the task, keyed by the question.
function answers() {
  const given = {};
  const data = new FormData(form);
  (QUESTIONS[form.elements.task.value] ?? []).forEach((question, index) => {
    const value = data.get(`question-${index}`)?.trim();
    if (value) {
      given[question.label] =
        question.unit ? `${value} ${question.unit}` : value;
    }
  });
  return given;
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
  document.getElementById('sum-files').textContent =
    files.length ? `${files.length} vedhæftet` : 'Ingen endnu';
  document.getElementById('sum-area').textContent = area;
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
  summarise();
}

function pickTask(task) {
  form.elements.task.value = task;
  for (const button of taskButtons) {
    const picked = button.dataset.pick === task;
    button.setAttribute('aria-pressed', picked);
    if (picked) showGroup(button.closest('[data-group]').dataset.group);
  }
  questionBox.replaceChildren(...(QUESTIONS[task] ?? []).map(questionField));
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
  back.addEventListener('click', () => showStep(currentStep - 1));
}

for (const next of form.querySelectorAll('[data-next]')) {
  next.addEventListener('click', () => showStep(currentStep + 1));
}

form.addEventListener('input', (event) => {
  // A field that was marked wrong is cleared as soon as it is corrected.
  if (event.target.getAttribute('aria-invalid') === 'true') {
    setError(event.target, false);
  }
  summarise();
});

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

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  // Enter in a field submits the form; before the last step it means next.
  if (currentStep < QUESTION_STEPS) {
    showStep(currentStep + 1);
    return;
  }
  const {name, phone, email, postcode} = form.elements;
  const valid = validate([
    [name, name.value.trim() !== ''],
    [phone, digits(phone.value).length >= 8],
    [email, email.validity.valid],
    [postcode, isPostcode(postcode.value.trim())],
  ]);
  if (!valid) return;

  const body = new FormData();
  for (const field of SENT_FIELDS) {
    body.append(field, form.elements[field].value);
  }
  body.append('answers', JSON.stringify(answers()));
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
    `Tak, ${firstName}. Kasper kontakter dig på ${phone.value.trim()} ` +
    'hurtigst muligt.';
  showStep(DONE_STEP);
});

// The closing section has the same two actions as the fixed bar.
const offer = document.getElementById('tilbud');
if (offer) {
  new IntersectionObserver(([entry]) => {
    document
      .getElementById('mobile-bar')
      .classList.toggle('is-hidden', entry.isIntersecting);
  }).observe(offer);
}

// The house and the cards below it offer the same tasks, so pointing at
// one lights up the other.
function setUpHouse(stage) {
  const viewButtons = [...document.querySelectorAll('[data-view-button]')];
  const choiceLists = [...document.querySelectorAll('[data-view-list]')];
  const choices = [...document.querySelectorAll('.choice')];
  const houseParts = [...stage.querySelectorAll('[data-task]')];

  function highlight(task) {
    for (const part of [...houseParts, ...choices]) {
      part.classList.toggle('is-active', part.dataset.task === task);
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

  for (const part of [...houseParts, ...choices]) {
    const {task} = part.dataset;
    part.addEventListener('pointerenter', () => highlight(task));
    part.addEventListener('pointerleave', () => highlight(null));
    part.addEventListener('focusin', () => highlight(task));
    part.addEventListener('focusout', () => highlight(null));
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
}

// Area: the postcode check and the map answer the same question.
function setUpArea(checker) {
  const input = document.getElementById('checker-postcode');
  const result = document.getElementById('checker-result');
  const quote = document.getElementById('checker-quote');
  const map = document.getElementById('map');
  const towns = [...map.querySelectorAll('.town')];

  function check() {
    const code = input.value.trim();
    const town = AREA[code];
    for (const dot of towns) {
      dot.classList.toggle('is-here', dot.dataset.town === town);
    }
    result.classList.toggle('is-yes', Boolean(town));
    quote.hidden = !town;
    if (town) {
      result.textContent = `Ja, vi kører til ${code} ${town}.`;
    } else if (isPostcode(code)) {
      result.textContent =
        `${code} ligger uden for vores faste område. ` +
        'Ring, så finder vi ud af det.';
    } else {
      result.textContent = 'Skriv et postnummer på fire cifre.';
    }
  }

  checker.addEventListener('submit', (event) => {
    event.preventDefault();
    check();
  });
  for (const town of towns) {
    town.addEventListener('click', () => {
      input.value = town.dataset.postcode;
      check();
    });
  }
  quote.addEventListener('click', () => {
    form.elements.postcode.value = input.value.trim();
    summarise();
    openQuote();
  });
  new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    map.classList.add('is-visible');
    observer.disconnect();
  }).observe(map);
}

const menuButton = document.querySelector('.menu-button');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', open);
});

const stage = document.getElementById('stage');
if (stage) setUpHouse(stage);
const checker = document.getElementById('checker');
if (checker) setUpArea(checker);
