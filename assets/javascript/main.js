// Get the user's colour scheme preference.
// https://codepen.io/MrGrigri/pen/XQmWBv
function preference() {
  if (!window.matchMedia('(prefers-color-scheme)').matches) { return undefined };
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) { return 'dark' };
  if (window.matchMedia('(prefers-color-scheme: light)').matches) { return 'light' };
  if (window.matchMedia('(prefers-color-scheme: no-preference)').matches) { return 'none' };
};

// Let's make a jQuery-like slector
function $(selector, context) {
  return (context || document).querySelectorAll(selector);
};

function shouldSetToDarkScheme() {
  getUserPreference() === 'dark' && document.querySelector('body').className !== 'dark';
};

// Toggle dark/light colorScheme.
function toggleColorScheme() {
  $('.icon-wrap')[0].classList.toggle('active');
  $('body')[0].classList.toggle('dark');
};

function getUserPreference() {
  if(localStorage.getItem('colorScheme') === null) {
    return preference();
  }
  return localStorage.getItem('colorScheme');
};

// Store this setting for the next request!
function setUserPreference() {
  // localStorage only saves strings. Booleans will get stringified here.
  localStorage.setItem('colorScheme', (getUserPreference() === 'dark' ? 'light' : 'dark'));
};

function reqListener () {
  console.log(this.responseText);
}

async function fetchPage(url) {
  const resp = await fetch(url);
  return resp.text();
};

const localXHR = new Event('localXHR');
const parser = new DOMParser();

function renderHTML(html) {
  var htmlDoc = parser.parseFromString(html, 'text/html');
  if(getUserPreference() == 'dark') {
    htmlDoc.querySelector('.icon-wrap').className = 'active';
    htmlDoc.querySelector('body').className = 'dark';
  }
  $('body')[0].innerHTML = htmlDoc.getElementsByTagName('body')[0].innerHTML;
  document.dispatchEvent(localXHR);
};

function initialize() {
  shouldSetToDarkScheme() ? toggleColorScheme() : '';

  // Find all links to cassidy.codes and turn them into XHR requests.
  var $internalLinks = $("a[href^='http://localhost:1313']");
  $internalLinks.forEach(function(anchorTag) {
    anchorTag.addEventListener('click', async function(e) {
      e.preventDefault();
      var html = await fetchPage(anchorTag.getAttribute('href'));
      renderHTML(html);
    });
  });

  // And select the elements we're going to be working with.
  // The slector returns a NodeList, but we only care about the first one.
  $('.mask')[0].addEventListener('click', function() {
    toggleColorScheme();
    setUserPreference();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initialize();
});

document.addEventListener('localXHR', function () {
  initialize();
});
