function Todos(db) {
  
  db = db || DB('todo-items');
  
  var self = riot.observable(this),
    todos = db.get();

  self.add = function(name) {
    var todo = { id: "_" + ("" + Math.random()).slice(2), name: name }
    todos[todo.id] = todo;
    self.trigger("add", todo);
  }

  self.on("add", function() {
    console.log('database sync...')
    db.put(todos);
  });
}