// Get the user's color scheme preference.
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
}

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

document.addEventListener('DOMContentLoaded', function () {
  getUserPreference() === 'dark' ? toggleColorScheme() : '';

  // And select the elements we're going to be working with.
  // The slector returns a NodeList, but we only care about the first one.
  $('.mask')[0].addEventListener('click', function() {
    toggleColorScheme();
    setUserPreference();
  });
});
