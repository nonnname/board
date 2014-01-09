function nl2br (str) {
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
}

function idToProject(id) {
  return {"883372" : "B", "597637": "R"}[id];
}

function idToIcon(id) {
  return {"883372" : "https://lh6.ggpht.com/89g3m4FaSNjBKjfQOkhYTj58EtBOP-DQz1Ck6fILuEkCE_o9iV1VSIgqgbLKsn3_Vg=w300", "597637": "https://lh6.ggpht.com/fJUZE0OYXy0XDQbdAE-mefV5NmZVO-7jx5INEGTuYZOd61i8vMG-pexe80Go95v5lw=w300"}[id];
}

//todo: disable any try to save models
//Backbone.sync = function() {}

var S = $.localStorage;
var D = new Dashboard({ storage: $.localStorage });

//go
!function(){
  
  var $head = $("#head")

  new VNav({ model: D, el : document.getElementById("head") });
  new VMain({ model: D, el : document.getElementById("main") });
  new VProjectsMenu({ el : $head.find(".projects")[0], model: D });
  new VFilerTypes({ model: D, el : document.getElementById("types") });
  new VModalDetails({ model: D, el : document.getElementById("modal-details") });

  if(!S.isEmpty("token")) {
    console.log("start with token");
    D.start(S.get("token"));
  }
  // DEBUG $(".modal").modal({ show: true});

}()
