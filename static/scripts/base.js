'use strict';

window.addEventListener('DOMContentLoaded', function () {
  var $input = document.querySelector('input'),
      $result = document.querySelector('div'),
      $tbody = document.querySelector('tbody'),
      $status = document.querySelector('[role="status"]'),
      req = new XMLHttpRequest(),
      async_queue = [],
      names = [];

  req.addEventListener('load', function () {
    var data = JSON.parse(req.responseText),
        rows = [];

    if (!data || !data.monument) {
      $status.textContent = 'Couldn’t load the data :(';
      return;
    }

    data.monument.forEach(function (person) {
      names.push(person.name.toLowerCase());
      rows.push('<tr><td><a href="https://mozillians.org/search/?q=' + encodeURI(person.name) +'">' +
                person.name + '</a></td>' +
                '<td><a href="http://people.mozilla.org/SF_Monument/IMAGES/' +
                { '1': 'front', '2': 'left', '3': 'back', '4': 'right' }[person.side] + '_' +
                { 'upper': 'top', 'lower': 'bottom' }[person.panel] + '.jpg">' +
                [person.side, person.panel, person.row, person.number].join(', ') + '</a></td></tr>');
    });

    $tbody.innerHTML = rows.join('');
    $input.placeholder = 'Name';
    $input.disabled = false;
    $input.focus();

    window.dispatchEvent(new CustomEvent('hashchange'));
  });

  req.addEventListener('error', function () {
    $status.textContent = 'Couldn’t load the data :(';
  });

  req.open('GET', '/mozument-finder/lib/mozmonument2json/mozmonument.json', true);
  req.overrideMimeType('application/json; charset=utf-8');
  req.send();

  $input.addEventListener('input', function () {
    var query = $input.value;

    history.replaceState({}, document.title, (query) ? '#' + encodeURI(query) : '.');

    if (!query || query.length < 3) {
      $result.hidden = true;
      $status.textContent = 'Type more!';
      return;
    }

    async_queue.push(function () {
      var re = new RegExp(query.toLowerCase()),
          count = 0;

      names.forEach(function (name, index) {
        var match = re.test(name);

        if (match) {
          count++;
        }

        $tbody.rows[index].hidden = !match;
      });

      $result.hidden = count === 0;
      $status.textContent = (count === 0) ? 'Not Found :(' : '';
    });

    window.postMessage('AsyncEvent', location.origin || location.protocol + '//' + location.host);
  })

  window.addEventListener('message', function (event) {
    if (event.source === window && event.data === 'AsyncEvent' && async_queue.length) {
      async_queue.shift().call();
    }
  });

  window.addEventListener('hashchange', function () {
    if (location.hash) {
      var query = decodeURI(location.hash.substr(1));

      if (query) {
        $input.value = query;
        $input.dispatchEvent(new CustomEvent('input'));
      }
    }
  });
});
