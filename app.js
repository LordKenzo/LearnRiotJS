
/*** day1 */

var root = document.getElementById('todo-list');

var template = document.querySelector("[type='html/todo']").innerHTML;

var item = {
  id: 'item',
  name: 'Prova'
};
var el = riot.render(template, item, true);
root.innerHTML = el;

/*** day2 */


window.todo = new Todo();

//E' ERRATO PENSARE -> todo.addEventListener('add', add);
todo.on("add", add);

document.getElementById("new-todo").addEventListener("keyup", function(e) {
  var val = this.value;
  if (e.which == 13 && val) {
    todo.add(val);
    this.value = "";
  }
});

function add(item) {
  if (this.id) item = this;

  root.innerHTML += riot.render(template, item, true);
}

