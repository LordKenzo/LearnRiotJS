

var root = document.getElementById('todo-list');

var template = document.querySelector("[type='html/todo']").innerHTML;

var item = {
  id: 'item',
  name: 'Prova'
};
var el = riot.render(template, item, true);
root.innerHTML = el;