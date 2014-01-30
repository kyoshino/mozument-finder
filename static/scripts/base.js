'use strict';

window.addEventListener('DOMContentLoaded', function () {
  var $input = document.querySelector('input'),
      $result = document.querySelector('div'),
      $status = document.querySelector('[role="status"]'),
      req = new XMLHttpRequest(),
      async_queue = [],
      rows = [],
      names = [];

  req.addEventListener('load', function () {
    var data = JSON.parse(req.responseText);

    if (!data || !data.monument) {
      $status.textContent = 'Couldn’t load the data :(';
      return;
    }

    data.monument.forEach(function (person) {
      names.push(person.name.toLowerCase());
      rows.push('<tr>' +
                '<td>' + person.name + '</td>' +
                '<td>' + [person.side, person.panel, person.row, person.number].join(', ') + '</td>' +
                '</tr>');
    });

    $result.innerHTML = '<table>'
                      + '<thead><tr><th>Name</th><th>Side, Panel, Row, Number</th></tr></thead>'
                      + '<tbody>' + rows.join('') + '</tbody>'
                      + '</table>';
    $input.placeholder = 'Name';
    $input.disabled = false;
    $input.focus();
    rows = document.querySelector('tbody').rows;
  });
  req.open('GET', '/mozument-finder/lib/mozmonument2json/mozmonument.json', true);
  req.overrideMimeType('application/json; charset=utf-8');
  req.send();

  $input.addEventListener('input', function () {
    var query = $input.value;

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

        rows[index].hidden = !match;
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
});
