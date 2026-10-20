(function () {
  "use strict";

  var DATA_URL = "data/orologerie.json";
  var lista = document.getElementById("lista");
  var conteggio = document.getElementById("conteggio");
  var selCitta = document.getElementById("filtro-citta");
  var selServizio = document.getElementById("filtro-servizio");
  var testo = document.getElementById("filtro-testo");
  var elencoCitta = document.getElementById("elenco-citta");

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function nomeCitta(data, id) {
    var c = data.citta.find(function (x) { return x.id === id; });
    return c ? c.nome : id;
  }

  function render(data, filtri) {
    var q = filtri.testo.trim().toLowerCase();
    var risultati = data.orologerie.filter(function (o) {
      if (filtri.citta && o.citta !== filtri.citta) return false;
      if (filtri.servizio && o.servizi.indexOf(filtri.servizio) === -1) return false;
      if (q) {
        var blob = (o.nome + " " + o.storia + " " + o.marche.join(" ")).toLowerCase();
        if (blob.indexOf(q) === -1) return false;
      }
      return true;
    });

    lista.innerHTML = "";
    risultati.forEach(function (o) {
      var li = el("li", "card");
      li.appendChild(el("h3", "", o.nome));
      var meta = nomeCitta(data, o.citta) + (o.anno ? " · dal " + o.anno : "");
      li.appendChild(el("p", "meta", meta));
      li.appendChild(el("p", "", o.storia));
      var tags = el("div", "tags");
      o.servizi.concat(o.marche).forEach(function (t) { tags.appendChild(el("span", "tag", t)); });
      li.appendChild(tags);
      lista.appendChild(li);
    });

    conteggio.textContent = risultati.length === 0
      ? "Nessuna orologeria trovata con questi filtri."
      : risultati.length + (risultati.length === 1 ? " orologeria trovata" : " orologerie trovate");
  }

  function leggiFiltri() {
    return { citta: selCitta.value, servizio: selServizio.value, testo: testo.value };
  }

  function init(data) {
    data.citta.forEach(function (c) {
      selCitta.appendChild(el("option", "", c.nome)).value = c.id;

      var card = el("button", "city");
      card.type = "button";
      card.appendChild(el("h3", "", c.nome));
      card.appendChild(el("p", "", c.descrizione));
      card.addEventListener("click", function () {
        selCitta.value = c.id;
        document.getElementById("cerca").scrollIntoView({ behavior: "smooth" });
        render(data, leggiFiltri());
      });
      elencoCitta.appendChild(card);
      if (c.pagina) {
        var guida = el("a", "city-link", "Guida di " + c.nome + " →");
        guida.href = c.id + "/";
        elencoCitta.appendChild(guida);
      }
    });

    var aggiorna = function () { render(data, leggiFiltri()); };
    selCitta.addEventListener("change", aggiorna);
    selServizio.addEventListener("change", aggiorna);
    testo.addEventListener("input", aggiorna);
    render(data, leggiFiltri());
  }

  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(init)
    .catch(function (err) {
      conteggio.textContent = "Impossibile caricare l'elenco (" + err.message + ").";
    });
})();
