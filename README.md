# Studio del codice della libreria Riot 1.0.0


La guida sarà divisa in "Giorni" dove ogni giorno equivale ad una tag (in inglese) su GIT.

# Giorno 1

## Preparazione dell'ambiente di sviluppo

Vediamo la creazione del file di applicazione e del documento web.

*Premessa:* sto cercando di non usare nulla che sia jQuery. Per cui quando l'applicazione a corredo usa jQuery con $, io uso il document.

Sapendo che la REPLACE della regex può accettare anche una funzione, come secondo parametro che viene invocata per creare la nuova sotto stringa in sostituzione della regexp/sottostringa sorgente. Attenzione al replacement pattern $n.

*Occorrente Iniziale*: Un file app.js così fatto:

```javascript
var root = document.getElementById('todo-list'),
  template = document.querySelector("[type='html/todo']").innerHTML,
  item = {
    id: 'item',
    name: 'Prova'
  },
  el = riot.render(template, item);

root.innerHTML = el;
```

ed un file index.html:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Studio Riot 1.0.0</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <script type="html/todo">
    <li id="{id}">
      <div class="view">
        <input class="toggle" type="checkbox">
        <label>{name}</label>
        <button class="destroy"/>
      </div>
      <input class="edit" value="{name}">
    </li>
  </script>
  <body>
    <h1>Studio Riot 1.0.0</h1>
    <ul id="todo-list"></ul>
    <script src="riot.js"></script>
    <script src="app.js"></script>
  </body>
</html>
```

# Creazione del template nella pagina web

Creo un template dell'elemento che voglio controllare dinamicamente:

```html
<script type="html/todo">
```

il type a html/todo serve per far ignorare lo script al browser in quanto il type non è riconosciuto ma il contenuto è comunque accessibile con una semplice:

```javascript
var template = document.querySelector("[type='html/todo']").innerHTML;
```

# Il codice RIOTJS

La struttura dello script RIOT è racchiusa in una IIFE:

```javascript
(function(riot) { 
  "use strict";
  
})(typeof top == "object" ? window.riot = {} : exports);
```

dove top è un alias di window (top === window ritorna true).
Costruisco quini un oggetto riot che aggancio all'oggetto globale window.

Vediamo in dettaglio l'operatore ternario presente nel passaggio del parametro riot alla funzione invocata immediatamente.
Javascript è un linguaggio che dipende dall'host environment, cioè dove girerà il nostro script. Solitamente l'ambiente host è il nostro browser, che esporrà una API per "dialogare" con la finestra dove avviene il caricamente del DOM. Questa API è detta BOM e nel browser, l'oggetto globale che espone proprietà e metodi di interfacciamento alla finestra è l'oggetto window.
L'organizzazione del codice in Javascript non prevede l'uso di Moduli (solo a partire da ES6) o di Namespace che evitano che il nostro codice intacchi troppo l'oggetto globale e creando possibili conflitti di nomi, con librerie di terze parti. Pertanto nel tempo sono stati approciati diversi modi e metodi come AMD e CommonJS.
Quando creiamo la nostra libreria, possiamo crearla affinchè possa essere utilizzata sia in ambiente Browser, sia in ambiente NodeJS o con sistemi che usano AMD come RequireJS. Ed è questo il motivo per cui esiste questo strano passaggio alla variabile locale riot.

Solitamente al posto di top, nelle librerie troviamo window:

```javascript
(typeof window == "object" ? window.riot = {} : exports);
```

Se mi trovo in un ambiente browser, il mio oggetto window non sarà undefined ma sarà un vero e proprio oggetto, quindi eseguirò il codice immediatamente dopo i "?" e quindi creo un oggetto vuoto che aggancio all'oggetto window. Ricorda, un oggetto in Javascript è dinamico, posso creare proprietà e metodi on-the-fly. Se invece mi trovassi in un ambiente NodeJS allora ho che exports è un oggetto (vuoto) che diventerà successivamente il mio oggetto riot.
In un ambiente NodeJS avrò:

```javascript
let riot = require('./riot.js');

console.log(riot);
```

Questo pattern è molto comune e ne troviamo di diversi. A titolo di esempio riporto la struttura utilizzata anche in jQuery:

```javascript
(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

}));
```

Procediamo con lo studio, togliendo tutto ciò che non è necessario e lasciando, mano a mano, solo le funzionalità che andremo a studiare.

La funzione che sto studiando è la render, il metodo di riot che prende il template contenuto nello script con type html/todo e lo costruisce sostituendo i valori di id e name contenuti nell'oggetto data.
Ma prima bisogna conoscere come funzione la:

```javascript
new Function()
```

in quanto viene utilizzata all'interno del metodo render. Perchè viene utilizzata? In realtà mi creo a runtime una funzione il cui ultimo argomento è sempre il body della funzione:

```javascript
var myFunction = new Function('x', 'y', 'return x * y');
```

La funzione render accetta tre parametri. Ignoriamo l'ultimo per il momento, i primi due rappresentano il template, cioè l'inner html che abbiamo appena prelevato e l'oggetto che conterrà i dati dinamici del template.
La funzione ritorna quello che posso chiamare un template "compilato", cioè un template con innestati i valori dell'oggetto data.
Il template viene inserito all'interno di un oggetto FN, a mò di cache. Se già presente, questo viene ritornato, altrimenti si crea una funzione a runtime che si esegue passando i valori: data ed escape_fn.
Ecco una vista super sintetizzata:

```javascript
var compiled = ( FN[tmpl] = FN[tmpl] || new Function("_", "e", "try { return 'elaborazione' }catch(e) { return '' }") )(data, escape_fn);
```

L'intento della funzione che andiamo a generare è  quella di ritornare un elemento HTML, cioè quello del template, con i valori dei dati passati, nel placeholder.

Dal codice, in maniera leggermente semplificata rispetto all'originale abbiamo:

```javascript
var func = new Function("_", " try { return '" +
  tmpl.replace(/[\\\n\r']/g).replace(/{\s*([\w\.]+)\s*}/g, "' + (_.$1||(_.$1==undefined?'':_.$1)) + '")
      + "' } catch(e) { return '' }");

return (FN[tmpl] = FN[tmpl] || func)(data);
```

che a runtime genera:

```javascript
(function(_,e
/*``*/) {
try { return '<li id="' + (e?e(_.id,'id'):_.id||(_.id==undefined?'':_.id)) + '"><div class="view"><input class="toggle" type="checkbox"><label>' + (e?e(_.name,'name'):_.name||(_.name==undefined?'':_.name)) + '</label><button class="destroy"/></div><input class="edit" value="' + (e?e(_.name,'name'):_.name||(_.name==undefined?'':_.name)) + '"></li>' } catch(e) { return '' }
})
```

La versione semplificata:

```javascript
(function(_
/*``*/) {
 try { return '<li id="' + (_.id||(_.id==undefined?'':_.id)) + '"><div class="view"><input class="toggle" type="checkbox"><label>' + (_.name||(_.name==undefined?'':_.name)) + '</label><button class="destroy"/></div><input class="edit" value="' + (_.name||(_.name==undefined?'':_.name)) + '"></li>' } catch(e) { return '' }
})
```

# Le REGEX della render

Andiamo ad analizzare la REGEX che ci permette di prelevare i "segnaposti" contraddistinti con le parentesi graffe {} nel nostro template:

```re
/{\s*([\w\.]+)\s*}/g
```

questa regex prende una parentesi graffa, qualsiasi carattere spazio \s*, cattura un gruppo di lettere con \w, matcha il punto \. e di nuovo una serie di spazi e la chiusura della graffa: https://regex101.com/

L'altra espressione regolare va ad eliminare tutti gli a capo \r (carriage return ASCII 13) e \n (newline ASCII 10).

In pratica senza questa regola, il mio template lo dovrei scrivere così, invece grazie a questa regola lo scrivo come sopra:

```html
<script type="html/todo" type="text/template"><li id="{id}"><div class="view"><input class="toggle" type="checkbox"><label>{name}</label><button class="destroy"/></div><input class="edit" value="{name}"></li></script>
```

Vediamo come funziona il $1 nel replace. Prendiamo questo codice di esempio:

```javascript
num="11222333431";
re = /(\d+)(\d{3})/;
num.replace(re, "$1,$2");
```

stamperà il valore "11222333,431". Il $n è chiamato "replacement pattern", quello che è di fatto l'interpolazione di stringa introdotta con ES6 ${...}. Il $n rappresenta l'ennesimo gruppo catturato dalla regexp. In questo caso la mia regex cattura due gruppi, di digit, il cui ultimo gruppo è composto dalle ultime 3 digit. Così $1=11222333 e $2=431.

Se la render è richiamata con l'ultimo valore a true:

```javascript
var el = riot.render(template, item, true);
```

allora farò l'escape dei caratteri &, ", < e > con la render_escape, tramite la regex: /[&\"<>]/g.

Nel codice originale abbiamo:

```javascript
(e?e(_.$1,'$1'):_.$1||(_.$1==undefined?'':_.$1)
```

è un operatore ternario, una if-then-else in linea. In pratica se è definita la mia funzione di escape (la e), allora la richiamo passando i valori dei campi contenuti nel mio dataset, in questo caso $1 assumerà i valori di id e name in quanto _ è un oggetto {id:..., name:....}, oppure (la OR || ) se il valore di _.$1 è undefined ritornerò '' o il valore stesso _.$1.

# Giorno 2

Per questo secondo giorno andiamo ad analizzare la fase in cui inseriamo un oggetto nella todo list proposta dal progetto RiotJS.
Prima di addentrarci all'analisi del codice, dobbiamo preparare il nostro "campo", creando una sezione del codice HTML in cui riceviamo un input e che andremo a costruire con il nostro template (li) grazie alla render e i valori che passiamo. Pertanto nell'index.html andiamo ad inserire:

```html
<section id="todoapp">
    <header id="header">
      <h1>Elenco Todos</h1>
      <label>TODO:</label>
      <input id="new-todo" placeholder="Cosa ti serve?" autofocus>
    </header>
</section>
```

Qui è importante l'id new-todo che andremo ad utilizzare per prelevare il valore inserito dall'utente.
Lo scopo è quello di catturare il valore dell'input, inserirlo in un database e visualizzarlo all'interno di una unordered-list (ul) tramite l'elemento template li. Ci servirà un oggetto todo che sarà il nostro MODEL.

Creato l'lemento input, dobbiamo creare un finto database, e per questo scopo creiamo un file db.js che sarà una funzione costruttore e che farà il salvataggio dei dati nel local storage del browser e ritorna un oggetto con due metodi: get e put. Il primo preleva i dati dal database (grazie alla key passata) ed il secondo inserisce il valore:

```javascript
function DB(key) {
  var store = window.localStorage;

  return {
    get: function() {
      return JSON.parse(store[key] || '{}')
    },

    put: function(data) {
      store[key] = JSON.stringify(data)
    }
  }
}
```

Creiamo ora il nostro modello che rappresenta un ToDo, per questo creiamo il file todo.js (nel progetto RioJS reale il nome è api.js).
Questo file consiste in una funzione costruttore, che prende il database ed estende l'oggetto che viene ritornato (implicitamente!) con il metodo riot.observable. Todo restituisce un oggetto apparentemente con 2 metodi, in realtà, questo oggetto è esteso tramite riot.observale, questo renderà il nostro oggetto capace di "ascoltare" eventi e reagire in base a questi.

```javascript
function Todo(db) {
  
  db = db || DB('todo-items');
  
  var self = riot.observable(this),
    items = db.get();

  self.add = function(name) {
    var item = { id: "_" + ("" + Math.random()).slice(2), name: name }
    items[item.id] = item;
    self.trigger("add", item);
  }

  self.on("add remove toggle edit", function() {
    db.put(items);
  })
}
```

Nel nostro codice dell'applicazione, l'app.js, possiamo simulare l'addEventListener, grazie all'on di riot.observale.
Senza entrare nel dettaglio, spieghiamo come avviene il giro del codice:

1. L'utente digita il testo;
2. Catturiamo il testo digitato con l'addEventListener che inseriamo nel campo input;
3. L'addEventListener richiamerà la add di Todo per inserire il testo nel database;
4. Viene richiamato il metodo trigger (di riot.observable) per richiamare l'evento add;
5. L'evento add attiverà la funzione add che effettuerà il render dell'elemento li.

Complicato? Continua...

# Giorno 3

Prima di cominciare, volevo porre attenzione ad alcuni cambiamenti nel codice e motivarli:

1. In index.html lo scipt del template ha due attributi type. Uno è di troppo;
2. In app.js ho cambiato la variabile todo in todos perchè rappresenta meglio il concetto di contenitore di todo. E' superfluo esplicitare l'oggetto window;
3. In app.js ho cambiato il nome della funzione add per il refresh del render in quanto si confonde con la funzione add dell'oggetto Todos. L'ho chiamata refresh e si occupa di invocare la render di Riot;
4. Il file Todo.js diventa Todos.js e al suo interno items diventa todos e item diventa todo;
5. Sempre in Todos.js l'invocazione del metodo on avviene solo per l'evento add, l'unico per il momento codificato e quindi per una migliore e più facile comprensione;

Facciamo una breve sintesi di ciò che abbiamo visto fino ad ora:

1. Abbiamo creato uno snippet che rappresenta il nostro template e che individueremo tramite l'attributo html "[type='html/todo']" grazie alla querySelector;
2. In index.html creiamo la sezione del campo input con id pari a "new-todo" e il codice della lista ul con id uguale a "todo-list";
3. Nel file dell'applicazione app.js andiamo a prenderci il riferimento alla lista (l'elemento root) ed il codice del nostro template, grazie alla innerHTML;
4. Creiamo una funzione costruttore Todos che rappresenta il modello che raccoglierà i nostri todo, ovvero un oggetto javascript con i metodi: add, trigger e on;
5. Gli items verranno aggiunti al Local Storage del browser, in Chrome lo troviamo sotto a "Strumenti per Sviluppatori" in Application -> Storage -> Local Storage -> File e nel pannello Key troviamo il "todo-items";
6. Il Todos che costruirò avrà una estensione grazie a Riot dei seguenti metodi: on e trigger, mentre il metodo add è la logica che costruirà un nuovo oggetto todo e lo inserirà nell'array todos e avvierà, con il trigger, il metodo add;
7. Registro, grazie al metodo on di Riot, la funzione rispetto ad un evento avviato dal trigger del punto 6;
8. Viene registrata la funzione refresh per l'evento on e la funzione anonima per l'allineamento al database sempre per l'eveno on;
9. Quando l'utente invia il nuovo todo, viene invocato il metodo add che, grazie al trigger, avvia l'evento "add". Questo evento ha 2 funzioni registrate: il sync del db e il refresh del DOM.

Il metodo _on_ di Riot accetta una stringa di eventi ed una funzione, e costruisce un oggetto di callbacks, la cui chiave è il nome dell'evento ed il valore un array di funzioni. In questo modo ad un evento (add) associo n funzioni. Nel mio caso associamo all'evento 'add' la funzione anonima di sincronizzazione al database e la funzione refresh per richiamare la render di Riot.
Posso registrare anche la medesima funzione per più eventi, passando una stringa di eventi, come detto ad inzio: 

```javascript
self.on("add edit update delete", function() {...});
```

grazie all'espressione regolare, prelevo ogni singola parola (evento) separata da uno (o più) spazio. Potevo avere una regex del tipo: /[^,\s]+/g per separare i nomi degli eventi con spazi e/o virgole.
Per ogni evento che trovo, ne prendo il nome dell'evento, la posizione e la funzione fn da associare all'evento.
Se ho più eventi con la stessa funzione, creo una proprietà typed alla funzione fn (una funzione è un oggetto e posso estenderla con altre proprietà). Questo mi servirà nella trigger.

La funzione _trigger_ di Riot accetta il nome dell'evento. Preleva gli argomenti facendo una slice di arguments e scartando il primo (indice 0) argomento che è il nome dell'evento stesso. 
Inizializza l'array fns su cui effettua un ciclo for per ogni funzione in ascolto all'evento passato. Il ciclo si interrompe nel momento in cui l'assegnazione fn = fns[i] è "undefined".

La funzione viene invocata tramite la apply, il cui argomento this è l'elemento Todos e gli argomenti sono l'array args oppure la concatenazione del nome della funzione e i loro argomenti. Ignoriamo per il momento l'impostazione fn.one,in quanto nel codice "semplificato" abbiamo tolto la possibilità di impostare la proprietà one della funzione, pertanto in questo contesto non ha senso.

La apply serve per eseguire una funzione, cambiandone il contesto e cioè il this. A differenza della call, la apply vuole un array di argomenti anzichè un elenco di variabili.

La apply viene invocata passando gli argomenti oppure la concatenazione degli argomenti ed il nome dell'evento se la funzione fn passata alla on è utilizzata da più eventi (typed = true).