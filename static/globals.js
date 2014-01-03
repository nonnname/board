function idToProject(id) {
  return {"883372" : "B", "597637": "R"}[id];
}

function idToIcon(id) {
  return {"883372" : "https://lh6.ggpht.com/89g3m4FaSNjBKjfQOkhYTj58EtBOP-DQz1Ck6fILuEkCE_o9iV1VSIgqgbLKsn3_Vg=w300", "597637": "https://lh6.ggpht.com/fJUZE0OYXy0XDQbdAE-mefV5NmZVO-7jx5INEGTuYZOd61i8vMG-pexe80Go95v5lw=w300"}[id];
}

//todo: disable any try to save models
//Backbone.sync = function() {}

//go
!function(){
  
  var D = new Dashboard();

  var $head = $("#head")

  new VNav({ model: D, el : document.getElementById("head") });
  new VMain({ model: D, el : document.getElementById("main") });
  new VProjectsMenu({ el : $head.find(".projects")[0], model: D });
  new VFilerTypes({ model: D, el : document.getElementById("types") });

}()
