// Get the user's colour scheme preference.
// https://codepen.io/MrGrigri/pen/XQmWBv
function systemColorSchemePreference() {
  if (!window.matchMedia('(prefers-color-scheme)').matches) { return undefined };
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) { return 'dark' };
  if (window.matchMedia('(prefers-color-scheme: light)').matches) { return 'light' };
  if (window.matchMedia('(prefers-color-scheme: no-preference)').matches) { return 'none' };
};

// Toggle dark/light colorScheme.
function toggleColorScheme() {
  document.querySelector('.icon-wrap').classList.toggle('active');
  document.querySelector('body').classList.toggle('dark');
};

function getColorSchemePreference() {
  if(localStorage.getItem('colorScheme') === null) {
    return systemColorSchemePreference();
  }
  return localStorage.getItem('colorScheme');
};

// Store this setting for the next request!
function setUserPreference() {
  // localStorage only saves strings. Booleans will get stringified here.
  localStorage.setItem('colorScheme', (getColorSchemePreference() === 'dark' ? 'light' : 'dark'));
};

async function fetchPage(url) {
  const resp = await fetch(url);
  return resp.text();
};

const localXHR = new Event('localXHR');
const parser = new DOMParser();

function renderHTML(html) {
  var htmlDoc = parser.parseFromString(html, 'text/html');
  if(getColorSchemePreference() == 'dark') {
    htmlDoc.querySelector('.icon-wrap').className = 'active';
    htmlDoc.querySelector('body').className = 'dark';
  }
  document.querySelector('body').innerHTML = htmlDoc.querySelector('body').innerHTML;
  document.dispatchEvent(localXHR);
};

function initialize() {
  // Find all links to cassidy.codes and turn them into XHR requests.
  document.querySelectorAll("a[href^='http://localhost:1313']").forEach(function(anchorTag) {
    anchorTag.addEventListener('click', async function(e) {
      e.preventDefault();
      var html = await fetchPage(anchorTag.getAttribute('href'));
      renderHTML(html);
    });
  });

  // And select the elements we're going to be working with.
  // The slector returns a NodeList, but we only care about the first one.
  document.querySelector('.mask').addEventListener('click', function() {
    toggleColorScheme();
    setUserPreference();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  getColorSchemePreference() === 'dark' ? toggleColorScheme() : '';
  initialize();
});

document.addEventListener('localXHR', function () {
  // We have to re-initialize our "click" listeners here!
  initialize();
});
