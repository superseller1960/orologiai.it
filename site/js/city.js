(function () {
  "use strict";

  var script = document.currentScript;
  var cityId = script && script.getAttribute("data-city");
  var lista = document.getElementById("lista-citta");

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function mostra(data) {
    var orologerie = data.orologerie.filter(function (o) { return o.citta === cityId; });
    if (orologerie.length === 0) {
      lista.appendChild(el("li", "empty", "Nessuna orologeria presente per questa città."));
      return;
    }
    orologerie.forEach(function (o) {
      var li = el("li", "card");
      li.appendChild(el("h3", "", o.nome));
      li.appendChild(el("p", "meta", o.anno ? "Dal " + o.anno : "Anno non indicato"));
      li.appendChild(el("p", "", o.storia));
      var tags = el("div", "tags");
      o.servizi.concat(o.marche).forEach(function (t) { tags.appendChild(el("span", "tag", t)); });
      li.appendChild(tags);
      lista.appendChild(li);
    });
  }

  fetch("../data/orologerie.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(mostra)
    .catch(function (err) {
      lista.appendChild(el("li", "empty", "Impossibile caricare l'elenco (" + err.message + ")."));
    });
})();
