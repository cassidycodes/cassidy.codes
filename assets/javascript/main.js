document.addEventListener('DOMContentLoaded', function () {
  // Let's make a jQuery-like slector
  function $(selector, context) {
    return (context || document).querySelectorAll(selector);
  }

  // Toggle dark/light mode.
  function toggleMode() {
    $('.icon-wrap')[0].classList.toggle('active');
    $('body')[0].classList.toggle('dark');
  };

  // Store this setting for the next request!
  function saveSetting() {
    // localStorage only saves strings. Booleans will get stringified here.
    var darkmode = localStorage.getItem('mode');
    localStorage.setItem('mode', (darkmode == 'dark' ? 'light' : 'dark'));
  };

  localStorage.getItem('mode') == 'dark' ? toggleMode() : '';

  // And select the elements we're going to be working with.
  // The slector returns a NodeList, but we only care about the first one.
  $('.mask')[0].addEventListener('click', function() {
    toggleMode();
    saveSetting();
  });
});
