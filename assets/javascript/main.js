document.addEventListener('DOMContentLoaded', function () {
  // Let's make a jQuery-like slector
  function $(selector, context) {
    return (context || document).querySelectorAll(selector);
  }

  // And select the elements we're going to be working with.
  var $toggle = $('.mask')[0];

  // The slector returns a NodeList, but we only care about the first one.
  $toggle.addEventListener('click', function() {
    $('.icon-wrap')[0].classList.toggle('active');
    $('body')[0].classList.toggle('dark');
  });
});
