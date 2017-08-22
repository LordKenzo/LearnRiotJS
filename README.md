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
  <script type="html/todo" type="text/template">
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

