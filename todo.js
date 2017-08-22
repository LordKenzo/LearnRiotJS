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